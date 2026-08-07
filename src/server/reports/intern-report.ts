import "server-only";

import { listAchievements } from "@/server/achievements/service";
import {
  isCurrent,
  isCurrentManagerAssignment,
  isOngoingOrScheduled,
  managerAssignmentDocumentSchema,
  placementDocumentSchema,
  teammateAssignmentDocumentSchema,
} from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/repository";
import { deriveAttentionSignals } from "@/server/manager-portfolio/service";
import { getManagerProgressHub, getMentorProgressHub } from "@/server/progress-hub/service";
import { getStageChecklist } from "@/server/stage-checklists/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { appUserSchema } from "@/server/users/app-user";

async function getUserSummaries(userIds: Iterable<string>) {
  const ids = [...new Set(userIds)].filter(Boolean);
  const documents = ids.length
    ? await adminFirestore.getAll(
      ...ids.map((id) => adminFirestore.collection("users").doc(id)),
    )
    : [];
  return new Map(
    documents.flatMap((document) => {
      if (!document.exists) return [];
      const user = appUserSchema.parse(document.data());
      return [[document.id, user] as const];
    }),
  );
}

export async function getInternReportData(internshipId: string, userId: string) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const [internshipSnap, userSnap, managerSnap, teammateSnaps] = await Promise.all([
    ref.get(),
    adminFirestore.collection("users").doc(userId).get(),
    ref.collection("managerAssignments").doc(userId).get(),
    ref.collection("teammateAssignments").where("teammateUserId", "==", userId).get(),
  ]);

  if (!internshipSnap.exists || !userSnap.exists) {
    throw new AuthorizationError("ROLE_REQUIRED", "Internship or user not found.");
  }

  const appUser = appUserSchema.parse(userSnap.data());
  if (!appUser.active) {
    throw new AuthorizationError("DISABLED", "User account is disabled.");
  }

  const isManager =
    appUser.roles.includes("manager") &&
    managerSnap.exists &&
    isCurrentManagerAssignment(managerAssignmentDocumentSchema.parse(managerSnap.data()));

  const isTeammate =
    appUser.roles.includes("teammate") &&
    teammateSnaps.docs.some((doc) => {
      const data = teammateAssignmentDocumentSchema.parse(doc.data());
      return isOngoingOrScheduled(data);
    });

  if (!isManager && !isTeammate) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not have permission to view this report.",
    );
  }

  const internship = parseInternshipDocument(internshipSnap.data());

  const [
    placementsSnap,
    teammateAssignmentsSnap,
    managerAssignmentsSnap,
    statusHistorySnap,
    achievements,
  ] = await Promise.all([
    ref.collection("teamPlacements").orderBy("startsAt", "desc").get(),
    ref.collection("teammateAssignments").orderBy("startsAt", "desc").get(),
    ref.collection("managerAssignments").get(),
    ref.collection("statusHistory").orderBy("changedAt", "desc").get(),
    listAchievements(internshipId, userId, true),
  ]);

  const placements = placementsSnap.docs.map((doc) => ({
    id: doc.id,
    ...placementDocumentSchema.parse(doc.data()),
  }));

  const teammateAssignments = teammateAssignmentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...teammateAssignmentDocumentSchema.parse(doc.data()),
  }));

  const managerAssignments = managerAssignmentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...managerAssignmentDocumentSchema.parse(doc.data()),
  }));

  const statusHistory = statusHistorySnap.docs.map((doc) => ({
    id: doc.id,
    previousStatus: doc.data().previousStatus as string,
    newStatus: doc.data().newStatus as string,
    changedAt: doc.data().changedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    changedBy: doc.data().changedBy as string,
    reason: doc.data().reason as string | undefined,
  }));

  const allUserIds = new Set<string>([
    internship.internId,
    ...teammateAssignments.map((t) => t.teammateUserId),
    ...managerAssignments.map((m) => m.userId),
    ...statusHistory.map((s) => s.changedBy),
  ]);

  const teamIds = [
    ...new Set([...placements.map((p) => p.teamId), ...teammateAssignments.map((t) => t.teamId)]),
  ];

  const [usersMap, teamDocs, checklist, timeline] = await Promise.all([
    getUserSummaries(allUserIds),
    teamIds.length
      ? adminFirestore.getAll(...teamIds.map((id) => adminFirestore.collection("teams").doc(id)))
      : [],
    getStageChecklist(ref, internship, userId),
    getInternshipTimeline(internshipId, achievements),
  ]);

  const teamsMap = new Map(
    teamDocs.flatMap((doc) => (doc.exists ? [[doc.id, doc.data()?.title as string] as const] : [])),
  );

  const progressHub = isManager
    ? await getManagerProgressHub(ref, internship, userId, checklist)
    : await getMentorProgressHub(ref, internship, userId, checklist);

  const currentPlacement = placements.find((p) => isCurrent(p)) ?? placements[0];
  const currentMentors = teammateAssignments.filter(
    (t) => t.responsibilities.includes("mentor") && isCurrent(t),
  );

  const internUser = usersMap.get(internship.internId);

  const portfolioBase = {
    id: ref.id,
    intern: {
      id: internship.internId,
      displayName: internUser?.displayName ?? "Unknown intern",
      email: internUser?.email ?? "",
    },
    status: internship.status,
    currentStage: internship.currentStage,
    startsAt: internship.startsAt.toDate().toISOString(),
    endsAt: internship.endsAt?.toDate().toISOString(),
    currentStageChecklist: {
      requiredCompletedCount: checklist.requiredCompletedCount,
      requiredTotalCount: checklist.requiredTotalCount,
      readyToComplete: checklist.readyToComplete,
      isStageCompleted: checklist.isStageCompleted,
    },
    mentorNames: currentMentors.flatMap((m) => {
      const u = usersMap.get(m.teammateUserId);
      return u ? [u.displayName] : [];
    }),
    mentorUserIds: currentMentors.map((m) => m.teammateUserId),
    currentPlacement: currentPlacement
      ? {
        teamId: currentPlacement.teamId,
        teamTitle: teamsMap.get(currentPlacement.teamId) ?? "Unknown Team",
      }
      : undefined,
    reflectionState: progressHub.summary.reflectionState,
    mentorCheckInState: progressHub.summary.mentorCheckInState,
    openActionItems: progressHub.summary.openActionItems,
    overdueActionItems: progressHub.summary.overdueActionItems,
    nextDueAction: progressHub.summary.nextDueAction,
    unresolvedAgendaItems: progressHub.summary.unresolvedAgendaItems,
  };

  const attentionSignals = deriveAttentionSignals(portfolioBase);

  return {
    internship: {
      ...portfolioBase,
      checklist,
      progressHub,
      attentionSignals,
    },
    placements: placements.map((p) => ({
      ...p,
      teamTitle: teamsMap.get(p.teamId) ?? "Unknown Team",
      startsAt: p.startsAt.toDate().toISOString(),
      endsAt: p.endsAt?.toDate().toISOString(),
    })),
    teammateAssignments: teammateAssignments.map((t) => ({
      ...t,
      teammateName: usersMap.get(t.teammateUserId)?.displayName ?? "Unknown teammate",
      teamTitle: teamsMap.get(t.teamId) ?? "Unknown Team",
      startsAt: t.startsAt.toDate().toISOString(),
      endsAt: t.endsAt?.toDate().toISOString(),
    })),
    managerAssignments: managerAssignments.map((m) => ({
      ...m,
      displayName: usersMap.get(m.userId)?.displayName ?? "Unknown manager",
      startsAt: m.startsAt?.toDate().toISOString(),
      endsAt: m.endsAt?.toDate().toISOString(),
    })),
    statusHistory: statusHistory.map((s) => ({
      ...s,
      changedByName: usersMap.get(s.changedBy)?.displayName ?? s.changedBy,
    })),
    achievements: achievements.achievements,
    timeline: timeline.events,
    generatedAt: new Date().toISOString(),
  };
}

export type InternReportData = Awaited<ReturnType<typeof getInternReportData>>;
