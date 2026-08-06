import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import {
  assignmentStatus,
  isCurrentManagerAssignment,
  isOperationalInternshipStatus,
  isCurrent,
  isOngoingOrScheduled,
  managerAssignmentDocumentSchema as managerAssignmentSchema,
  placementDocumentSchema as placementSchema,
  teammateAssignmentDocumentSchema as teammateAssignmentSchema,
  type DateRange,
} from "@/server/assignments/domain";
import {
  assertManagerAccessSnapshots,
  readManagerMutationAccess,
} from "@/server/assignments/manager-access";
import { adminFirestore } from "@/server/firebase/admin";
import { recordFirestoreReadPath } from "@/server/firebase/read-diagnostics";
import { parseInternshipDocument } from "@/server/internships/repository";
import { getManagerProgressHub } from "@/server/progress-hub/service";
import {
  getStageChecklist,
  stageProgressSchema,
} from "@/server/stage-checklists/service";
import { getStageChecklistTemplate } from "@/lib/stage-checklists/templates";
import { progressHubTimeZone } from "@/lib/progress-hub/week";
import { appUserSchema } from "@/server/users/app-user";
import {
  internshipStages,
  internshipStatuses,
  type InternshipStage,
  type InternshipStatus,
} from "@/lib/internships/types";
import {
  managerAttentionSignals,
  type ManagerAttentionSignalKey,
  type ManagerPortfolioDetailDto,
  type ManagerPortfolioDto,
  type ManagerPortfolioItemDto,
  type ManagerPortfolioQuery,
} from "@/lib/manager-portfolio/types";
import { attentionSignal, filterAndSortPortfolio, portfolioMetrics } from "./domain";

const statusValues = internshipStatuses.map(({ value }) => value) as [
  InternshipStatus,
  ...InternshipStatus[],
];
const stageValues = internshipStages.map(({ value }) => value) as [
  InternshipStage,
  ...InternshipStage[],
];
const attentionValues = managerAttentionSignals.map(({ value }) => value) as [
  ManagerAttentionSignalKey,
  ...ManagerAttentionSignalKey[],
];

export const managerPortfolioQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(statusValues).optional(),
  stage: z.enum(stageValues).optional(),
  attention: z.enum(attentionValues).optional(),
  mentorId: z.string().min(1).max(120).optional(),
  sort: z
    .enum([
      "internName",
      "startsAt",
      "currentStage",
      "latestActivity",
      "overdueActions",
    ])
    .default("internName"),
  direction: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.union([z.literal(10), z.literal(20), z.literal(50)]).default(20),
});

export function normalizeManagerPortfolioQuery(input: unknown): ManagerPortfolioQuery {
  const record =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const parsed = managerPortfolioQuerySchema.safeParse({
    search: typeof record.search === "string" ? record.search : undefined,
    status: typeof record.status === "string" ? record.status : undefined,
    stage: typeof record.stage === "string" ? record.stage : undefined,
    attention: typeof record.attention === "string" ? record.attention : undefined,
    mentorId: typeof record.mentorId === "string" ? record.mentorId : undefined,
    sort: typeof record.sort === "string" ? record.sort : undefined,
    direction: typeof record.direction === "string" ? record.direction : undefined,
    page:
      typeof record.page === "string" && /^\d+$/.test(record.page)
        ? Number(record.page)
        : undefined,
    pageSize:
      typeof record.pageSize === "string" && /^\d+$/.test(record.pageSize)
        ? Number(record.pageSize)
        : undefined,
  });
  return (
    parsed.success ? parsed.data : managerPortfolioQuerySchema.parse({})
  ) as ManagerPortfolioQuery;
}

export const statusCommandSchema = z.object({
  action: z.enum(["pause", "resume", "cancel", "complete"]),
  reason: z.string().trim().min(1).max(500).optional(),
  completionDate: z.string().date().optional(),
});

export const managerAssignmentInputSchema = z.object({
  managerUserId: z.string().min(1),
});

export const expectedEndDateInputSchema = z.object({
  endsAt: z.string().date().optional(),
});

export const removeManagerAssignmentInputSchema = z.object({
  managerUserId: z.string().min(1),
  replacementManagerUserId: z.string().min(1).optional(),
});

