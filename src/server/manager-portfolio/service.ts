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

function deriveAttentionSignals(
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
    !item.currentStageChecklist.isStageCompleted &&
    item.currentStageChecklist.readyToComplete
  ) {
    signals.push(attentionSignal("stageReadyToComplete"));
  }
  if (item.status === "paused") signals.push(attentionSignal("internshipPaused"));
  if (
    item.currentStage === "finalReview" &&
    item.currentStageChecklist.isStageCompleted &&
    item.status !== "completed" &&
    item.status !== "cancelled"
  ) {
    signals.push(attentionSignal("finalReviewCompletedAwaitingDecision"));
  }
  if (!item.mentorUserIds.length) signals.push(attentionSignal("noCurrentMentor"));
  if (item.endsAt && isOperationalInternshipStatus(item.status)) {
    const days = calendarDayDistance(
      dateInApplicationTimeZone(now),
      dateInApplicationTimeZone(Timestamp.fromDate(new Date(item.endsAt))),
    );
    if (days >= 0 && days <= 14) {
      signals.push(attentionSignal("endingSoon", { date: item.endsAt }));
    }
  }
  return signals;
}

async function buildPortfolioItem(
  internshipRef: FirebaseFirestore.DocumentReference,
  managerId: string,
): Promise<ManagerPortfolioItemDto> {
  const internshipSnapshot = await internshipRef.get();
  if (!internshipSnapshot.exists) throw new Error("Internship not found.");
  const internship = parseInternshipDocument(internshipSnapshot.data());
  const [internSnapshot, placements, teammateAssignments] = await Promise.all([
    adminFirestore.collection("users").doc(internship.internId).get(),
    internshipRef.collection("teamPlacements").get(),
    internshipRef.collection("teammateAssignments").get(),
  ]);
  if (!internSnapshot.exists) throw new Error("Intern application user not found.");
  const intern = appUserSchema.parse(internSnapshot.data());
  const assignmentData = teammateAssignments.docs.map((document) => ({
    id: document.id,
    ...teammateAssignmentSchema.parse(document.data()),
  }));
  const currentMentors = assignmentData.filter(
    (assignment) =>
      assignment.responsibilities.includes("mentor") &&
      isOngoingOrScheduled(assignment as DateRange),
  );

  const placementList = placements.docs.map((d) => placementSchema.parse(d.data()));
  const placementTeamIds = [...new Set(placementList.map((p) => p.teamId))];

  const [users, teamDocs] = await Promise.all([
    getUserSummaries(currentMentors.map((assignment) => assignment.teammateUserId)),
    placementTeamIds.length
      ? adminFirestore.getAll(
        ...placementTeamIds.map((id) => adminFirestore.collection("teams").doc(id)),
      )
      : [],
  ]);

  const teamTitles = new Map(
    teamDocs.map((doc) => [doc.id, doc.data()?.title as string | undefined]),
  );

  const currentPlacement = placementList
    .filter((placement) => isOngoingOrScheduled(placement as DateRange))
    .sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis())[0];

  const checklist = await getStageChecklist(internshipRef, internship, managerId);
  const progressHub = await getManagerProgressHub(
    internshipRef,
    internship,
    managerId,
    checklist,
  );
  const base = {
    id: internshipRef.id,
    intern: {
      id: internship.internId,
      displayName: intern.displayName,
      email: intern.email,
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
    mentorNames: currentMentors.map(
      (assignment) =>
        users.get(assignment.teammateUserId)?.displayName ?? "Unknown mentor",
    ),
    mentorUserIds: currentMentors.map((assignment) => assignment.teammateUserId),
    currentPlacement: currentPlacement
      ? {
        teamId: currentPlacement.teamId,
        teamTitle: teamTitles.get(currentPlacement.teamId) ?? "Unknown team",
      }
      : undefined,
    reflectionState: progressHub.summary.reflectionState,
    mentorCheckInState: progressHub.summary.mentorCheckInState,
    openActionItems: progressHub.summary.openActionItems,
    overdueActionItems: progressHub.summary.overdueActionItems,
    nextDueAction: progressHub.summary.nextDueAction,
    unresolvedAgendaItems: progressHub.summary.unresolvedAgendaItems,
    latestSharedActivityAt: latestActivity({ progressHub }),
  } satisfies Omit<ManagerPortfolioItemDto, "attentionSignals">;
  return { ...base, attentionSignals: deriveAttentionSignals(base) };
}

