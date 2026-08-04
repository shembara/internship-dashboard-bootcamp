import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
} from "firebase-admin/firestore";
import { z } from "zod";

import { AuthorizationError } from "@/server/authorization/errors";
import type { ApplicationUserOption, TeamOption } from "@/lib/assignments/types";
import type {
  CurrentInternshipDto,
  InternshipListItemDto,
} from "@/lib/internships/types";
import {
  assignmentStatus,
  assertValidRange,
  containsRange,
  isCurrent,
  isOperationalInternshipStatus,
  isOngoingOrScheduled,
  rangesOverlap,
  type DateRange,
} from "@/server/assignments/domain";
import { readManagerMutationAccess } from "@/server/assignments/manager-access";
import { adminFirestore } from "@/server/firebase/admin";
import {
  parseInternshipDocument,
  serializeNewInternshipLifecycle,
} from "@/server/internships/repository";
import {
  createInitialStageProgress,
  getStageChecklist,
} from "@/server/stage-checklists/service";
import {
  getInternProgressHub,
  getManagerProgressSummary,
  getManagerProgressHub,
  getMentorProgressHub,
} from "@/server/progress-hub/service";
import { appUserSchema, type AppUser } from "@/server/users/app-user";
import {
  teammateResponsibilities,
  type TeammateResponsibility,
} from "@/lib/teammate-responsibilities";

export const responsibilitySchema = z.enum(
  teammateResponsibilities.map(({ value }) => value) as [
    TeammateResponsibility,
    ...TeammateResponsibility[],
  ],
);

export const teamInputSchema = z.union([
  z.object({ teamId: z.string().min(1), newTeamName: z.never().optional() }),
  z.object({
    teamId: z.never().optional(),
    newTeamName: z.string().trim().min(1).max(120),
  }),
]);

const dateSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => Timestamp.fromDate(new Date(value)));

export const createInternshipInputSchema = z.object({
  internId: z.string().min(1),
  team: teamInputSchema,
  startsAt: dateSchema,
  endsAt: dateSchema.optional(),
  initialMentorUserId: z.string().min(1).optional(),
});

export const createPlacementInputSchema = z.object({
  team: teamInputSchema,
  startsAt: dateSchema,
  endsAt: dateSchema.optional(),
});

export const createTeammateAssignmentInputSchema = z.object({
  teammateUserId: z.string().min(1),
  teamId: z.string().min(1),
  responsibilities: z
    .array(responsibilitySchema)
    .max(3)
    .refine(
      (values) => new Set(values).size === values.length,
      "Responsibilities must be unique.",
    ),
  startsAt: dateSchema,
  endsAt: dateSchema.optional(),
});

export const updateResponsibilitiesInputSchema = z.object({
  responsibilities: z
    .array(responsibilitySchema)
    .max(3)
    .refine(
      (values) => new Set(values).size === values.length,
      "Responsibilities must be unique.",
    ),
});

type TeamInput = z.infer<typeof teamInputSchema>;
async function requireManagedInternship(internshipId: string, managerId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const [internship, managerAssignment] = await Promise.all([
    internshipRef.get(),
    internshipRef.collection("managerAssignments").doc(managerId).get(),
  ]);

  const assignmentEndsAt = managerAssignment.exists
    ? (managerAssignment.data()?.endsAt as Timestamp | undefined)
    : undefined;
  if (
    !internship.exists ||
    !managerAssignment.exists ||
    (assignmentEndsAt && assignmentEndsAt.toMillis() < Timestamp.now().toMillis())
  ) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not manage this internship.",
      "manager",
    );
  }

  return internshipRef;
}

async function requireTeammateInternship(internshipId: string, teammateUserId: string) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const [internship, assignments] = await Promise.all([
    internshipRef.get(),
    internshipRef
      .collection("teammateAssignments")
      .where("teammateUserId", "==", teammateUserId)
      .limit(1)
      .get(),
  ]);

  if (!internship.exists || assignments.empty) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You are not assigned to this internship.",
      "teammate",
    );
  }

  return internshipRef;
}

