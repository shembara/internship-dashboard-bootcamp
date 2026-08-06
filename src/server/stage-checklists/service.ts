import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import type {
  StageChecklistDto,
  StageChecklistItemDto,
} from "@/lib/stage-checklists/types";
import {
  getStageChecklistTemplate,
  type ChecklistCompletionActor,
  type StageChecklistItemTemplate,
} from "@/lib/stage-checklists/templates";
import { internshipStages, type InternshipStage } from "@/lib/internships/types";
import {
  isCurrent,
  isCurrentManagerAssignment,
  managerAssignmentDocumentSchema,
  teammateAssignmentDocumentSchema,
} from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import {
  parseInternshipDocument,
  type InternshipDocument,
} from "@/server/internships/domain";
import { appUserSchema } from "@/server/users/app-user";

const stageValues = internshipStages.map(({ value }) => value) as [
  InternshipStage,
  ...InternshipStage[],
];

export const checklistItemMutationSchema = z.object({
  stage: z.enum(stageValues),
  itemKey: z.string().min(1).max(120),
  status: z.enum(["todo", "inProgress", "done"]),
});

export const createChecklistItemSchema = z.object({
  stage: z.enum(stageValues),
  label: z.string().trim().min(1).max(160),
  type: z.enum(["required", "recommended"]),
});

export const stageAdvancementSchema = z.object({
  stage: z.enum(stageValues),
});

const itemProgressSchema = z.object({
  completed: z.boolean(),
  status: z.enum(["todo", "inProgress", "done"]).optional(),
  completedAt: z.instanceof(Timestamp).optional(),
  completedBy: z.string().min(1).optional(),
});

const customItemSchema = z.object({
  key: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  type: z.enum(["required", "recommended"]),
  createdAt: z.instanceof(Timestamp).optional(),
  createdBy: z.string().min(1),
});

export const stageProgressSchema = z.object({

  stage: z.enum(stageValues),
  items: z.record(z.string(), itemProgressSchema),
  customItems: z.array(customItemSchema).default([]),
  startedAt: z.instanceof(Timestamp),
  completedAt: z.instanceof(Timestamp).optional(),
  completedBy: z.string().min(1).optional(),
  createdAt: z.instanceof(Timestamp),
  createdBy: z.string().min(1),
  updatedAt: z.instanceof(Timestamp),
  updatedBy: z.string().min(1),
});

type StageProgress = z.infer<typeof stageProgressSchema>;
type InternshipReference = FirebaseFirestore.DocumentReference;
type ChecklistAccess = {
  completionActors: ChecklistCompletionActor[];
  canAdvance: boolean;
  canAddTasks: boolean;
};

function initialItems(stage: InternshipStage) {
  return Object.fromEntries(
    getStageChecklistTemplate(stage).items.map((item) => [
      item.key,
      { completed: false, status: "todo" as const },
    ]),
  );
}

function checklistItemDefinition(
  stage: InternshipStage,
  progress: StageProgress,
  key: string,
): StageChecklistItemTemplate | undefined {
  const templateItem = getStageChecklistTemplate(stage).items.find(
    (item) => item.key === key,
  );
  if (templateItem) return templateItem;

  const customItem = progress.customItems.find((item) => item.key === key);
  return customItem
    ? {
        ...customItem,
        allowedCompletionActors: ["intern", "mentor", "manager"],
      }
    : undefined;
}

export function canCompleteChecklistItem(
  item: Pick<StageChecklistItemTemplate, "allowedCompletionActors">,
  completionActors: readonly ChecklistCompletionActor[],
) {
  return completionActors.some((actor) => item.allowedCompletionActors.includes(actor));
}

function initialStageProgress(stage: InternshipStage, actorId: string) {
  return {
    stage,
    items: initialItems(stage),
    startedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorId,
    customItems: [],
  };
}

function initialReadOnlyStageProgress(stage: InternshipStage): StageProgress {
  const now = Timestamp.now();
  return {
    stage,
    items: initialItems(stage),
    startedAt: now,
    createdAt: now,
    createdBy: "system",
    updatedAt: now,
    updatedBy: "system",
    customItems: [],
  };
}

