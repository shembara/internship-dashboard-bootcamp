import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import type {
  ActionItemDto,
  ActionOwnerOptionDto,
  ActionOwnerType,
  AgendaItemDto,
  CheckInState,
  InternProgressHubDto,
  ManagerProgressHubDto,
  MentorCheckInDto,
  MentorProgressHubDto,
  NoteDto,
  ProgressHubDto,
  ProgressHubSummaryDto,
  ReflectionState,
  WeeklyReflectionDto,
} from "@/lib/progress-hub/types";
import {
  assertWritableWeek,
  getCurrentWeek,
  getWeekPeriod,
  progressHubTimeZone,
} from "@/lib/progress-hub/week";
import { isCurrent } from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import {
  parseInternshipDocument,
  type InternshipDocument,
} from "@/server/internships/domain";
import { resolveChecklistAccess } from "@/server/stage-checklists/service";

const maxFieldLength = 2_000;
const maxNoteLength = 4_000;
const weekKeySchema = z.string().regex(/^\d{4}-W\d{2}$/);
const textField = z.string().trim().max(maxFieldLength);
const noteField = z.string().trim().min(1).max(maxNoteLength);
const timestampSchema = z.instanceof(Timestamp);
const actionOwnerTypes = ["intern", "mentor", "manager"] as const;

export const reflectionMutationSchema = z.object({
  weekKey: weekKeySchema,
  state: z.enum(["draft", "submitted"]),
  accomplishments: textField,
  learnings: textField,
  challenges: textField,
  nextWeekFocus: textField,
  supportNeeded: textField,
});

export const checkInMutationSchema = z.object({
  weekKey: weekKeySchema,
  state: z.enum(["draft", "shared"]),
  progressSummary: textField,
  strengthsObserved: textField,
  areasToImprove: textField,
  supportNeeded: textField,
  nextWeekFocus: textField,
  privateMentorNote: z.string().trim().max(maxNoteLength).optional(),
});

export const agendaMutationSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  text: noteField,
  resolved: z.boolean().optional(),
});

export const noteMutationSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  weekKey: weekKeySchema,
  text: noteField,
});

export const actionItemMutationSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(maxFieldLength).optional(),
  ownerType: z.enum(actionOwnerTypes),
  ownerUserId: z.string().min(1).max(120),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const actionItemStatusSchema = z.object({
  id: z.string().min(1).max(120),
  completed: z.boolean(),
});

const reflectionSchema = reflectionMutationSchema.extend({
  internshipId: z.string().min(1),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
  submittedAt: timestampSchema.optional(),
  submittedBy: z.string().min(1).optional(),
});

const checkInSchema = checkInMutationSchema.omit({ privateMentorNote: true }).extend({
  internshipId: z.string().min(1),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
  sharedAt: timestampSchema.optional(),
  sharedBy: z.string().min(1).optional(),
});

const agendaSchema = z.object({
  text: noteField,
  resolved: z.boolean(),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
  resolvedAt: timestampSchema.optional(),
  resolvedBy: z.string().min(1).optional(),
});

const noteSchema = z.object({
  weekKey: weekKeySchema,
  text: noteField,
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
});

const actionItemSchema = actionItemMutationSchema.extend({
  status: z.enum(["open", "completed"]),
  dueDate: timestampSchema,
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
  completedAt: timestampSchema.optional(),
  completedBy: z.string().min(1).optional(),
});

const mentorAssignmentSchema = z.object({
  teammateUserId: z.string().min(1),
  responsibilities: z.array(z.string()),
  startsAt: timestampSchema,
  endsAt: timestampSchema.optional(),
});

type InternshipReference = FirebaseFirestore.DocumentReference;
type ProgressAccess = {
  userId: string;
  viewer: "intern" | "mentor" | "manager";
  intern: boolean;
  mentor: boolean;
  manager: boolean;
  writable: boolean;
  mentorAssignments: Array<z.infer<typeof mentorAssignmentSchema>>;
};