const statusHistorySchema = z.object({
  previousStatus: z.enum(statusValues),
  newStatus: z.enum(statusValues),
  changedAt: z.instanceof(Timestamp),
  changedBy: z.string().min(1),
  reason: z.string().optional(),
});
export function areRequiredChecklistItemsComplete(
  items: readonly { key: string; type: "required" | "recommended" }[],
  progressItems: Record<string, { completed: boolean }>,
) {
  return items
    .filter((item) => item.type === "required")
    .every((item) => progressItems[item.key]?.completed === true);
}

function timestamp(value: Timestamp | undefined) {
  return value?.toDate().toISOString();
}

function currentManagerAssignment(data: unknown, now = Timestamp.now()) {
  return isCurrentManagerAssignment(managerAssignmentSchema.parse(data), now);
}

function dateInApplicationTimeZone(value: Timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value.toDate());
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day", string>;
  return `${values.year}-${values.month}-${values.day}`;
}

function calendarDayDistance(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) /
    86_400_000,
  );
}

async function getUserSummaries(userIds: Iterable<string>) {
  const ids = [...new Set(userIds)];
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

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  map: (value: T) => Promise<R>,
) {
  const results: R[] = new Array(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const index = next++;
        results[index] = await map(values[index]);
      }
    }),
  );
  return results;
}

function latestActivity(item: {
  progressHub: Awaited<ReturnType<typeof getManagerProgressHub>>;
}) {
  const values = [
    item.progressHub.summary.latestSharedCheckInAt,
    ...item.progressHub.reflections.map((reflection) => reflection.updatedAt),
    ...item.progressHub.mentorCheckIns.map((checkIn) => checkIn.updatedAt),
    ...item.progressHub.agendaItems.map((agenda) => agenda.updatedAt),
    ...item.progressHub.sharedNotes.map((note) => note.updatedAt),
    ...item.progressHub.actionItems.map((action) => action.updatedAt),
  ].filter((value): value is string => Boolean(value));
  return values.sort((a, b) => b.localeCompare(a))[0];
}

export function deriveAttentionSignals(
  item: Omit<ManagerPortfolioItemDto, "attentionSignals">,
  now = Timestamp.now(),
) {
  const signals = [];
  if (item.reflectionState === "missing")
    signals.push(attentionSignal("reflectionMissing"));
  if (item.mentorCheckInState === "missing") {
    signals.push(attentionSignal("mentorCheckInMissing"));
  } else if (item.mentorCheckInState === "draft") {
    signals.push(attentionSignal("mentorCheckInDraft"));
  }
  if (item.overdueActionItems) {
    signals.push(attentionSignal("overdueActions", { count: item.overdueActionItems }));
  }
  if (
    isOperationalInternshipStatus(item.status) &&
    !item.currentStageChecklist?.isStageCompleted &&
    item.currentStageChecklist?.readyToComplete
  ) {
    signals.push(attentionSignal("stageReadyToComplete"));
  }
  if (item.status === "paused") signals.push(attentionSignal("internshipPaused"));
  if (
    item.currentStage === "finalReview" &&
    item.currentStageChecklist?.isStageCompleted &&
    isOperationalInternshipStatus(item.status)
  ) {
    signals.push(attentionSignal("finalReviewCompletedAwaitingDecision"));
  }
  if (isOperationalInternshipStatus(item.status) && !item.mentorUserIds.length) {
    signals.push(attentionSignal("noCurrentMentor"));
  }
  if (item.endsAt && isOperationalInternshipStatus(item.status)) {
    const today = dateInApplicationTimeZone(now);
    const distance = calendarDayDistance(today, item.endsAt.slice(0, 10));
    if (distance >= 0 && distance <= 14) {
      signals.push(attentionSignal("endingSoon", { date: item.endsAt }));
    }
  }
  return signals;
}