function parseStageProgress(data: unknown, stage: InternshipStage): StageProgress {
  const progress = stageProgressSchema.parse(data);
  if (progress.stage !== stage)
    throw new Error("Stage progress does not match its document.");

  const allowedKeys = new Set([
    ...getStageChecklistTemplate(stage).items.map((item) => item.key),
    ...progress.customItems.map((item) => item.key),
  ]);
  if (Object.keys(progress.items).some((key) => !allowedKeys.has(key))) {
    throw new Error("Stage progress contains an unknown checklist item.");
  }

  return progress;
}

export function resolveChecklistAccess(
  internship: InternshipDocument,
  userId: string,
  userSnapshot: FirebaseFirestore.DocumentSnapshot,
  managerAssignment: FirebaseFirestore.DocumentSnapshot,
  teammateAssignments: FirebaseFirestore.QuerySnapshot,
) {
  if (!userSnapshot.exists) {
    throw new AuthorizationError(
      "APP_USER_REQUIRED",
      "An active application-user record is required.",
    );
  }

  const appUser = appUserSchema.parse(userSnapshot.data());
  if (!appUser.active) {
    throw new AuthorizationError("DISABLED", "This application account is disabled.");
  }

  const now = Timestamp.now();
  const intern = appUser.roles.includes("intern") && internship.internId === userId;
  const managerAssignmentData = managerAssignment.exists
    ? managerAssignmentDocumentSchema.parse(managerAssignment.data())
    : undefined;
  const manager =
    appUser.roles.includes("manager") &&
    managerAssignmentData?.userId === userId &&
    isCurrentManagerAssignment(managerAssignmentData, now);
  const teammateAssignmentsForUser = teammateAssignments.docs.map((document) =>
    teammateAssignmentDocumentSchema.parse(document.data()),
  );
  const teammate =
    appUser.roles.includes("teammate") &&
    teammateAssignmentsForUser.some((assignment) => isCurrent(assignment, now));
  const mentor =
    teammate &&
    teammateAssignmentsForUser.some(
      (assignment) =>
        assignment.responsibilities.includes("mentor") && isCurrent(assignment, now),
    );

  if (!intern && !manager && !teammate) {
    throw new AuthorizationError("ROLE_REQUIRED", "You cannot view this internship.");
  }

  return {
    completionActors: [
      ...(intern ? (["intern"] as const) : []),
      ...(mentor ? (["mentor"] as const) : []),
      ...(manager ? (["manager"] as const) : []),
    ],
    canAdvance: mentor || manager,
    canAddTasks: mentor || manager,
  } satisfies ChecklistAccess;
}

async function resolveAccess(
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
  return resolveChecklistAccess(
    internship,
    userId,
    user,
    managerAssignment,
    teammateAssignments,
  );
}

async function resolveTransactionAccess(
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
  return resolveChecklistAccess(
    internship,
    userId,
    user,
    managerAssignment,
    teammateAssignments,
  );
}

function assertMutableStatus(internship: InternshipDocument) {
  if (internship.status !== "active") {
    throw new Error("Checklist progress can only be changed for an active internship.");
  }
}

function assertOpenStage(progress: StageProgress | undefined) {
  if (progress?.completedAt) {
    throw new Error("Completed checklist stages cannot be changed.");
  }
}

function stageChecklistDto(
  stage: InternshipStage,
  progress: StageProgress,
  access: ChecklistAccess,
  isMutable: boolean,
): StageChecklistDto {
  const template = getStageChecklistTemplate(stage);
  const isStageCompleted = Boolean(progress.completedAt);
  const definitions = [
    ...template.items,
    ...progress.customItems.map((item) => ({
      ...item,
      allowedCompletionActors: ["intern", "mentor", "manager"] as const,
    })),
  ];
  const items = definitions.map<StageChecklistItemDto>((item) => {
    const itemProgress = progress.items[item.key] ?? { completed: false };
    const status = itemProgress.status ?? (itemProgress.completed ? "done" : "todo");
    return {
      key: item.key,
      label: item.label,
      type: item.type,
      status,
      completed: status === "done",
      completedAt: itemProgress.completedAt?.toDate().toISOString(),
      completedBy: itemProgress.completedBy,
      canComplete:
        isMutable &&
        !isStageCompleted &&
        canCompleteChecklistItem(item, access.completionActors),
    };
  });
  const requiredItems = items.filter((item) => item.type === "required");
  const requiredCompletedCount = requiredItems.filter((item) => item.completed).length;

  return {
    stage,
    stageLabel: internshipStages.find((candidate) => candidate.value === stage)!.label,
    requiredItems,
    recommendedItems: items.filter((item) => item.type === "recommended"),
    items,
    requiredCompletedCount,
    requiredTotalCount: requiredItems.length,
    readyToComplete:
      !isStageCompleted && requiredCompletedCount === requiredItems.length,
    isStageCompleted,
    completedAt: progress.completedAt?.toDate().toISOString(),
    canCompleteStage: isMutable && !isStageCompleted && access.canAdvance,
    canAddTasks: isMutable && !isStageCompleted && access.canAddTasks,
  };
}