type ProgressHubViewer = "intern" | "mentor" | "manager";

function assertWritableInternship(internship: InternshipDocument) {
  if (internship.status !== "active") {
    throw new Error(
      "Progress Hub records can only be changed for an active internship.",
    );
  }
}

function assertCurrentWeek(key: string) {
  const week = assertWritableWeek(key);
  if (week.state !== "current") {
    throw new Error("Past-week records are read-only.");
  }
  return week;
}

function assertMeaningful(values: string[]) {
  if (values.join("").trim().length < 10) {
    throw new Error("Provide enough detail before submitting this weekly update.");
  }
}

export function assertReflectionTransition(
  previous: z.infer<typeof reflectionSchema> | undefined,
  next: ReflectionState,
) {
  if (previous?.state === "draft" && previous.submittedAt) {
    throw new Error("Draft reflections cannot have submission metadata.");
  }
  if (previous?.state === "submitted" && next !== "submitted") {
    throw new Error("Submitted reflections cannot be moved back to draft.");
  }
}

export function assertCheckInTransition(
  previous: z.infer<typeof checkInSchema> | undefined,
  next: CheckInState,
) {
  if (previous?.state === "draft" && previous.sharedAt) {
    throw new Error("Draft check-ins cannot have sharing metadata.");
  }
  if (previous?.state === "shared" && next !== "shared") {
    throw new Error("Shared check-ins cannot be moved back to draft.");
  }
}

function assertViewerAccess(access: ProgressAccess, viewer: ProgressHubViewer) {
  if (!access[viewer]) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      `You are not authorized for the ${viewer} Progress Hub view.`,
    );
  }
}

export function resolveProgressHubAccess(
  internship: InternshipDocument,
  userId: string,
  userSnapshot: FirebaseFirestore.DocumentSnapshot,
  managerAssignment: FirebaseFirestore.DocumentSnapshot,
  teammateAssignments: FirebaseFirestore.QuerySnapshot,
): ProgressAccess {
  const checklistAccess = resolveChecklistAccess(
    internship,
    userId,
    userSnapshot,
    managerAssignment,
    teammateAssignments,
  );
  const intern = checklistAccess.completionActors.includes("intern");
  const mentor = checklistAccess.completionActors.includes("mentor");
  const manager = checklistAccess.completionActors.includes("manager");
  if (!intern && !mentor && !manager) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "Only the assigned intern, mentor, or manager can access the Progress Hub.",
    );
  }
  return {
    userId,
    viewer: manager ? "manager" : mentor ? "mentor" : "intern",
    intern,
    mentor,
    manager,
    writable: internship.status === "active",
    mentorAssignments: teammateAssignments.docs.map((document) =>
      mentorAssignmentSchema.parse(document.data()),
    ),
  };
}

async function loadProgressAccess(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
) {
  const [user, managerAssignment, teammateAssignments] = await Promise.all([
    adminFirestore.collection("users").doc(userId).get(),
    internshipRef.collection("managerAssignments").doc(userId).get(),
    internshipRef
      .collection("teammateAssignments")
      .where("teammateUserId", "==", userId)
      .get(),
  ]);
  return resolveProgressHubAccess(
    internship,
    userId,
    user,
    managerAssignment,
    teammateAssignments,
  );
}

async function loadTransactionProgressAccess(
  transaction: FirebaseFirestore.Transaction,
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
) {
  const [user, managerAssignment, teammateAssignments] = await Promise.all([
    transaction.get(adminFirestore.collection("users").doc(userId)),
    transaction.get(internshipRef.collection("managerAssignments").doc(userId)),
    transaction.get(
      internshipRef
        .collection("teammateAssignments")
        .where("teammateUserId", "==", userId),
    ),
  ]);
  return resolveProgressHubAccess(
    internship,
    userId,
    user,
    managerAssignment,
    teammateAssignments,
  );
}

function timestampValue(timestamp: Timestamp | undefined) {
  return timestamp?.toDate().toISOString();
}

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day", string>;
  return `${values.year}-${values.month}-${values.day}`;
}