export async function getManagerPortfolio(
  managerId: string,
  rawQuery: unknown,
): Promise<ManagerPortfolioDto> {
  recordFirestoreReadPath("manager-portfolio.get-portfolio");
  const query = normalizeManagerPortfolioQuery(rawQuery);
  const managerAssignments = await adminFirestore
    .collectionGroup("managerAssignments")
    .where("userId", "==", managerId)
    .get();

  const internshipRefs = [
    ...new Set(
      managerAssignments.docs.flatMap((doc) => {
        const parent = doc.ref.parent.parent;
        return parent && currentManagerAssignment(doc.data()) ? [parent] : [];
      }),
    ),
  ];

  if (!internshipRefs.length) {
    return {
      items: [],
      metrics: portfolioMetrics([]),
      total: 0,
      page: 1,
      pageSize: query.pageSize,
      totalPages: 0,
      mentorOptions: [],
      query,
    };
  }

  const internshipDocs = await adminFirestore.getAll(...internshipRefs);
  const validInternships = internshipDocs.flatMap((doc) => {
    if (!doc.exists) return [];
    return [{ ref: doc.ref, data: parseInternshipDocument(doc.data()) }];
  });

  const allUserIds = new Set<string>();
  validInternships.forEach((item) => allUserIds.add(item.data.internId));

  const itemsWithDetails = await mapWithConcurrency(
    validInternships,
    10,
    async ({ ref, data }) => {
      const [placementsSnap, teammateAssignmentsSnap] = await Promise.all([
        ref.collection("teamPlacements").get(),
        ref.collection("teammateAssignments").get(),
      ]);

      const placements = placementsSnap.docs.map((d) => ({
        id: d.id,
        ...placementSchema.parse(d.data()),
      }));

      const teammateAssignments = teammateAssignmentsSnap.docs.map((d) => ({
        id: d.id,
        ...teammateAssignmentSchema.parse(d.data()),
      }));

      const currentPlacement = placements.find((p) => isCurrent(p)) ?? placements[0];

      const currentMentors = teammateAssignments.filter(
        (t) => t.responsibilities.includes("mentor") && isCurrent(t),
      );

      currentMentors.forEach((m) => allUserIds.add(m.teammateUserId));

      const checklist = await getStageChecklist(ref, data, managerId);
      const progressHub = await getManagerProgressHub(
        ref,
        data,
        managerId,
        checklist,
      );

      const latestSharedActivityAt = latestActivity({ progressHub });

      const baseItem = {
        id: ref.id,
        intern: {
          id: data.internId,
          displayName: "",
          email: "",
        },
        status: data.status,
        currentStage: data.currentStage,
        startsAt: timestamp(data.startsAt)!,
        endsAt: timestamp(data.endsAt),
        currentStageChecklist: {
          requiredCompletedCount: checklist.requiredCompletedCount,
          requiredTotalCount: checklist.requiredTotalCount,
          readyToComplete: checklist.readyToComplete,
          isStageCompleted: checklist.isStageCompleted,
        },
        mentorNames: [],
        mentorUserIds: currentMentors.map((m) => m.teammateUserId),
        currentPlacement: currentPlacement
          ? { teamId: currentPlacement.teamId, teamTitle: "" }
          : undefined,
        reflectionState: progressHub.summary.reflectionState,
        mentorCheckInState: progressHub.summary.mentorCheckInState,
        openActionItems: progressHub.summary.openActionItems,
        overdueActionItems: progressHub.summary.overdueActionItems,
        nextDueAction: progressHub.summary.nextDueAction,
        unresolvedAgendaItems: progressHub.summary.unresolvedAgendaItems,
        latestSharedActivityAt,
      };

      const attentionSignals = deriveAttentionSignals(baseItem);

      return {
        ...baseItem,
        attentionSignals,
        currentPlacementTeamId: currentPlacement?.teamId,
      };
    },
  );

  const teamIds = [
    ...new Set(
      itemsWithDetails
        .map((i) => i.currentPlacementTeamId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [usersMap, teamDocs] = await Promise.all([
    getUserSummaries(allUserIds),
    teamIds.length
      ? adminFirestore.getAll(
        ...teamIds.map((id) => adminFirestore.collection("teams").doc(id)),
      )
      : [],
  ]);

  const teamsMap = new Map(
    teamDocs.flatMap((doc) =>
      doc.exists ? [[doc.id, doc.data()?.title as string] as const] : [],
    ),
  );

  const fullItems: ManagerPortfolioItemDto[] = itemsWithDetails.map((item) => {
    const internUser = usersMap.get(item.intern.id);
    const mentorNames = item.mentorUserIds.flatMap((id) => {
      const u = usersMap.get(id);
      return u ? [u.displayName] : [];
    });

    return {
      id: item.id,
      intern: {
        id: item.intern.id,
        displayName: internUser?.displayName ?? "Unknown intern",
        email: internUser?.email ?? "",
      },
      status: item.status,
      currentStage: item.currentStage,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      currentStageChecklist: item.currentStageChecklist,
      mentorNames,
      mentorUserIds: item.mentorUserIds,
      currentPlacement: item.currentPlacementTeamId
        ? {
          teamId: item.currentPlacementTeamId,
          teamTitle: teamsMap.get(item.currentPlacementTeamId) ?? "Unknown Team",
        }
        : undefined,
      reflectionState: item.reflectionState,
      mentorCheckInState: item.mentorCheckInState,
      openActionItems: item.openActionItems,
      overdueActionItems: item.overdueActionItems,
      nextDueAction: item.nextDueAction,
      unresolvedAgendaItems: item.unresolvedAgendaItems,
      latestSharedActivityAt: item.latestSharedActivityAt,
      attentionSignals: item.attentionSignals,
    };
  });

  const mentorOptions = [
    ...new Map(
      fullItems.flatMap((item) =>
        item.mentorUserIds.flatMap((id) => {
          const user = usersMap.get(id);
          return user ? [[id, { id, displayName: user.displayName }] as const] : [];
        }),
      ),
    ).values(),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName));

  const metrics = portfolioMetrics(fullItems);
  const filteredAndSorted = filterAndSortPortfolio(fullItems, query);
  const total = filteredAndSorted.length;
  const totalPages = Math.ceil(total / query.pageSize) || 1;
  const page = Math.min(query.page, totalPages);
  const startIndex = (page - 1) * query.pageSize;
  const paginatedItems = filteredAndSorted.slice(
    startIndex,
    startIndex + query.pageSize,
  );

  return {
    items: paginatedItems,
    metrics,
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
    mentorOptions,
    query,
  };
}

export async function getManagerPortfolioDetail(
  internshipId: string,
  managerId: string,
): Promise<ManagerPortfolioDetailDto> {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const [internshipSnap, managerSnap, userSnap] = await Promise.all([
    ref.get(),
    ref.collection("managerAssignments").doc(managerId).get(),
    adminFirestore.collection("users").doc(managerId).get(),
  ]);

  const internship = assertManagerAccessSnapshots(
    internshipSnap,
    userSnap,
    managerSnap,
    managerId,
  );

  const [
    placementsSnap,
    teammateAssignmentsSnap,
    managerAssignmentsSnap,
    statusHistorySnap,
    eligibleManagers,
    eligibleTeammates,
  ] = await Promise.all([
    ref.collection("teamPlacements").orderBy("startsAt", "desc").get(),
    ref.collection("teammateAssignments").orderBy("startsAt", "desc").get(),
    ref.collection("managerAssignments").get(),
    ref.collection("statusHistory").orderBy("changedAt", "desc").get(),
    adminFirestore
      .collection("users")
      .where("active", "==", true)
      .where("roles", "array-contains", "manager")
      .get(),
    adminFirestore
      .collection("users")
      .where("active", "==", true)
      .where("roles", "array-contains", "teammate")
      .get(),
  ]);

  const placements = placementsSnap.docs.map((doc) => ({
    id: doc.id,
    ...placementSchema.parse(doc.data()),
  }));

  const teammateAssignments = teammateAssignmentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...teammateAssignmentSchema.parse(doc.data()),
  }));

  const managerAssignments = managerAssignmentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...managerAssignmentSchema.parse(doc.data()),
  }));

  const statusHistory = statusHistorySnap.docs.flatMap((doc) => {
    const p = statusHistorySchema.safeParse(doc.data());
    return p.success ? [{ id: doc.id, ...p.data }] : [];
  });

  const allUserIds = new Set<string>([
    internship.internId,
    ...managerAssignments.map((m) => m.userId),
    ...teammateAssignments.map((t) => t.teammateUserId),
    ...statusHistory.map((s) => s.changedBy),
  ]);

  const teamIds = [
    ...new Set([
      ...placements.map((p) => p.teamId),
      ...teammateAssignments.map((t) => t.teamId),
    ]),
  ];

  const [usersMap, teamDocs] = await Promise.all([
    getUserSummaries(allUserIds),
    teamIds.length
      ? adminFirestore.getAll(
        ...teamIds.map((id) => adminFirestore.collection("teams").doc(id)),
      )
      : [],
  ]);

  const teamsMap = new Map(
    teamDocs.flatMap((doc) =>
      doc.exists ? [[doc.id, doc.data()?.title as string] as const] : [],
    ),
  );

  const checklist = await getStageChecklist(ref, internship, managerId);
  const progressHub = await getManagerProgressHub(
    ref,
    internship,
    managerId,
    checklist,
  );

  const currentPlacement = placements.find((p) => isCurrent(p)) ?? placements[0];
  const currentMentors = teammateAssignments.filter(
    (t) => t.responsibilities.includes("mentor") && isCurrent(t),
  );

  const internUser = usersMap.get(internship.internId);
  const latestSharedActivityAt = latestActivity({ progressHub });

  const portfolioItemBase = {
    id: ref.id,
    intern: {
      id: internship.internId,
      displayName: internUser?.displayName ?? "Unknown intern",
      email: internUser?.email ?? "",
    },
    status: internship.status,
    currentStage: internship.currentStage,
    startsAt: timestamp(internship.startsAt)!,
    endsAt: timestamp(internship.endsAt),
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
    latestSharedActivityAt,
  };

  const attentionSignals = deriveAttentionSignals(portfolioItemBase);

  const isOperational = isOperationalInternshipStatus(internship.status);

  return {
    internship: {
      ...portfolioItemBase,
      attentionSignals,
      checklist,
      progressHub,
    },
    managerAssignments: managerAssignments
      .map((m) => ({
        userId: m.userId,
        displayName: usersMap.get(m.userId)?.displayName ?? "Unknown manager",
        startsAt: timestamp(m.startsAt),
        endsAt: timestamp(m.endsAt),
        current: isCurrentManagerAssignment(m),
      }))
      .sort((a, b) => Number(b.current) - Number(a.current)),
    statusHistory: statusHistory.map((s) => ({
      id: s.id,
      previousStatus: s.previousStatus,
      newStatus: s.newStatus,
      changedAt: timestamp(s.changedAt)!,
      changedBy: usersMap.get(s.changedBy)?.displayName ?? s.changedBy,
      reason: s.reason,
    })),
    placements: placements.map((p) => ({
      id: p.id,
      teamId: p.teamId,
      teamTitle: teamsMap.get(p.teamId) ?? "Unknown Team",
      startsAt: timestamp(p.startsAt)!,
      endsAt: timestamp(p.endsAt),
      current: isCurrent(p),
      status: assignmentStatus(p),
    })),
    teammateAssignments: teammateAssignments.map((t) => ({
      id: t.id,
      teammateUserId: t.teammateUserId,
      teammateName: usersMap.get(t.teammateUserId)?.displayName ?? "Unknown teammate",
      teamId: t.teamId,
      teamTitle: teamsMap.get(t.teamId) ?? "Unknown Team",
      responsibilities: t.responsibilities,
      startsAt: timestamp(t.startsAt)!,
      endsAt: timestamp(t.endsAt),
      current: isCurrent(t),
      status: assignmentStatus(t),
    })),
    eligibleManagers: eligibleManagers.docs.map((doc) => {
      const u = appUserSchema.parse(doc.data());
      return {
        id: doc.id,
        displayName: u.displayName,
        email: u.email,
        identityState: u.identityState,
      };
    }),
    eligibleTeammates: eligibleTeammates.docs.map((doc) => {
      const u = appUserSchema.parse(doc.data());
      return {
        id: doc.id,
        displayName: u.displayName,
        email: u.email,
        identityState: u.identityState,
      };
    }),
    capabilities: {
      canManage: isOperational,
      canEditExpectedEnd: isOperational,
      canManageManagers: isOperational,
      canManagePlacements: isOperational,
      canManageTeammates: isOperational,
      canChangeStatus: isOperational,
      canTransitionStatus: isOperational,
    },
  };
}