async function currentManagedInternshipRefs(managerId: string) {
  const assignments = await adminFirestore
    .collectionGroup("managerAssignments")
    .where("userId", "==", managerId)
    .get();
  return assignments.docs.flatMap((assignment) => {
    if (!currentManagerAssignment(assignment.data())) return [];
    const internshipRef = assignment.ref.parent.parent;
    return internshipRef ? [internshipRef] : [];
  });
}

export async function getManagerPortfolio(
  managerId: string,
  queryInput: unknown,
): Promise<ManagerPortfolioDto> {
  recordFirestoreReadPath("manager-portfolio.list");
  const query = normalizeManagerPortfolioQuery(queryInput);
  const refs = await currentManagedInternshipRefs(managerId);
  const allItems = await mapWithConcurrency(refs, 6, (ref) =>
    buildPortfolioItem(ref, managerId),
  );
  const filtered = filterAndSortPortfolio(allItems, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const mentorOptions = [
    ...new Map(
      allItems.flatMap((item) =>
        item.mentorUserIds.map((id, index) => [
          id,
          { id, displayName: item.mentorNames[index] },
        ]),
      ),
    ).values(),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName));
  return {
    items: filtered.slice(start, start + query.pageSize),
    metrics: portfolioMetrics(allItems),
    total: filtered.length,
    page,
    pageSize: query.pageSize,
    totalPages,
    mentorOptions,
    query: { ...query, page },
  };
}

async function assertCurrentManagerInTransaction(
  transaction: FirebaseFirestore.Transaction,
  internshipRef: FirebaseFirestore.DocumentReference,
  managerId: string,
) {
  return readManagerMutationAccess(transaction, internshipRef, managerId);
}

function assertOperationalInternship(internship: { status: InternshipStatus }) {
  if (!isOperationalInternshipStatus(internship.status)) {
    throw new Error("Completed and cancelled internships are read-only.");
  }
}