function dueDateTimestamp(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Invalid due date.");
  }
  return Timestamp.fromDate(date);
}

function reflectionDto(
  data: z.infer<typeof reflectionSchema>,
  canEdit: boolean,
): WeeklyReflectionDto {
  return {
    weekKey: data.weekKey,
    state: data.state as ReflectionState,
    accomplishments: data.accomplishments,
    learnings: data.learnings,
    challenges: data.challenges,
    nextWeekFocus: data.nextWeekFocus,
    supportNeeded: data.supportNeeded,
    updatedAt: timestampValue(data.updatedAt)!,
    submittedAt: timestampValue(data.submittedAt),
    canEdit,
  };
}

function checkInDto(
  data: z.infer<typeof checkInSchema>,
  canEdit: boolean,
): MentorCheckInDto {
  return {
    weekKey: data.weekKey,
    state: data.state as CheckInState,
    progressSummary: data.progressSummary,
    strengthsObserved: data.strengthsObserved,
    areasToImprove: data.areasToImprove,
    supportNeeded: data.supportNeeded,
    nextWeekFocus: data.nextWeekFocus,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    updatedAt: timestampValue(data.updatedAt)!,
    sharedAt: timestampValue(data.sharedAt),
    canEdit,
  };
}

function agendaDto(
  id: string,
  data: z.infer<typeof agendaSchema>,
  access: ProgressAccess,
): AgendaItemDto {
  return {
    id,
    text: data.text,
    resolved: data.resolved,
    createdBy: data.createdBy,
    createdAt: timestampValue(data.createdAt)!,
    updatedAt: timestampValue(data.updatedAt)!,
    resolvedAt: timestampValue(data.resolvedAt),
    canEdit: access.writable,
    canResolve: access.writable,
  };
}

function noteDto(
  id: string,
  data: z.infer<typeof noteSchema>,
  canEdit: boolean,
): NoteDto {
  return {
    id,
    weekKey: data.weekKey,
    text: data.text,
    createdBy: data.createdBy,
    createdAt: timestampValue(data.createdAt)!,
    updatedAt: timestampValue(data.updatedAt)!,
    canEdit,
  };
}

function actionDto(
  id: string,
  data: z.infer<typeof actionItemSchema>,
  access: ProgressAccess,
): ActionItemDto {
  const dueDate = data.dueDate.toDate().toISOString().slice(0, 10);
  const canToggle =
    access.writable &&
    (access.manager ||
      access.mentor ||
      (access.intern && data.ownerUserId === access.userId));
  return {
    id,
    title: data.title,
    description: data.description || undefined,
    ownerType: data.ownerType as ActionOwnerType,
    ownerUserId: data.ownerUserId,
    dueDate,
    status: data.status,
    overdue: data.status === "open" && dueDate < todayKey(),
    createdBy: data.createdBy,
    createdAt: timestampValue(data.createdAt)!,
    updatedAt: timestampValue(data.updatedAt)!,
    completedAt: timestampValue(data.completedAt),
    canEdit:
      access.writable &&
      (access.manager || access.mentor || data.createdBy === access.userId),
    canToggle,
  };
}

function canReadPrivateMentorNote(
  data: z.infer<typeof noteSchema>,
  access: ProgressAccess,
  userId: string,
) {
  if (access.manager || data.createdBy === userId) return true;
  if (!access.mentor) return false;
  return access.mentorAssignments.some(
    (assignment) =>
      assignment.responsibilities.includes("mentor") &&
      assignment.startsAt.toMillis() <= data.createdAt.toMillis() &&
      (!assignment.endsAt || data.createdAt.toMillis() <= assignment.endsAt.toMillis()),
  );
}