export async function transitionInternshipStatus(
  internshipId: string,
  managerId: string,
  command: z.infer<typeof statusCommandSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      ref,
      managerId,
    );

    let nextStatus: InternshipStatus;
    switch (command.action) {
      case "pause":
        if (internship.status !== "active") {
          throw new Error("Only active internships can be paused.");
        }
        nextStatus = "paused";
        break;
      case "resume":
        if (internship.status !== "paused") {
          throw new Error("Only paused internships can be resumed.");
        }
        nextStatus = "active";
        break;
      case "cancel":
        if (!isOperationalInternshipStatus(internship.status)) {
          throw new Error("Completed or cancelled internships cannot be cancelled.");
        }
        nextStatus = "cancelled";
        break;
      case "complete":
        if (!isOperationalInternshipStatus(internship.status)) {
          throw new Error("Completed or cancelled internships cannot be completed.");
        }
        nextStatus = "completed";
        break;
    }

    if (nextStatus === "completed") {
      if (internship.currentStage !== "finalReview") {
        throw new Error("Only Final Review internships can be completed.");
      }
      const progressSnapshot = await transaction.get(
        ref.collection("stageProgress").doc("finalReview"),
      );
      if (!progressSnapshot.exists) {
        throw new Error("Final Review is not complete.");
      }
      const progress = stageProgressSchema.parse(progressSnapshot.data());
      if (progress.stage !== "finalReview" || !progress.completedAt) {
        throw new Error("Complete every required Final Review item first.");
      }
    }

    const completionDate =
      command.completionDate ?? dateInApplicationTimeZone(Timestamp.now());
    const completedAt = Timestamp.fromDate(new Date(`${completionDate}T00:00:00.000Z`));
    if (
      nextStatus === "completed" &&
      completedAt.toMillis() < internship.startsAt.toMillis()
    ) {
      throw new Error(
        "The completion date cannot be before the internship start date.",
      );
    }

    const guardRef = adminFirestore
      .collection("internshipGuards")
      .doc(internship.internId);

    transaction.update(ref, {
      status: nextStatus,
      ...(nextStatus === "completed" || nextStatus === "cancelled"
        ? { endsAt: completedAt }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });

    if (nextStatus === "completed" || nextStatus === "cancelled") {
      transaction.delete(guardRef);
    } else {
      transaction.set(
        guardRef,
        {
          internshipId: ref.id,
          status: nextStatus,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: managerId,
        },
        { merge: true },
      );
    }

    const statusHistoryRef = ref.collection("statusHistory").doc();
    transaction.create(statusHistoryRef, {
      previousStatus: internship.status,
      newStatus: nextStatus,
      changedAt: FieldValue.serverTimestamp(),
      changedBy: managerId,
      ...(command.reason?.trim() ? { reason: command.reason.trim() } : {}),
    });
  });
}