export async function getManagerPortfolioDetail(
  internshipId: string,
  managerId: string,
): Promise<ManagerPortfolioDetailDto> {
  recordFirestoreReadPath("manager-portfolio.detail");
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const [internshipSnapshot, userSnapshot, managerAssignment] = await Promise.all([
    internshipRef.get(),
    adminFirestore.collection("users").doc(managerId).get(),
    internshipRef.collection("managerAssignments").doc(managerId).get(),
  ]);
  const currentInternship = assertManagerAccessSnapshots(
    internshipSnapshot,
    userSnapshot,
    managerAssignment,
    managerId,
  );
  const internship = currentInternship;
  const [checklist, progressHub, managers, placements, assignments] = await Promise.all(
    [
      getStageChecklist(internshipRef, internship, managerId),
      getManagerProgressHub(internshipRef, internship, managerId),
      internshipRef.collection("managerAssignments").get(),
      internshipRef.collection("teamPlacements").orderBy("startsAt", "desc").get(),
      internshipRef.collection("teammateAssignments").orderBy("startsAt", "desc").get(),
    ],
  );
  const managerData = managers.docs.map((document) => ({
    id: document.id,
    ...managerAssignmentSchema.parse(document.data()),
  }));
  const placementData = placements.docs.map((document) => ({
    id: document.id,
    ...placementSchema.parse(document.data()),
  }));
  const teammateData = assignments.docs.map((document) => ({
    id: document.id,
    ...teammateAssignmentSchema.parse(document.data()),
  }));
  const users = await getUserSummaries([
    internship.internId,
    ...managerData.map((assignment) => assignment.userId),
    ...teammateData.map((assignment) => assignment.teammateUserId),
  ]);
  const intern = users.get(internship.internId);
  if (!intern) throw new Error("Intern application user not found.");
  const teamIds = [
    ...new Set([
      ...placementData.map((placement) => placement.teamId),
      ...teammateData.map((assignment) => assignment.teamId),
    ]),
  ];
  const teamDocuments = teamIds.length
    ? await adminFirestore.getAll(
      ...teamIds.map((teamId) => adminFirestore.collection("teams").doc(teamId)),
    )
    : [];
  const teams = new Map(
    teamDocuments.map((team) => [
      team.id,
      (team.data()?.title as string | undefined) ?? "Unknown team",
    ]),
  );
  const history = await internshipRef
    .collection("statusHistory")
    .orderBy("changedAt", "desc")
    .limit(50)
    .get();
  const { listEligibleUsers } = await import("@/server/assignments/service");
  const currentMentors = teammateData.filter(
    (assignment) =>
      assignment.responsibilities.includes("mentor") &&
      isOngoingOrScheduled(assignment as DateRange),
  );
  const currentPlacement = placementData
    .filter((placement) => isOngoingOrScheduled(placement as DateRange))
    .sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis())[0];
  const base = {
    id: internshipId,
    intern: {
      id: internship.internId,
      displayName: intern.displayName,
      email: intern.email,
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
    mentorNames: currentMentors.map(
      (assignment) =>
        users.get(assignment.teammateUserId)?.displayName ?? "Unknown mentor",
    ),
    mentorUserIds: currentMentors.map((assignment) => assignment.teammateUserId),
    currentPlacement: currentPlacement
      ? {
        teamId: currentPlacement.teamId,
        teamTitle: teams.get(currentPlacement.teamId) ?? "Unknown team",
      }
      : undefined,
    reflectionState: progressHub.summary.reflectionState,
    mentorCheckInState: progressHub.summary.mentorCheckInState,
    openActionItems: progressHub.summary.openActionItems,
    overdueActionItems: progressHub.summary.overdueActionItems,
    nextDueAction: progressHub.summary.nextDueAction,
    unresolvedAgendaItems: progressHub.summary.unresolvedAgendaItems,
    latestSharedActivityAt: latestActivity({ progressHub }),
  } satisfies Omit<ManagerPortfolioItemDto, "attentionSignals">;
  const item = { ...base, attentionSignals: deriveAttentionSignals(base) };
  return {
    internship: { ...item, checklist, progressHub },
    managerAssignments: managerData.map((assignment) => ({
      userId: assignment.userId,
      displayName: users.get(assignment.userId)?.displayName ?? "Unknown manager",
      startsAt: timestamp(assignment.startsAt),
      endsAt: timestamp(assignment.endsAt),
      current: currentManagerAssignment(assignment),
    })),
    statusHistory: history.docs.flatMap((document) => {
      const parsed = statusHistorySchema.safeParse(document.data());
      if (!parsed.success) return [];
      return [
        {
          id: document.id,
          ...parsed.data,
          changedAt: timestamp(parsed.data.changedAt)!,
        },
      ];
    }),
    placements: placementData.map((placement) => ({
      id: placement.id,
      teamId: placement.teamId,
      teamTitle: teams.get(placement.teamId) ?? "Unknown team",
      startsAt: timestamp(placement.startsAt)!,
      endsAt: timestamp(placement.endsAt),
      current: isCurrent(placement),
      status: assignmentStatus(placement),
    })),
    teammateAssignments: teammateData.map((assignment) => ({
      id: assignment.id,
      teammateUserId: assignment.teammateUserId,
      teammateName:
        users.get(assignment.teammateUserId)?.displayName ?? "Unknown teammate",
      teamId: assignment.teamId,
      teamTitle: teams.get(assignment.teamId) ?? "Unknown team",
      responsibilities: assignment.responsibilities,
      startsAt: timestamp(assignment.startsAt)!,
      endsAt: timestamp(assignment.endsAt),
      current: isCurrent(assignment),
      status: assignmentStatus(assignment),
    })),
    eligibleManagers: await listEligibleUsers("manager"),
    eligibleTeammates: await listEligibleUsers("teammate"),
    capabilities: {
      canManage: isOperationalInternshipStatus(internship.status),
      canEditExpectedEnd: isOperationalInternshipStatus(internship.status),
      canManageManagers: isOperationalInternshipStatus(internship.status),
      canManagePlacements: isOperationalInternshipStatus(internship.status),
      canManageTeammates: isOperationalInternshipStatus(internship.status),
      canChangeStatus: isOperationalInternshipStatus(internship.status),
      canTransitionStatus: isOperationalInternshipStatus(internship.status),
    },
  };
}