function capabilities(access: ProgressAccess, viewer: ProgressHubViewer) {
  return {
    canSaveReflection: access.writable && viewer === "intern",
    canSaveCheckIn: access.writable && viewer === "mentor",
    canCreateAgendaItem: access.writable,
    canCreateSharedNote:
      access.writable && (viewer === "intern" || viewer === "mentor"),
    canCreatePrivateInternNote: access.writable && viewer === "intern",
    canCreatePrivateMentorNote: access.writable && viewer === "mentor",
    canCreateActionItem: access.writable,
  };
}

async function actionOwnerOptions(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
): Promise<ActionOwnerOptionDto[]> {
  const [managers, teammateAssignments] = await Promise.all([
    internshipRef.collection("managerAssignments").get(),
    internshipRef.collection("teammateAssignments").get(),
  ]);
  const owners = new Map<string, ActionOwnerType>([[internship.internId, "intern"]]);
  managers.docs.forEach((document) => {
    const userId = z
      .object({ userId: z.string().min(1) })
      .parse(document.data()).userId;
    owners.set(userId, "manager");
  });
  teammateAssignments.docs.forEach((document) => {
    const assignment = mentorAssignmentSchema.parse(document.data());
    if (assignment.responsibilities.includes("mentor") && isCurrent(assignment)) {
      owners.set(assignment.teammateUserId, "mentor");
    }
  });
  return [...owners.entries()].map(([userId, ownerType]) => ({
    userId,
    ownerType,
    label: `${ownerType[0].toUpperCase()}${ownerType.slice(1)} · ${userId}`,
  }));
}

function summary(
  internship: InternshipDocument,
  reflection: z.infer<typeof reflectionSchema> | undefined,
  checkIn: z.infer<typeof checkInSchema> | undefined,
  agendaItems: AgendaItemDto[],
  actionItems: ActionItemDto[],
  latestSharedCheckInAt?: string,
  checklistCompleted = 0,
  checklistTotal = 0,
): ProgressHubSummaryDto {
  const openItems = actionItems.filter((item) => item.status === "open");
  const nextDueAction = [...openItems]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map(({ id, title, dueDate }) => ({ id, title, dueDate }))[0];
  return {
    reflectionState: reflection?.state ?? "missing",
    mentorCheckInState: checkIn?.state ?? "missing",
    openActionItems: openItems.length,
    overdueActionItems: openItems.filter((item) => item.overdue).length,
    nextDueAction,
    unresolvedAgendaItems: agendaItems.filter((item) => !item.resolved).length,
    latestSharedCheckInAt,
    currentStage: internship.currentStage,
    checklistCompleted,
    checklistTotal,
  };
}