export async function updateExpectedEndDate(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof expectedEndDateInputSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      ref,
      managerId,
    );

    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }

    transaction.update(
      ref,
      input.endsAt
        ? {
          endsAt: Timestamp.fromDate(new Date(`${input.endsAt}T00:00:00.000Z`)),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: managerId,
        }
        : {
          endsAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: managerId,
        },
    );
  });
}

export async function addManagerAssignment(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof managerAssignmentInputSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      ref,
      managerId,
    );

    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }

    const newManagerRef = adminFirestore.collection("users").doc(input.managerUserId);
    const newManagerSnap = await transaction.get(newManagerRef);

    if (!newManagerSnap.exists) {
      throw new Error("The selected user does not exist.");
    }

    const newManagerUser = appUserSchema.parse(newManagerSnap.data());
    if (!newManagerUser.active || !newManagerUser.roles.includes("manager")) {
      throw new Error("The selected user is not an eligible manager.");
    }

    const assignmentRef = ref.collection("managerAssignments").doc(input.managerUserId);
    const existingSnap = await transaction.get(assignmentRef);

    if (existingSnap.exists && currentManagerAssignment(existingSnap.data())) {
      throw new Error("This manager is already assigned.");
    }

    transaction.set(
      assignmentRef,
      {
        userId: input.managerUserId,
        startsAt: FieldValue.serverTimestamp(),
        endsAt: FieldValue.delete(),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: managerId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: managerId,
      },
      { merge: true },
    );
  });
}