async function ensureStageProgress(
  internshipRef: InternshipReference,
  stage: InternshipStage,
  actorId: string,
) {
  const progressRef = internshipRef.collection("stageProgress").doc(stage);
  await adminFirestore.runTransaction(async (transaction) => {
    const existing = await transaction.get(progressRef);
    if (!existing.exists)
      transaction.create(progressRef, initialStageProgress(stage, actorId));
  });
  return progressRef;
}

export async function getStageChecklist(
  internshipRef: InternshipReference,
  internship: InternshipDocument,
  userId: string,
) {
  const access = await resolveAccess(internshipRef, internship, userId);
  const progressRef =
    internship.status === "active"
      ? await ensureStageProgress(internshipRef, internship.currentStage, userId)
      : internshipRef.collection("stageProgress").doc(internship.currentStage);
  const progress = await progressRef.get();

  return stageChecklistDto(
    internship.currentStage,
    progress.exists
      ? parseStageProgress(progress.data(), internship.currentStage)
      : initialReadOnlyStageProgress(internship.currentStage),
    access,
    internship.status === "active",
  );
}

export async function updateChecklistItem(
  internshipId: string,
  userId: string,
  input: z.infer<typeof checklistItemMutationSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const snapshot = await internshipRef.get();
  if (!snapshot.exists) throw new Error("Internship not found.");
  const internship = parseInternshipDocument(snapshot.data());
  if (input.stage !== internship.currentStage)
    throw new Error("This checklist stage is no longer current.");

  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const currentInternship = parseInternshipDocument(current.data());
    assertMutableStatus(currentInternship);
    if (currentInternship.currentStage !== input.stage) {
      throw new Error("This checklist stage is no longer current.");
    }
    const progressRef = internshipRef.collection("stageProgress").doc(input.stage);
    const existing = await transaction.get(progressRef);
    const access = await resolveTransactionAccess(
      transaction,
      internshipRef,
      currentInternship,
      userId,
    );
    const progress = existing.exists
      ? parseStageProgress(existing.data(), input.stage)
      : undefined;
    assertOpenStage(progress);
    if (!access.completionActors.length) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You cannot update tasks for this internship.",
      );
    }
    const activeProgress = progress ?? initialReadOnlyStageProgress(input.stage);
    const item = checklistItemDefinition(input.stage, activeProgress, input.itemKey);
    if (!item) throw new Error("Task not found.");
    if (!canCompleteChecklistItem(item, access.completionActors)) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You cannot update this task for this internship.",
      );
    }
    const items: Record<string, unknown> = {
      ...(progress?.items ?? initialItems(input.stage)),
    };
    items[input.itemKey] = {
      completed: input.status === "done",
      status: input.status,
      ...(input.status === "done"
        ? { completedAt: FieldValue.serverTimestamp(), completedBy: userId }
        : {}),
    };
    transaction.set(
      progressRef,
      {
        ...(progress ?? initialStageProgress(input.stage, userId)),
        items,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });

  const updated = await internshipRef.get();
  return getStageChecklist(
    internshipRef,
    parseInternshipDocument(updated.data()),
    userId,
  );
}