async function getProgressHubForViewer(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
  viewer: ProgressHubViewer,
  checklistProgress?: { requiredCompletedCount: number; requiredTotalCount: number },
): Promise<ProgressHubDto> {
  const access = await loadProgressAccess(internshipRef, internship, userId);
  assertViewerAccess(access, viewer);
  const [
    reflections,
    checkIns,
    agenda,
    sharedNotes,
    privateInternNotes,
    privateMentorNotes,
    actions,
    actionOwners,
  ] = await Promise.all([
    internshipRef
      .collection("weeklyReflections")
      .orderBy("weekKey", "desc")
      .limit(16)
      .get(),
    internshipRef
      .collection("mentorCheckIns")
      .orderBy("weekKey", "desc")
      .limit(16)
      .get(),
    internshipRef.collection("oneToOneAgenda").orderBy("createdAt", "desc").get(),
    internshipRef
      .collection("oneToOneNotes")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get(),
    viewer === "intern"
      ? internshipRef
          .collection("privateInternNotes")
          .orderBy("createdAt", "desc")
          .limit(50)
          .get()
      : Promise.resolve(undefined),
    viewer === "intern"
      ? Promise.resolve(undefined)
      : internshipRef
          .collection("mentorPrivateNotes")
          .orderBy("createdAt", "desc")
          .limit(50)
          .get(),
    internshipRef.collection("actionItems").orderBy("dueDate", "asc").get(),
    actionOwnerOptions(internshipRef, internship),
  ]);
  const currentWeek = getCurrentWeek();
  const parsedReflections = reflections.docs.map((document) => ({
    id: document.id,
    data: reflectionSchema.parse(document.data()),
  }));
  const parsedCheckIns = checkIns.docs.map((document) => ({
    id: document.id,
    data: checkInSchema.parse(document.data()),
  }));
  const agendaItems = agenda.docs
    .map((document) =>
      agendaDto(document.id, agendaSchema.parse(document.data()), access),
    )
    .sort(
      (a, b) =>
        Number(a.resolved) - Number(b.resolved) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
  const actionItems = actions.docs.map((document) =>
    actionDto(document.id, actionItemSchema.parse(document.data()), access),
  );
  const currentReflection = parsedReflections.find(
    (record) => record.data.weekKey === currentWeek.key,
  )?.data;
  const currentCheckIn = parsedCheckIns.find(
    (record) => record.data.weekKey === currentWeek.key,
  )?.data;
  const summaryReflection =
    viewer === "intern" || currentReflection?.state === "submitted"
      ? currentReflection
      : undefined;
  const summaryCheckIn =
    viewer === "manager" ||
    currentCheckIn?.state === "shared" ||
    (viewer === "mentor" && currentCheckIn?.createdBy === userId)
      ? currentCheckIn
      : undefined;
  const latestSharedCheckInAt = parsedCheckIns
    .filter((record) => record.data.state === "shared")
    .map((record) => timestampValue(record.data.sharedAt))
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0];
  const summaryData = summary(
    internship,
    summaryReflection,
    summaryCheckIn,
    agendaItems,
    actionItems,
    latestSharedCheckInAt,
    checklistProgress?.requiredCompletedCount,
    checklistProgress?.requiredTotalCount,
  );
  const common = {
    currentWeek,
    summary: summaryData,
    agendaItems,
    sharedNotes: sharedNotes.docs.map((document) =>
      noteDto(
        document.id,
        noteSchema.parse(document.data()),
        access.writable && (viewer === "intern" || viewer === "mentor"),
      ),
    ),
    actionItems,
    actionOwners,
    capabilities: capabilities(access, viewer),
  };

  if (viewer === "intern") {
    const visibleCheckIns = parsedCheckIns
      .filter((record) => record.data.state === "shared")
      .map((record) => checkInDto(record.data, false));
    return {
      viewer: "intern",
      viewerUserId: userId,
      ...common,
      reflection: currentReflection
        ? reflectionDto(
            currentReflection,
            access.writable && currentWeek.state === "current",
          )
        : undefined,
      reflectionHistory: parsedReflections.map((record) =>
        reflectionDto(
          record.data,
          access.writable && record.data.weekKey === currentWeek.key,
        ),
      ),
      mentorCheckIns: visibleCheckIns,
      privateInternNotes: (privateInternNotes?.docs ?? []).map((document) =>
        noteDto(document.id, noteSchema.parse(document.data()), access.writable),
      ),
    } satisfies InternProgressHubDto;
  }

  const visibleReflections = parsedReflections
    .filter((record) => record.data.state === "submitted")
    .map((record) => reflectionDto(record.data, false));
  const visibleCheckIns = parsedCheckIns.filter(
    (record) =>
      record.data.state === "shared" ||
      viewer === "manager" ||
      (viewer === "mentor" &&
        (record.data.createdBy === userId || record.data.weekKey === currentWeek.key)),
  );
  const visibleMentorNotes = (privateMentorNotes?.docs ?? []).flatMap((document) => {
    const data = noteSchema.parse(document.data());
    return canReadPrivateMentorNote(data, access, userId)
      ? [noteDto(document.id, data, access.writable && data.createdBy === userId)]
      : [];
  });

  if (viewer === "mentor") {
    const currentMentorCheckIn = visibleCheckIns.find(
      (record) => record.data.weekKey === currentWeek.key,
    )?.data;
    return {
      viewer: "mentor",
      viewerUserId: userId,
      ...common,
      reflections: visibleReflections,
      checkIn: currentMentorCheckIn
        ? checkInDto(currentMentorCheckIn, access.writable)
        : undefined,
      checkInHistory: visibleCheckIns.map((record) =>
        checkInDto(
          record.data,
          access.writable && record.data.weekKey === currentWeek.key,
        ),
      ),
      privateMentorNotes: visibleMentorNotes,
    } satisfies MentorProgressHubDto;
  }

  return {
    viewer: "manager",
    viewerUserId: userId,
    ...common,
    reflections: visibleReflections,
    mentorCheckIns: visibleCheckIns.map((record) => checkInDto(record.data, false)),
    privateMentorNotes: visibleMentorNotes,
  } satisfies ManagerProgressHubDto;
}

