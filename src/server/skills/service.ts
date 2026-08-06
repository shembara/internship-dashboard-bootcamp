import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { resolveProgressHubAccess } from "@/server/progress-hub/service";
import {
  weekKeySchema,
  ratingsSchema,
  skillRatingsDocumentSchema,
  type SkillRatingsDocument,
} from "@/lib/skills/types";

export const skillRatingsMutationSchema = z.object({
  weekKey: weekKeySchema,
  ratings: ratingsSchema,
});

// Save skill ratings for a given internship and weekKey. Only an assigned mentor may save.
export async function saveSkillRatings(
  internshipId: string,
  userId: string,
  input: z.infer<typeof skillRatingsMutationSchema>,
) {
  const mutation = skillRatingsMutationSchema.parse(input);
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);

  // Enforce that only the current week may be created/updated
  const { getWeekPeriod } = await import("@/lib/progress-hub/week");
  const week = getWeekPeriod(mutation.weekKey);
  if (week.state !== "current") {
    throw new Error("Only current week records can be created or updated.");
  }

  await adminFirestore.runTransaction(async (transaction) => {
    const internshipSnap = await transaction.get(internshipRef);
    if (!internshipSnap.exists) throw new Error("Internship not found.");
    const internship = parseInternshipDocument(internshipSnap.data());

    if (internship.status !== "active") {
      throw new Error("Skill ratings can only be saved for an active internship.");
    }

    // Load context needed to resolve access
    const [userSnap, managerAssignmentSnap, teammateAssignmentsQuery] = await Promise.all([
      transaction.get(adminFirestore.collection("users").doc(userId)),
      transaction.get(internshipRef.collection("managerAssignments").doc(userId)),
      transaction.get(
        internshipRef
          .collection("teammateAssignments")
          .where("teammateUserId", "==", userId),
      ),
    ]);

    const access = resolveProgressHubAccess(
      internship,
      userId,
      userSnap,
      managerAssignmentSnap,
      teammateAssignmentsQuery,
    );

    if (!access.mentor) {
      throw new AuthorizationError(
        "ROLE_REQUIRED",
        "Only the assigned mentor can save skill ratings.",
      );
    }

    if (!access.writable) {
      throw new Error("Internship is not writable.");
    }

    const now = Timestamp.now();
    const docRef = internshipRef.collection("skillRatings").doc(mutation.weekKey);
    const existing = await transaction.get(docRef);

    if (!existing.exists) {
      transaction.set(docRef, {
        weekKey: mutation.weekKey,
        ratings: mutation.ratings,
        createdBy: userId,
        createdAt: now,
        updatedBy: userId,
        updatedAt: now,
      });
    } else {
      transaction.update(docRef, {
        ratings: mutation.ratings,
        updatedBy: userId,
        updatedAt: now,
      });
    }
  });
}

export async function getSkillRatings(
  internshipId: string,
  userId: string,
  options?: { weekKey?: string; limit?: number },
) {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internshipSnap = await internshipRef.get();
  if (!internshipSnap.exists) throw new Error("Internship not found.");
  const internship = parseInternshipDocument(internshipSnap.data());

  // Load access similar to other services
  const [userSnap, managerAssignmentSnap, teammateAssignmentsQuery] = await Promise.all([
    adminFirestore.collection("users").doc(userId).get(),
    internshipRef.collection("managerAssignments").doc(userId).get(),
    internshipRef.collection("teammateAssignments").where("teammateUserId", "==", userId).get(),
  ]);

  const access = resolveProgressHubAccess(
    internship,
    userId,
    userSnap,
    managerAssignmentSnap,
    teammateAssignmentsQuery,
  );

  if (!access.intern && !access.mentor && !access.manager) {
    throw new AuthorizationError("ROLE_REQUIRED", "Not authorized to view skill ratings.");
  }

  const { weekKey, limit = 16 } = options ?? {};
  const collection = internshipRef.collection("skillRatings");
  if (weekKey) {
    const doc = await collection.doc(weekKey).get();
    if (!doc.exists) return null;
    return skillRatingsDocumentSchema.parse(doc.data());
  }

  const querySnap = await collection.orderBy("weekKey", "desc").limit(limit).get();
  return querySnap.docs.map((d) => skillRatingsDocumentSchema.parse(d.data()));
}