export async function createChecklistItem(
  internshipId: string,
  userId: string,
  input: z.infer<typeof createChecklistItemSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const key = `custom-${Date.now()}-${input.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`.slice(0, 120);
  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(current.data());
    assertMutableStatus(internship);
    if (internship.currentStage !== input.stage) {
      throw new Error("This checklist stage is no longer current.");
    }
    const progressRef = internshipRef.collection("stageProgress").doc(input.stage);
    const existing = await transaction.get(progressRef);
    const access = await resolveTransactionAccess(
      transaction,
      internshipRef,
      internship,
      userId,
    );
    if (!access.canAddTasks) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "A mentor or manager is required to add tasks.",
      );
    }
    const progress = existing.exists
      ? parseStageProgress(existing.data(), input.stage)
      : undefined;
    assertOpenStage(progress);
    if ((progress?.customItems ?? []).some((item) => item.key === key)) {
      throw new Error("A task with this name already exists.");
    }
    transaction.set(
      progressRef,
      {
        ...(progress ?? initialStageProgress(input.stage, userId)),
        customItems: [
          ...(progress?.customItems ?? []),
          {
            key,
            label: input.label,
            type: input.type,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: userId,
          },
        ],
        items: {
          ...(progress?.items ?? initialItems(input.stage)),
          [key]: { completed: false, status: "todo" },
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
  });
  const updated = await internshipRef.get();
  return getStageChecklist(
    internshipRef,
    parseInternshipDocument(updated.data()),
    userId,
  );
}

export async function completeStage(
  internshipId: string,
  userId: string,
  input: z.infer<typeof stageAdvancementSchema>,
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const snapshot = await internshipRef.get();
  if (!snapshot.exists) throw new Error("Internship not found.");

  await adminFirestore.runTransaction(async (transaction) => {
    const current = await transaction.get(internshipRef);
    if (!current.exists) throw new Error("Internship not found.");
    const currentInternship = parseInternshipDocument(current.data());
    assertMutableStatus(currentInternship);
    if (currentInternship.currentStage !== input.stage) {
      throw new Error("This checklist stage is no longer current.");
    }
    const progressRef = internshipRef.collection("stageProgress").doc(input.stage);
    const progressSnapshot = await transaction.get(progressRef);
    const access = await resolveTransactionAccess(
      transaction,
      internshipRef,
      currentInternship,
      userId,
    );
    const progress = progressSnapshot.exists
      ? parseStageProgress(progressSnapshot.data(), input.stage)
      : undefined;
    assertOpenStage(progress);
    if (!access.canAdvance) {
      throw new AuthorizationError("ROLE_REQUIRED", "A mentor or manager is required.");
    }
    const activeProgress = progress ?? {
      stage: input.stage,
      items: initialItems(input.stage),
      customItems: [],
    };
    const requiredItems = [
      ...getStageChecklistTemplate(input.stage).items,
      ...(activeProgress.customItems ?? []),
    ].filter((item) => item.type === "required");
    const requiredComplete = requiredItems.every((item) => {
      const task = activeProgress.items[item.key];
      return task?.status === "done" || task?.completed;
    });
    if (!requiredComplete)
      throw new Error("Complete all required checklist items first.");

    const currentIndex = internshipStages.findIndex(
      (stage) => stage.value === input.stage,
    );
    const nextStage = internshipStages[currentIndex + 1]?.value;
    const nextProgressRef = nextStage
      ? internshipRef.collection("stageProgress").doc(nextStage)
      : undefined;
    const nextProgress = nextProgressRef
      ? await transaction.get(nextProgressRef)
      : undefined;

    transaction.set(
      progressRef,
      {
        ...(progress ?? initialStageProgress(input.stage, userId)),
        completedAt: FieldValue.serverTimestamp(),
        completedBy: userId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true },
    );
    if (!nextStage || !nextProgressRef) return;

    transaction.update(internshipRef, {
      currentStage: nextStage,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    });
    if (!nextProgress?.exists) {
      transaction.create(nextProgressRef, initialStageProgress(nextStage, userId));
    }
  });

  const updated = await internshipRef.get();
  return {
    lifecycle: parseInternshipDocument(updated.data()),
    checklist: await getStageChecklist(
      internshipRef,
      parseInternshipDocument(updated.data()),
      userId,
    ),
  };
}

export function createInitialStageProgress(stage: InternshipStage, actorId: string) {
  return initialStageProgress(stage, actorId);
}