export async function getInternProgressHub(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
  checklistProgress?: { requiredCompletedCount: number; requiredTotalCount: number },
): Promise<InternProgressHubDto> {
  const hub = await getProgressHubForViewer(
    internshipRef,
    internship,
    userId,
    "intern",
    checklistProgress,
  );
  if (hub.viewer !== "intern") throw new Error("Invalid intern Progress Hub view.");
  return hub;
}

export async function getMentorProgressHub(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
  checklistProgress?: { requiredCompletedCount: number; requiredTotalCount: number },
): Promise<MentorProgressHubDto> {
  const hub = await getProgressHubForViewer(
    internshipRef,
    internship,
    userId,
    "mentor",
    checklistProgress,
  );
  if (hub.viewer !== "mentor") throw new Error("Invalid mentor Progress Hub view.");
  return hub;
}

export async function getManagerProgressHub(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
  checklistProgress?: { requiredCompletedCount: number; requiredTotalCount: number },
): Promise<ManagerProgressHubDto> {
  const hub = await getProgressHubForViewer(
    internshipRef,
    internship,
    userId,
    "manager",
    checklistProgress,
  );
  if (hub.viewer !== "manager") throw new Error("Invalid manager Progress Hub view.");
  return hub;
}

async function loadMutationInternship(internshipId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internship = await internshipRef.get();
  if (!internship.exists) throw new Error("Internship not found.");
  return { internshipRef, internship: parseInternshipDocument(internship.data()) };
}

export async function saveReflection(
  internshipId: string,
  userId: string,
  input: z.infer<typeof reflectionMutationSchema>,
) {
  assertCurrentWeek(input.weekKey);
  if (input.state === "submitted") {
    assertMeaningful([
      input.accomplishments,
      input.learnings,
      input.challenges,
      input.nextWeekFocus,
      input.supportNeeded,
    ]);
  }
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    assertCurrentWeek(input.weekKey);
    const access = await loadTransactionProgressAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    if (!access.intern)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the assigned intern can save a reflection.",
      );
    const reflectionRef = internshipRef
      .collection("weeklyReflections")
      .doc(input.weekKey);
    const existing = await transaction.get(reflectionRef);
    const previous = existing.exists
      ? reflectionSchema.parse(existing.data())
      : undefined;
    assertReflectionTransition(previous, input.state);
    if (previous && previous.createdBy !== userId) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the reflection author can edit it.",
      );
    }
    transaction.set(
      reflectionRef,
      {
        weekKey: input.weekKey,
        internshipId,
        state: input.state,
        accomplishments: input.accomplishments,
        learnings: input.learnings,
        challenges: input.challenges,
        nextWeekFocus: input.nextWeekFocus,
        supportNeeded: input.supportNeeded,
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), createdBy: userId }),
        ...(input.state === "submitted" && !previous?.submittedAt
          ? { submittedAt: FieldValue.serverTimestamp(), submittedBy: userId }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });
}