async function resolveTeam(
  transaction: FirebaseFirestore.Transaction,
  input: TeamInput,
  actorId: string,
): Promise<DocumentReference> {
  if ("teamId" in input && input.teamId) {
    const teamRef = adminFirestore.collection("teams").doc(input.teamId);
    const team = await transaction.get(teamRef);
    if (!team.exists) {
      throw new Error("The selected Team no longer exists.");
    }
    return teamRef;
  }

  const teamRef = adminFirestore.collection("teams").doc();
  transaction.create(teamRef, {
    title: input.newTeamName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actorId,
  });
  return teamRef;
}

async function getEligibleUser(
  userId: string,
  role: "intern" | "teammate" | "manager",
): Promise<AppUser> {
  const user = await adminFirestore.collection("users").doc(userId).get();
  if (!user.exists) throw new Error("The selected user no longer exists.");
  const data = appUserSchema.parse(user.data());
  if (!data.active || !data.roles.includes(role)) {
    throw new Error("The selected user is not eligible for this assignment.");
  }
  return data;
}

export async function listManagedInternships(
  managerId: string,
): Promise<InternshipListItemDto[]> {
  const assignments = await adminFirestore
    .collectionGroup("managerAssignments")
    .where("userId", "==", managerId)
    .get();

  const results = await Promise.all(
    assignments.docs.map(async (assignment) => {
      const internship = await assignment.ref.parent.parent?.get();
      if (!internship?.exists) return undefined;
      const data = parseInternshipDocument(internship.data());
      const intern = await adminFirestore.collection("users").doc(data.internId).get();
      return {
        id: internship.id,
        status: data.status,
        currentStage: data.currentStage,
        internName: intern.exists
          ? (intern.data()?.displayName as string)
          : "Unknown intern",
        progressSummary: await getManagerProgressSummary(
          internship.ref,
          data,
          managerId,
        ),
      };
    }),
  );

  return results.filter((result): result is NonNullable<typeof result> =>
    Boolean(result),
  );
}

export async function listTeammateInternships(
  teammateUserId: string,
): Promise<InternshipListItemDto[]> {
  const assignments = await adminFirestore
    .collectionGroup("teammateAssignments")
    .where("teammateUserId", "==", teammateUserId)
    .get();
  const internshipRefs = new Map(
    assignments.docs.flatMap((assignment) => {
      const internshipRef = assignment.ref.parent.parent;
      return internshipRef ? [[internshipRef.id, internshipRef] as const] : [];
    }),
  );
  const results = await Promise.all(
    [...internshipRefs.values()].map(async (internshipRef) => {
      const internship = await internshipRef.get();
      if (!internship.exists) return undefined;
      const data = parseInternshipDocument(internship.data());
      const intern = await adminFirestore.collection("users").doc(data.internId).get();
      return {
        id: internship.id,
        status: data.status,
        currentStage: data.currentStage,
        internName: intern.exists
          ? (intern.data()?.displayName as string)
          : "Unknown intern",
      };
    }),
  );

  return results
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
    .sort((a, b) => a.internName.localeCompare(b.internName));
}

export async function getCurrentInternshipForIntern(
  internId: string,
): Promise<CurrentInternshipDto | undefined> {
  const now = Timestamp.now();
  const internships = await adminFirestore
    .collection("internships")
    .where("internId", "==", internId)
    .get();
  const candidates = internships.docs.map((document) => ({
    id: document.id,
    ref: document.ref,
    ...parseInternshipDocument(document.data()),
  }));
  const current = candidates
    .filter(
      (internship) =>
        internship.status === "active" && isOngoingOrScheduled(internship, now),
    )
    .sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis())[0];
  const historical = candidates
    .filter((internship) => internship.status !== "active")
    .sort(
      (a, b) =>
        b.updatedAt.toMillis() - a.updatedAt.toMillis() ||
        b.startsAt.toMillis() - a.startsAt.toMillis(),
    )[0];
  const selected = current ?? historical;

  return selected
    ? await (async () => {
      const checklist = await getStageChecklist(selected.ref, selected, internId);
      const progressHub = await getInternProgressHub(
        selected.ref,
        selected,
        internId,
        checklist,
      );
      return {
        id: selected.id,
        status: selected.status,
        currentStage: selected.currentStage,
        checklist,
        progressHub,
      };
    })()
    : undefined;
}

export async function listEligibleUsers(
  role: "intern" | "teammate" | "manager",
): Promise<ApplicationUserOption[]> {
  const snapshot = await adminFirestore
    .collection("users")
    .where("active", "==", true)
    .where("roles", "array-contains", role)
    .get();
  return snapshot.docs.map((document) => {
    const data = appUserSchema.parse(document.data());
    return {
      id: document.id,
      displayName: data.displayName,
      email: data.email,
      identityState: data.identityState,
    };
  });
}

