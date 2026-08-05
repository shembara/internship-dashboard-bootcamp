import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { achievementCategories, type AchievementDto } from "@/lib/achievements/types";
import { internshipStages, type InternshipStage } from "@/lib/internships/types";
import { progressHubTimeZone } from "@/lib/progress-hub/week";
import {
  isCurrentManagerAssignment,
  isOngoingOrScheduled,
} from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import { recordFirestoreReadPath } from "@/server/firebase/read-diagnostics";
import type { InternshipDocument } from "@/server/internships/domain";
import { parseInternshipDocument } from "@/server/internships/repository";
import { appUserSchema } from "@/server/users/app-user";

const categoryValues = achievementCategories.map(({ value }) => value) as [
  (typeof achievementCategories)[number]["value"],
  ...(typeof achievementCategories)[number]["value"][],
];
const stageValues = internshipStages.map(({ value }) => value) as [
  InternshipStage,
  ...InternshipStage[],
];
const date = z.string().date();
const url = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//.test(value), "Use an HTTP or HTTPS URL.");

export const achievementInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).optional(),
  category: z.enum(categoryValues),
  achievedOn: date,
  linkedStage: z.enum(stageValues).optional(),
  evidenceUrl: url.optional(),
});

const achievementSchema = achievementInputSchema.extend({
  createdBy: z.string().min(1),
  createdAt: z.instanceof(Timestamp),
  updatedBy: z.string().min(1),
  updatedAt: z.instanceof(Timestamp),
  archivedAt: z.instanceof(Timestamp).optional(),
  archivedBy: z.string().min(1).optional(),
});

function todayInApplicationTimeZone() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function assertAchievementBusinessRules(
  internship: InternshipDocument,
  input: Pick<z.infer<typeof achievementInputSchema>, "achievedOn" | "linkedStage">,
) {
  if (input.achievedOn < internship.startsAt.toDate().toISOString().slice(0, 10))
    throw new Error("Achievement date cannot be before the internship start date.");
  if (input.achievedOn > todayInApplicationTimeZone())
    throw new Error("Achievement date cannot be in the future.");
  if (
    input.linkedStage &&
    internshipStages.findIndex((stage) => stage.value === input.linkedStage) >
      internshipStages.findIndex((stage) => stage.value === internship.currentStage)
  )
    throw new Error("Achievement cannot be linked to a future stage.");
}

async function access(
  internshipRef: FirebaseFirestore.DocumentReference,
  userId: string,
) {
  const [internshipSnapshot, user, manager, teammates] = await Promise.all([
    internshipRef.get(),
    adminFirestore.collection("users").doc(userId).get(),
    internshipRef.collection("managerAssignments").doc(userId).get(),
    internshipRef
      .collection("teammateAssignments")
      .where("teammateUserId", "==", userId)
      .get(),
  ]);
  if (!internshipSnapshot.exists || !user.exists)
    throw new AuthorizationError("ROLE_REQUIRED", "You cannot access this internship.");
  const internship = parseInternshipDocument(internshipSnapshot.data());
  const appUser = appUserSchema.parse(user.data());
  const mentor =
    appUser.active &&
    appUser.roles.includes("teammate") &&
    teammates.docs.some((document) => {
      const data = document.data() as {
        responsibilities?: string[];
        startsAt?: Timestamp;
        endsAt?: Timestamp;
      };
      return (
        data.responsibilities?.includes("mentor") &&
        data.startsAt &&
        isOngoingOrScheduled({ startsAt: data.startsAt, endsAt: data.endsAt })
      );
    });
  const managerAccess =
    appUser.active &&
    appUser.roles.includes("manager") &&
    manager.exists &&
    isCurrentManagerAssignment(
      manager.data() as { startsAt?: Timestamp; endsAt?: Timestamp },
    );
  const intern =
    appUser.active &&
    appUser.roles.includes("intern") &&
    internship.internId === userId;
  if (!intern && !mentor && !managerAccess)
    throw new AuthorizationError("ROLE_REQUIRED", "You cannot access this internship.");
  return { internship, intern, mentor, manager: managerAccess };
}

function dto(
  id: string,
  data: z.infer<typeof achievementSchema>,
  viewer: { intern: boolean; mentor: boolean; manager: boolean },
  userId: string,
  authorName: string,
): AchievementDto {
  const mutable = viewer.intern || viewer.mentor || viewer.manager;
  return {
    id,
    title: data.title,
    description: data.description,
    category: data.category,
    achievedOn: data.achievedOn,
    linkedStage: data.linkedStage,
    evidenceUrl: data.evidenceUrl,
    author: { id: data.createdBy, displayName: authorName },
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
    archivedAt: data.archivedAt?.toDate().toISOString(),
    canEdit:
      !data.archivedAt && mutable && (viewer.manager || data.createdBy === userId),
    canArchive:
      !data.archivedAt && mutable && (viewer.manager || data.createdBy === userId),
    canRestore: Boolean(data.archivedAt && viewer.manager),
  };
}