export async function saveMentorCheckIn(
  internshipId: string,
  userId: string,
  input: z.infer<typeof checkInMutationSchema>,
) {
  assertCurrentWeek(input.weekKey);
  if (input.state === "shared") {
    assertMeaningful([
      input.progressSummary,
      input.strengthsObserved,
      input.areasToImprove,
      input.supportNeeded,
      input.nextWeekFocus,
    ]);
  }
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    assertCurrentWeek(input.weekKey);
    const access = await loadTransactionProgressAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    if (!access.mentor)
      throw new AuthorizationError("ROLE_REQUIRED", "A current mentor is required.");
    const checkInRef = internshipRef.collection("mentorCheckIns").doc(input.weekKey);
    const privateNoteRef = internshipRef
      .collection("mentorPrivateNotes")
      .doc(input.weekKey);
    const [existing, existingPrivateNote] = await Promise.all([
      transaction.get(checkInRef),
      transaction.get(privateNoteRef),
    ]);
    const previous = existing.exists ? checkInSchema.parse(existing.data()) : undefined;
    assertCheckInTransition(previous, input.state);
    transaction.set(
      checkInRef,
      {
        weekKey: input.weekKey,
        internshipId,
        state: input.state,
        progressSummary: input.progressSummary,
        strengthsObserved: input.strengthsObserved,
        areasToImprove: input.areasToImprove,
        supportNeeded: input.supportNeeded,
        nextWeekFocus: input.nextWeekFocus,
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), createdBy: userId }),
        ...(input.state === "shared" && !previous?.sharedAt
          ? { sharedAt: FieldValue.serverTimestamp(), sharedBy: userId }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
    if (input.privateMentorNote) {
      if (
        existingPrivateNote.exists &&
        noteSchema.parse(existingPrivateNote.data()).createdBy !== userId
      ) {
        throw new AuthorizationError(
          "ROLE_REQUIRED",
          "Only the note author can edit it.",
        );
      }
      transaction.set(
        privateNoteRef,
        {
          weekKey: input.weekKey,
          text: input.privateMentorNote,
          ...(existingPrivateNote.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp(), createdBy: userId }),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: userId,
        },
        { merge: true },
      );
    }
  });
}

async function mutateAgenda(
  internshipId: string,
  userId: string,
  input: z.infer<typeof agendaMutationSchema>,
) {
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    await loadTransactionProgressAccess(transaction, internshipRef, internship, userId);
    const itemRef = input.id
      ? internshipRef.collection("oneToOneAgenda").doc(input.id)
      : internshipRef.collection("oneToOneAgenda").doc();
    const existing = await transaction.get(itemRef);
    if (input.id && !existing.exists) throw new Error("Agenda item not found.");
    const previous = existing.exists ? agendaSchema.parse(existing.data()) : undefined;
    transaction.set(
      itemRef,
      {
        text: input.text,
        resolved: input.resolved ?? previous?.resolved ?? false,
        ...(input.resolved && !previous?.resolved
          ? { resolvedAt: FieldValue.serverTimestamp(), resolvedBy: userId }
          : input.resolved === false
            ? { resolvedAt: FieldValue.delete(), resolvedBy: FieldValue.delete() }
            : {}),
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), createdBy: userId }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });
}

export { mutateAgenda as saveAgendaItem };

async function saveNote(
  internshipId: string,
  userId: string,
  collection: "oneToOneNotes" | "privateInternNotes" | "mentorPrivateNotes",
  input: z.infer<typeof noteMutationSchema>,
) {
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    const access = await loadTransactionProgressAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    const allowed =
      collection === "oneToOneNotes"
        ? access.intern || access.mentor
        : collection === "privateInternNotes"
          ? access.intern
          : access.mentor;
    if (!allowed)
      throw new AuthorizationError("ROLE_REQUIRED", "You cannot save this note.");
    const noteRef = input.id
      ? internshipRef.collection(collection).doc(input.id)
      : internshipRef.collection(collection).doc();
    const existing = await transaction.get(noteRef);
    if (input.id && !existing.exists) throw new Error("Note not found.");
    const previous = existing.exists ? noteSchema.parse(existing.data()) : undefined;
    if (previous && previous.weekKey !== input.weekKey) {
      throw new Error("Notes cannot be moved to a different week.");
    }
    assertCurrentWeek(previous?.weekKey ?? input.weekKey);
    if (previous && collection !== "oneToOneNotes" && previous.createdBy !== userId) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the note author can edit it.",
      );
    }
    transaction.set(
      noteRef,
      {
        weekKey: previous?.weekKey ?? input.weekKey,
        text: input.text,
        ...(existing.exists
          ? {}
          : { createdAt: FieldValue.serverTimestamp(), createdBy: userId }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });
}