async function listUnavailableInternIds(): Promise<Set<string>> {
  const now = Timestamp.now();
  const internships = await adminFirestore.collection("internships").get();

  return new Set(
    internships.docs.flatMap((document) => {
      const data = parseInternshipDocument(document.data());
      return data.status === "active" && isOngoingOrScheduled(data, now)
        ? [data.internId]
        : [];
    }),
  );
}

export async function listAvailableInterns(): Promise<ApplicationUserOption[]> {
  const [interns, unavailableInternIds] = await Promise.all([
    listEligibleUsers("intern"),
    listUnavailableInternIds(),
  ]);

  return interns.filter((intern) => !unavailableInternIds.has(intern.id));
}

export async function getManagedInternshipDetail(
  internshipId: string,
  managerId: string,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const [internship, placements, assignments, teammates] = await Promise.all([
    internshipRef.get(),
    internshipRef.collection("teamPlacements").orderBy("startsAt", "desc").get(),
    internshipRef.collection("teammateAssignments").orderBy("startsAt", "desc").get(),
    listEligibleUsers("teammate"),
  ]);
  const internshipData = parseInternshipDocument(internship.data());
  const intern = await adminFirestore
    .collection("users")
    .doc(internshipData.internId)
    .get();
  const teamIds = new Set<string>();
  placements.docs.forEach((document) => teamIds.add(document.data().teamId as string));
  assignments.docs.forEach((document) => teamIds.add(document.data().teamId as string));
  const teams = new Map(
    (
      await Promise.all(
        [...teamIds].map(async (id) => {
          const document = await adminFirestore.collection("teams").doc(id).get();
          return [id, document.data()?.title as string | undefined] as const;
        }),
      )
    ).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const teammateIds = new Set(
    assignments.docs.map((document) => document.data().teammateUserId as string),
  );
  const teammateNames = new Map(
    await Promise.all(
      [...teammateIds].map(async (id) => {
        const document = await adminFirestore.collection("users").doc(id).get();
        return [id, document.data()?.displayName as string | undefined] as const;
      }),
    ),
  );
  const checklist = await getStageChecklist(internshipRef, internshipData, managerId);
  const progressHub = await getManagerProgressHub(
    internshipRef,
    internshipData,
    managerId,
    checklist,
  );
  return {
    internship: {
      id: internshipId,
      status: internshipData.status,
      currentStage: internshipData.currentStage,
      internName: intern.data()?.displayName as string,
      checklist,
      progressHub,
    },
    placements: placements.docs.map((document) => {
      const data = document.data() as DateRange & { teamId: string };
      return {
        id: document.id,
        teamId: data.teamId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        current: isCurrent(data),
        status: assignmentStatus(data),
        teamTitle: teams.get(data.teamId) ?? "Unknown Team",
      };
    }),
    assignments: assignments.docs.map((document) => {
      const data = document.data() as DateRange & {
        teamId: string;
        teammateUserId: string;
        responsibilities: string[];
      };
      return {
        id: document.id,
        teamId: data.teamId,
        teammateUserId: data.teammateUserId,
        teammateName: teammateNames.get(data.teammateUserId) ?? "Unknown teammate",
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        current: isCurrent(data),
        status: assignmentStatus(data),
        responsibilities: data.responsibilities,
        teamTitle: teams.get(data.teamId) ?? "Unknown Team",
      };
    }),
    teammates,
  };
}

export async function getTeammateInternshipDetail(
  internshipId: string,
  teammateUserId: string,
) {
  const internshipRef = await requireTeammateInternship(internshipId, teammateUserId);
  const internship = await internshipRef.get();
  const data = parseInternshipDocument(internship.data());
  const intern = await adminFirestore.collection("users").doc(data.internId).get();

  const checklist = await getStageChecklist(internshipRef, data, teammateUserId);
  let progressHub;
  try {
    progressHub = await getMentorProgressHub(
      internshipRef,
      data,
      teammateUserId,
      checklist,
    );
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
  }
  return {
    id: internshipId,
    status: data.status,
    currentStage: data.currentStage,
    internName: intern.exists
      ? (intern.data()?.displayName as string)
      : "Unknown intern",
    checklist,
    progressHub,
  };
}

export async function searchTeams(query: string): Promise<TeamOption[]> {
  const snapshot = await adminFirestore
    .collection("teams")
    .orderBy("title")
    .limit(30)
    .get();
  const normalizedQuery = query.trim().toLowerCase();
  return snapshot.docs
    .map((document) => ({ id: document.id, title: document.data().title as string }))
    .filter(
      (team) => !normalizedQuery || team.title.toLowerCase().includes(normalizedQuery),
    );
}

export async function createInternship(
  managerId: string,
  input: z.infer<typeof createInternshipInputSchema>,
) {
  assertValidRange(input);
  const internshipRef = adminFirestore.collection("internships").doc();

  await adminFirestore.runTransaction(async (transaction) => {
    const internRef = adminFirestore.collection("users").doc(input.internId);
    const managerRef = adminFirestore.collection("users").doc(managerId);
    const conflictsQuery = adminFirestore
      .collection("internships")
      .where("internId", "==", input.internId);
    const guardRef = adminFirestore.collection("internshipGuards").doc(input.internId);
    const [intern, manager, mentor, conflicts, guard] = await Promise.all([
      transaction.get(internRef),
      transaction.get(managerRef),
      input.initialMentorUserId
        ? transaction.get(
          adminFirestore.collection("users").doc(input.initialMentorUserId),
        )
        : Promise.resolve(undefined),
      transaction.get(conflictsQuery),
      transaction.get(guardRef),
    ]);
    const internUser = intern.exists ? appUserSchema.parse(intern.data()) : undefined;
    const managerUser = manager.exists
      ? appUserSchema.parse(manager.data())
      : undefined;
    if (!internUser?.active || !internUser.roles.includes("intern")) {
      throw new Error("The selected user is not an eligible intern.");
    }
    if (!managerUser?.active || !managerUser.roles.includes("manager")) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "An active manager is required.",
        "manager",
      );
    }
    const mentorUser = mentor?.exists ? appUserSchema.parse(mentor.data()) : undefined;
    if (
      input.initialMentorUserId &&
      (!mentorUser?.active || !mentorUser.roles.includes("teammate"))
    ) {
      throw new Error("The selected user is not an eligible mentor.");
    }
    if (guard.exists) {
      throw new Error(
        "The selected intern already has an ongoing or scheduled internship.",
      );
    }
    if (input.initialMentorUserId === managerId) {
      throw new Error("A manager cannot be assigned as the initial mentor.");
    }
    if (
      conflicts.docs.some((document) => {
        const existing = parseInternshipDocument(document.data());
        return existing.status === "active" && isOngoingOrScheduled(existing);
      })
    ) {
      throw new Error(
        "The selected intern already has an ongoing or scheduled internship.",
      );
    }
    const teamRef = await resolveTeam(transaction, input.team, managerId);
    transaction.create(internshipRef, {
      internId: input.internId,
      ...serializeNewInternshipLifecycle(),
      startsAt: input.startsAt,
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(guardRef, {
      internshipId: internshipRef.id,
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(
      internshipRef.collection("stageProgress").doc("onboarding"),
      createInitialStageProgress("onboarding", managerId),
    );
    transaction.create(internshipRef.collection("managerAssignments").doc(managerId), {
      userId: managerId,
      startsAt: input.startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    transaction.create(internshipRef.collection("teamPlacements").doc(), {
      teamId: teamRef.id,
      startsAt: input.startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
    if (input.initialMentorUserId) {
      transaction.create(internshipRef.collection("teammateAssignments").doc(), {
        teammateUserId: input.initialMentorUserId,
        teamId: teamRef.id,
        responsibilities: ["mentor"],
        startsAt: input.startsAt,
        ...(input.endsAt ? { endsAt: input.endsAt } : {}),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: managerId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: managerId,
      });
    }
  });
  return { id: internshipRef.id };
}

export async function addTeamPlacement(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof createPlacementInputSchema>,
) {
  assertValidRange(input);
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      internshipRef,
      managerId,
    );
    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }
    const placements = await transaction.get(
      internshipRef.collection("teamPlacements"),
    );
    const existing = placements.docs.map((document) => ({
      ref: document.ref,
      ...(document.data() as DateRange & { teamId: string }),
    }));
    if (existing.some((placement) => rangesOverlap(placement, input))) {
      const ongoing = existing.find(
        (placement) =>
          !placement.endsAt &&
          placement.startsAt.toMillis() < input.startsAt.toMillis(),
      );
      if (!ongoing) throw new Error("Team Placements cannot overlap.");
      const previousEnd = Timestamp.fromMillis(input.startsAt.toMillis() - 1);
      transaction.update(ongoing.ref, {
        endsAt: previousEnd,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: managerId,
      });
      const teammates = await transaction.get(
        internshipRef.collection("teammateAssignments"),
      );
      teammates.docs.forEach((document) => {
        const assignment = document.data() as DateRange & { teamId: string };
        if (assignment.teamId === ongoing.teamId && !assignment.endsAt) {
          transaction.update(document.ref, {
            endsAt: previousEnd,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: managerId,
          });
        }
      });
    }
    const teamRef = await resolveTeam(transaction, input.team, managerId);
    transaction.create(internshipRef.collection("teamPlacements").doc(), {
      teamId: teamRef.id,
      startsAt: input.startsAt,
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}

export async function addTeammateAssignment(
  internshipId: string,
  managerId: string,
  input: z.infer<typeof createTeammateAssignmentInputSchema>,
) {
  assertValidRange(input);
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const eligibleUser = await getEligibleUser(input.teammateUserId, "teammate");
  if (input.teammateUserId === managerId)
    throw new Error("A manager cannot be assigned as a teammate.");
  await adminFirestore.runTransaction(async (transaction) => {
    const internship = await readManagerMutationAccess(
      transaction,
      internshipRef,
      managerId,
    );
    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }
    const placements = await transaction.get(
      internshipRef.collection("teamPlacements"),
    );
    const hasPlacement = placements.docs.some((document) => {
      const placement = document.data() as DateRange & { teamId: string };
      return placement.teamId === input.teamId && containsRange(placement, input);
    });
    if (!hasPlacement)
      throw new Error("The teammate assignment must fit a Team Placement.");
    const assignments = await transaction.get(
      internshipRef.collection("teammateAssignments"),
    );
    if (
      assignments.docs.some((document) => {
        const assignment = document.data() as DateRange & {
          teammateUserId: string;
          teamId: string;
        };
        return (
          assignment.teammateUserId === input.teammateUserId &&
          assignment.teamId === input.teamId &&
          rangesOverlap(assignment, input)
        );
      })
    )
      throw new Error(
        "This teammate already has an overlapping assignment for this Team.",
      );
    transaction.create(internshipRef.collection("teammateAssignments").doc(), {
      ...input,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: managerId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
  return { displayName: eligibleUser.displayName };
}

export async function updateTeammateResponsibilities(
  internshipId: string,
  assignmentId: string,
  managerId: string,
  responsibilities: z.infer<
    typeof updateResponsibilitiesInputSchema
  >["responsibilities"],
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);
  await adminFirestore.runTransaction(async (transaction) => {
    const [internship, assignment] = await Promise.all([
      readManagerMutationAccess(transaction, internshipRef, managerId),
      transaction.get(assignmentRef),
    ]);
    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }
    if (!assignment.exists) throw new Error("Teammate assignment not found.");
    if (assignmentStatus(assignment.data() as DateRange) === "ended") {
      throw new Error("Ended assignments cannot be edited.");
    }
    transaction.update(assignmentRef, {
      responsibilities,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}

export async function closeTeammateAssignment(
  internshipId: string,
  assignmentId: string,
  managerId: string,
) {
  const internshipRef = await requireManagedInternship(internshipId, managerId);
  const assignmentRef = internshipRef
    .collection("teammateAssignments")
    .doc(assignmentId);
  await adminFirestore.runTransaction(async (transaction) => {
    const [internship, assignment] = await Promise.all([
      readManagerMutationAccess(transaction, internshipRef, managerId),
      transaction.get(assignmentRef),
    ]);
    if (!isOperationalInternshipStatus(internship.status)) {
      throw new Error("Completed and cancelled internships are read-only.");
    }
    if (!assignment.exists) throw new Error("Teammate assignment not found.");
    if ((assignment.data() as DateRange).endsAt) return;
    transaction.update(assignmentRef, {
      endsAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: managerId,
    });
  });
}