export async function listAchievements(
  internshipId: string,
  userId: string,
  includeArchived = false,
) {
  recordFirestoreReadPath("achievements.list");
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const viewer = await access(ref, userId);
  const snapshot = await ref
    .collection("achievements")
    .orderBy("achievedOn", "desc")
    .limit(100)
    .get();
  const records = snapshot.docs.flatMap((document) => {
    const parsed = achievementSchema.safeParse(document.data());
    return parsed.success && (includeArchived || !parsed.data.archivedAt)
      ? [[document.id, parsed.data] as const]
      : [];
  });
  const authorReferences = [
    ...new Map(
      records.map(([, record]) => [
        record.createdBy,
        adminFirestore.collection("users").doc(record.createdBy),
      ]),
    ).values(),
  ];
  const authorDocuments = authorReferences.length
    ? await adminFirestore.getAll(...authorReferences)
    : [];
  const users = new Map(authorDocuments.map((document) => [document.id, document]));
  return {
    achievements: records.map(([id, record]) =>
      dto(
        id,
        record,
        viewer,
        userId,
        (users.get(record.createdBy)?.data()?.displayName as string) ?? "Unknown user",
      ),
    ),
    canCreate: viewer.internship.status === "active",
    readOnly: viewer.internship.status !== "active",
  };
}

export async function createAchievement(
  internshipId: string,
  userId: string,
  input: z.infer<typeof achievementInputSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  await adminFirestore.runTransaction(async (transaction) => {
    const [internshipSnapshot, user, manager, teammates] = await Promise.all([
      transaction.get(ref),
      transaction.get(adminFirestore.collection("users").doc(userId)),
      transaction.get(ref.collection("managerAssignments").doc(userId)),
      transaction.get(
        ref.collection("teammateAssignments").where("teammateUserId", "==", userId),
      ),
    ]);
    if (!internshipSnapshot.exists || !user.exists)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You cannot access this internship.",
      );
    const internship = parseInternshipDocument(internshipSnapshot.data());
    const actor = appUserSchema.parse(user.data());
    const mentor =
      actor.active &&
      actor.roles.includes("teammate") &&
      teammates.docs.some((document) => {
        const value = document.data() as {
          responsibilities?: string[];
          startsAt?: Timestamp;
          endsAt?: Timestamp;
        };
        return (
          value.startsAt &&
          value.responsibilities?.includes("mentor") &&
          isOngoingOrScheduled({ startsAt: value.startsAt, endsAt: value.endsAt })
        );
      });
    const managerAccess =
      actor.active &&
      actor.roles.includes("manager") &&
      manager.exists &&
      isCurrentManagerAssignment(
        manager.data() as { startsAt?: Timestamp; endsAt?: Timestamp },
      );
    const intern =
      actor.active && actor.roles.includes("intern") && internship.internId === userId;
    if (!intern && !mentor && !managerAccess)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "You cannot access this internship.",
      );
    if (internship.status !== "active")
      throw new Error("Achievements can only be changed for active internships.");
    if (input.achievedOn < internship.startsAt.toDate().toISOString().slice(0, 10))
      throw new Error("Achievement date cannot be before the internship start date.");
    if (
      input.achievedOn >
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Uzhgorod",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
    )
      throw new Error("Achievement date cannot be in the future.");
    if (
      input.linkedStage &&
      internshipStages.findIndex((stage) => stage.value === input.linkedStage) >
        internshipStages.findIndex((stage) => stage.value === internship.currentStage)
    )
      throw new Error("Achievement cannot be linked to a future stage.");
    assertAchievementBusinessRules(internship, input);
    transaction.create(ref.collection("achievements").doc(), {
      ...input,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function updateAchievement(
  internshipId: string,
  achievementId: string,
  userId: string,
  input: z.infer<typeof achievementInputSchema>,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const viewer = await access(ref, userId);
  if (viewer.internship.status !== "active")
    throw new Error("Achievements can only be changed for active internships.");
  await adminFirestore.runTransaction(async (transaction) => {
    const achievementRef = ref.collection("achievements").doc(achievementId);
    const existing = await transaction.get(achievementRef);
    if (!existing.exists) throw new Error("Achievement not found.");
    const achievement = achievementSchema.parse(existing.data());
    if (achievement.archivedAt)
      throw new Error("Archived achievements cannot be edited.");
    if (!viewer.manager && achievement.createdBy !== userId)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the author or a manager can edit this achievement.",
      );
    assertAchievementBusinessRules(viewer.internship, input);
    transaction.update(achievementRef, {
      ...input,
      updatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function archiveAchievement(
  internshipId: string,
  achievementId: string,
  userId: string,
  restore = false,
) {
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const viewer = await access(ref, userId);
  if (viewer.internship.status !== "active")
    throw new Error("Achievements can only be changed for active internships.");
  await adminFirestore.runTransaction(async (transaction) => {
    const achievementRef = ref.collection("achievements").doc(achievementId);
    const existing = await transaction.get(achievementRef);
    if (!existing.exists) throw new Error("Achievement not found.");
    const achievement = achievementSchema.parse(existing.data());
    if (restore && !viewer.manager)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only a manager can restore an achievement.",
      );
    if (!restore && !viewer.manager && achievement.createdBy !== userId)
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the author or a manager can archive this achievement.",
      );
    transaction.update(
      achievementRef,
      restore
        ? {
            archivedAt: FieldValue.delete(),
            archivedBy: FieldValue.delete(),
            updatedBy: userId,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            archivedAt: FieldValue.serverTimestamp(),
            archivedBy: userId,
            updatedBy: userId,
            updatedAt: FieldValue.serverTimestamp(),
          },
    );
  });
}