export async function saveSharedNote(
  internshipId: string,
  userId: string,
  input: z.infer<typeof noteMutationSchema>,
) {
  return saveNote(internshipId, userId, "oneToOneNotes", input);
}

export async function savePrivateInternNote(
  internshipId: string,
  userId: string,
  input: z.infer<typeof noteMutationSchema>,
) {
  return saveNote(internshipId, userId, "privateInternNotes", input);
}

export async function savePrivateMentorNote(
  internshipId: string,
  userId: string,
  input: z.infer<typeof noteMutationSchema>,
) {
  return saveNote(internshipId, userId, "mentorPrivateNotes", input);
}

async function validateActionOwner(
  transaction: FirebaseFirestore.Transaction,
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  input: z.infer<typeof actionItemMutationSchema>,
) {
  const ownerAccess = await loadTransactionProgressAccess(
    transaction,
    internshipRef,
    internship,
    input.ownerUserId,
  );
  const valid =
    (input.ownerType === "intern" && ownerAccess.intern) ||
    (input.ownerType === "mentor" && ownerAccess.mentor) ||
    (input.ownerType === "manager" && ownerAccess.manager);
  if (!valid) throw new Error("The selected action owner is not currently assigned.");
}

export async function saveActionItem(
  internshipId: string,
  userId: string,
  input: z.infer<typeof actionItemMutationSchema>,
) {
  const dueDate = dueDateTimestamp(input.dueDate);
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    const access = await loadTransactionProgressAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    const itemRef = input.id
      ? internshipRef.collection("actionItems").doc(input.id)
      : internshipRef.collection("actionItems").doc();
    const existing = await transaction.get(itemRef);
    if (input.id && !existing.exists) throw new Error("Action item not found.");
    const previous = existing.exists
      ? actionItemSchema.parse(existing.data())
      : undefined;
    if (
      previous &&
      !access.manager &&
      !access.mentor &&
      previous.createdBy !== userId
    ) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You cannot edit this action item.",
      );
    }
    await validateActionOwner(transaction, internshipRef, internship, input);
    transaction.set(
      itemRef,
      {
        title: input.title,
        ...(input.description
          ? { description: input.description }
          : { description: FieldValue.delete() }),
        ownerType: input.ownerType,
        ownerUserId: input.ownerUserId,
        dueDate,
        ...(existing.exists
          ? {}
          : {
              status: "open",
              createdAt: FieldValue.serverTimestamp(),
              createdBy: userId,
            }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });
}

export async function setActionItemStatus(
  internshipId: string,
  userId: string,
  input: z.infer<typeof actionItemStatusSchema>,
) {
  const { internshipRef } = await loadMutationInternship(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertWritableInternship(internship);
    const access = await loadTransactionProgressAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    const itemRef = internshipRef.collection("actionItems").doc(input.id);
    const existing = await transaction.get(itemRef);
    if (!existing.exists) throw new Error("Action item not found.");
    const item = actionItemSchema.parse(existing.data());
    if (!access.manager && !access.mentor && item.ownerUserId !== userId) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the action owner can change its status.",
      );
    }
    transaction.update(itemRef, {
      status: input.completed ? "completed" : "open",
      ...(input.completed
        ? { completedAt: FieldValue.serverTimestamp(), completedBy: userId }
        : { completedAt: FieldValue.delete(), completedBy: FieldValue.delete() }),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    });
  });
}

export async function getManagerProgressSummary(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
) {
  const hub = await getManagerProgressHub(internshipRef, internship, userId);
  return hub.summary;
}

export function currentWeekForKey(key: string) {
  return getWeekPeriod(key);
}