export async function removeManagerAssignment(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof removeManagerAssignmentInputSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      ref,
      managerId,
    );

    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }

    const allAssignmentsSnap = await transaction.get(ref.collection("managerAssignments"));
    const currentAssignments = allAssignmentsSnap.docs.filter((doc) =>
      currentManagerAssignment(doc.data()),
    );

    if (
      currentAssignments.length === 1 &&
      currentAssignments[0].id === input.managerUserId
    ) {
      if (!input.replacementManagerUserId) {
        throw new Error(
          "A replacement manager is required when removing the final current manager.",
        );
      }

      if (input.replacementManagerUserId === input.managerUserId) {
        throw new Error("The replacement manager must be a different user.");
      }

      const replacementRef = adminFirestore
        .collection("users")
        .doc(input.replacementManagerUserId);
      const replacementSnap = await transaction.get(replacementRef);

      if (!replacementSnap.exists) {
        throw new Error("The replacement manager does not exist.");
      }

      const replacementUser = appUserSchema.parse(replacementSnap.data());
      if (!replacementUser.active || !replacementUser.roles.includes("manager")) {
        throw new Error("The replacement user is not an eligible manager.");
      }

      transaction.set(
        ref.collection("managerAssignments").doc(input.replacementManagerUserId),
        {
          userId: input.replacementManagerUserId,
          startsAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          createdBy: managerId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: managerId,
        },
        { merge: true },
      );
    }

    const targetRef = ref.collection("managerAssignments").doc(input.managerUserId);
    transaction.update(targetRef, {
      endsAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}
