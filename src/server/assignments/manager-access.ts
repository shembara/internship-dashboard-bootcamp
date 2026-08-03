import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { isCurrentManagerAssignment } from "@/server/assignments/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/repository";
import type { InternshipDocument } from "@/server/internships/domain";
import { appUserSchema } from "@/server/users/app-user";

const managerAssignmentSchema = z.object({
  userId: z.string().min(1),
  startsAt: z.instanceof(Timestamp).optional(),
  endsAt: z.instanceof(Timestamp).optional(),
});

export function assertManagerAccessSnapshots(
  internshipSnapshot: FirebaseFirestore.DocumentSnapshot,
  userSnapshot: FirebaseFirestore.DocumentSnapshot,
  assignmentSnapshot: FirebaseFirestore.DocumentSnapshot,
  managerId: string,
): InternshipDocument {
  if (
    !internshipSnapshot.exists ||
    !userSnapshot.exists ||
    !assignmentSnapshot.exists
  ) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not manage this internship.",
      "manager",
    );
  }
  const manager = appUserSchema.parse(userSnapshot.data());
  const assignment = managerAssignmentSchema.parse(assignmentSnapshot.data());
  if (
    !manager.active ||
    !manager.roles.includes("manager") ||
    assignment.userId !== managerId ||
    !isCurrentManagerAssignment(assignment)
  ) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      "You do not manage this internship.",
      "manager",
    );
  }
  return parseInternshipDocument(internshipSnapshot.data());
}

export async function readManagerMutationAccess(
  transaction: FirebaseFirestore.Transaction,
  internshipRef: FirebaseFirestore.DocumentReference,
  managerId: string,
) {
  const [internship, user, assignment] = await Promise.all([
    transaction.get(internshipRef),
    transaction.get(adminFirestore.collection("users").doc(managerId)),
    transaction.get(internshipRef.collection("managerAssignments").doc(managerId)),
  ]);
  return assertManagerAccessSnapshots(internship, user, assignment, managerId);
}
