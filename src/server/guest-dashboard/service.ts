import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  GuestDashboardDto,
  GuestDashboardItem,
} from "@/lib/guest-dashboard/types";
import { getStageChecklistTemplate } from "@/lib/stage-checklists/templates";
import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/repository";

function iso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

function current(value: { startsAt?: Timestamp; endsAt?: Timestamp }) {
  const now = Date.now();
  return Boolean(
    value.startsAt &&
    value.startsAt.toMillis() <= now &&
    (!value.endsAt || value.endsAt.toMillis() > now),
  );
}

export async function getGuestDashboard(): Promise<GuestDashboardDto> {
  const internships = await adminFirestore.collection("internships").get();
  const items = await Promise.all(
    internships.docs.map(async (document): Promise<GuestDashboardItem> => {
      const internship = parseInternshipDocument(document.data());
      const ref = document.ref;
      const [
        intern,
        placements,
        teammates,
        managers,
        stage,
        checkIns,
        achievements,
        history,
      ] = await Promise.all([
        adminFirestore.collection("users").doc(internship.internId).get(),
        ref.collection("teamPlacements").get(),
        ref.collection("teammateAssignments").get(),
        ref.collection("managerAssignments").get(),
        ref.collection("stageProgress").doc(internship.currentStage).get(),
        ref.collection("mentorCheckIns").orderBy("weekKey", "desc").limit(16).get(),
        ref.collection("achievements").orderBy("achievedOn", "desc").limit(20).get(),
        ref.collection("statusHistory").orderBy("changedAt", "desc").limit(30).get(),
      ]);
      const mentorIds = teammates.docs
        .map((entry) => entry.data())
        .filter((entry) => current(entry) && entry.responsibilities?.includes("mentor"))
        .map((entry) => entry.teammateUserId as string);
      const managerIds = managers.docs
        .map((entry) => entry.data())
        .filter(current)
        .map((entry) => entry.userId as string);
      const users = await adminFirestore.getAll(
        ...[...new Set([...mentorIds, ...managerIds])].map((id) =>
          adminFirestore.collection("users").doc(id),
        ),
      );
      const names = new Map(
        users.map((user) => [user.id, user.data()?.displayName as string | undefined]),
      );
      const placement = placements.docs.map((entry) => entry.data()).find(current);
      const team = placement
        ? await adminFirestore.collection("teams").doc(placement.teamId).get()
        : undefined;
      const template = getStageChecklistTemplate(internship.currentStage);
      const required = template.items.filter((item) => item.type === "required");
      const completed = required.filter(
        (item) => stage.data()?.items?.[item.key]?.completed,
      ).length;
      const feedback = checkIns.docs
        .map((entry) => entry.data())
        .find((entry) => entry.state === "shared");
      return {
        id: document.id,
        internName:
          (intern.data()?.displayName as string | undefined) ?? "Unknown intern",
        status: internship.status,
        currentStage: internship.currentStage,
        startsAt: internship.startsAt.toDate().toISOString(),
        dayOfInternship: Math.max(
          1,
          Math.floor((Date.now() - internship.startsAt.toMillis()) / 86_400_000) + 1,
        ),
        project: team?.data()?.title as string | undefined,
        mentors: mentorIds.map((id) => names.get(id) ?? "Unknown mentor"),
        managers: managerIds.map((id) => names.get(id) ?? "Unknown manager"),
        requiredCompletedCount: completed,
        requiredTotalCount: required.length,
        timeline: history.docs.flatMap((entry) => {
          const data = entry.data();
          const occurredAt = iso(data.changedAt);
          return occurredAt && typeof data.newStatus === "string"
            ? [{ id: entry.id, occurredAt, title: `Internship ${data.newStatus}` }]
            : [];
        }),
        mentorFeedback: feedback
          ? {
              progressSummary: feedback.progressSummary,
              strengthsObserved: feedback.strengthsObserved,
              sharedAt: iso(feedback.sharedAt),
            }
          : undefined,
        achievements: achievements.docs.flatMap((entry) => {
          const data = entry.data();
          return data.archivedAt
            ? []
            : [
                {
                  id: entry.id,
                  title: data.title,
                  category: data.category,
                  achievedOn: data.achievedOn,
                },
              ];
        }),
      };
    }),
  );
  return {
    items: items.sort((a, b) => a.internName.localeCompare(b.internName)),
    metrics: {
      total: items.length,
      active: items.filter((item) => item.status === "active").length,
      paused: items.filter((item) => item.status === "paused").length,
      completed: items.filter((item) => item.status === "completed").length,
    },
  };
}