function transitionTarget(
  status: InternshipStatus,
  action: z.infer<typeof statusCommandSchema>["action"],
) {
  const allowed = {
    active: { pause: "paused", cancel: "cancelled", complete: "completed" },
    paused: { resume: "active", cancel: "cancelled", complete: "completed" },
    completed: {},
    cancelled: {},
  } as const;
  const target = allowed[status][action as keyof (typeof allowed)[typeof status]];
  if (!target) throw new Error("This status transition is not allowed.");
  return target as InternshipStatus;
}

export async function transitionInternshipStatus(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof statusCommandSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await assertCurrentManagerInTransaction(
      transaction,
      internshipRef,
      managerId,
    );
    const guardRef = adminFirestore
      .collection("internshipGuards")
      .doc(internship.internId);
    const [progressSnapshot, guard] = await Promise.all([
      transaction.get(internshipRef.collection("stageProgress").doc("finalReview")),
      transaction.get(guardRef),
    ]);
    assertOperationalInternship(internship);
    const nextStatus = transitionTarget(internship.status, input.action);
    if (nextStatus === "completed") {
      if (internship.currentStage !== "finalReview") {
        throw new Error("Only Final Review internships can be completed.");
      }
      if (!progressSnapshot.exists) throw new Error("Final Review is not complete.");
      const progress = stageProgressSchema.parse(progressSnapshot.data());
      const template = getStageChecklistTemplate("finalReview");
      if (
        progress.stage !== "finalReview" ||
        !progress.completedAt ||
        !template.items
          .filter((item) => item.type === "required")
          .every((item) => progress.items[item.key]?.completed === true)
      ) {
        throw new Error("Complete every required Final Review item first.");
      }
    }
    const completionDate =
      input.completionDate ?? dateInApplicationTimeZone(Timestamp.now());
    const completedAt = Timestamp.fromDate(new Date(`${completionDate}T00:00:00.000Z`));
    if (
      nextStatus === "completed" &&
      completedAt.toMillis() < internship.startsAt.toMillis()
    ) {
      throw new Error(
        "The completion date cannot be before the internship start date.",
      );
    }
    transaction.update(internshipRef, {
      status: nextStatus,
      ...(nextStatus === "completed" ? { endsAt: completedAt } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(internshipRef.collection("statusHistory").doc(), {
      previousStatus: internship.status,
      newStatus: nextStatus,
      changedAt: FieldValue.serverTimestamp(),
      changedBy: managerId,
      ...(input.reason ? { reason: input.reason } : {}),
    });
    if (nextStatus === "completed" || nextStatus === "cancelled") {
      if (guard.exists && guard.data()?.internshipId === internshipId) {
        transaction.delete(guardRef);
      }
    }
  });
  return getManagerPortfolioDetail(internshipId, managerId);
}

export async function updateExpectedEndDate(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof expectedEndDateInputSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await assertCurrentManagerInTransaction(
      transaction,
      internshipRef,
      managerId,
    );
    assertOperationalInternship(internship);
    const endsAt = input.endsAt
      ? Timestamp.fromDate(new Date(`${input.endsAt}T00:00:00.000Z`))
      : undefined;
    if (endsAt && endsAt.toMillis() < internship.startsAt.toMillis()) {
      throw new Error("The expected end date cannot be before the start date.");
    }
    transaction.update(internshipRef, {
      endsAt: endsAt ?? FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
  return getManagerPortfolioDetail(internshipId, managerId);
}

export async function addManagerAssignment(
  internshipId: string,
  actorId: string,
  input: z.infer<typeof managerAssignmentInputSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const targetRef = internshipRef
      .collection("managerAssignments")
      .doc(input.managerUserId);
    const [targetUser, targetAssignment] = await Promise.all([
      transaction.get(adminFirestore.collection("users").doc(input.managerUserId)),
      transaction.get(targetRef),
    ]);
    const current = await assertCurrentManagerInTransaction(
      transaction,
      internshipRef,
      actorId,
    );
    assertOperationalInternship(current);
    const manager = targetUser.exists
      ? appUserSchema.parse(targetUser.data())
      : undefined;
    if (!manager?.active || !manager.roles.includes("manager")) {
      throw new Error("The selected user is not an active manager.");
    }
    if (targetAssignment.exists && currentManagerAssignment(targetAssignment.data()))
      return;
    if (targetAssignment.exists) {
      throw new Error(
        "This manager has a historical assignment and cannot be re-added yet.",
      );
    }
    transaction.create(targetRef, {
      userId: input.managerUserId,
      startsAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actorId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });
  });
  return getManagerPortfolioDetail(internshipId, actorId);
}

export async function removeManagerAssignment(
  internshipId: string,
  actorId: string,
  input: z.infer<typeof removeManagerAssignmentInputSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const targetRef = internshipRef
      .collection("managerAssignments")
      .doc(input.managerUserId);
    const replacementRef = input.replacementManagerUserId
      ? internshipRef
        .collection("managerAssignments")
        .doc(input.replacementManagerUserId)
      : undefined;
    const [internship, assignments, target, replacement, replacementUser] =
      await Promise.all([
        transaction.get(internshipRef),
        transaction.get(internshipRef.collection("managerAssignments")),
        transaction.get(targetRef),
        replacementRef ? transaction.get(replacementRef) : Promise.resolve(undefined),
        input.replacementManagerUserId
          ? transaction.get(
            adminFirestore.collection("users").doc(input.replacementManagerUserId),
          )
          : Promise.resolve(undefined),
      ]);
    if (
      !internship.exists ||
      !target.exists ||
      !currentManagerAssignment(target.data())
    ) {
      throw new Error("Current manager assignment not found.");
    }
    const current = await assertCurrentManagerInTransaction(
      transaction,
      internshipRef,
      actorId,
    );
    assertOperationalInternship(current);
    if (input.replacementManagerUserId === input.managerUserId) {
      throw new Error("A manager cannot be their own replacement.");
    }
    const currentCount = assignments.docs.filter((document) =>
      currentManagerAssignment(document.data()),
    ).length;
    if (currentCount <= 1 && !replacementRef) {
      throw new Error("Assign a replacement before removing the final manager.");
    }
    if (replacementRef && input.replacementManagerUserId !== input.managerUserId) {
      const user = replacementUser?.exists
        ? appUserSchema.parse(replacementUser.data())
        : undefined;
      if (!user?.active || !user.roles.includes("manager")) {
        throw new Error("The replacement must be an active manager.");
      }
      if (replacement?.exists && !currentManagerAssignment(replacement.data())) {
        throw new Error(
          "The replacement has a historical assignment and cannot be re-added yet.",
        );
      }
      if (!replacement?.exists) {
        transaction.create(replacementRef, {
          userId: input.replacementManagerUserId,
          startsAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          createdBy: actorId,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actorId,
        });
      }
    }
    transaction.update(targetRef, {
      endsAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });
  });
  return getManagerPortfolioDetail(internshipId, actorId);
}
