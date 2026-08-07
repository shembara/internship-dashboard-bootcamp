import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/domain";
import { AuthorizationError } from "@/server/authorization/errors";
import { resolveProgressHubAccess } from "@/server/progress-hub/service";
import { getWeekPeriod } from "@/lib/progress-hub/week";
import {
  weekKeySchema,
  ratingsSchema,
  SkillRatings,
} from "@/lib/skills/types";
import {
  skillRatingsDocumentSchema,
  type SkillRatingsDocument,
} from "@/server/skills/types";
import { NotFoundError, BadRequestError } from "@/server/errors";

export const skillRatingsMutationSchema = z.object({
  weekKey: weekKeySchema,
  ratings: ratingsSchema,
});

export async function saveSkillRatings(
  internshipId: string,
  weekKey: string,
  ratings: SkillRatings,
  actorUserId: string,
) {
  if (getWeekPeriod(weekKey).state !== "current") {
    throw new BadRequestError("Only current week records can be created or updated.");
  }

  const internshipRef = adminFirestore.collection("internships").doc(internshipId);

  await adminFirestore.runTransaction(async (transaction) => {
    const internshipSnap = await transaction.get(internshipRef);
    if (!internshipSnap.exists) {
      throw new NotFoundError("Internship not found.");
    }

    const internship = parseInternshipDocument(internshipSnap.data());

    if (internship.status !== "active") {
      throw new BadRequestError("Skill ratings can only be saved for an active internship.");
    }

    const [userSnap, managerAssignmentSnap, teammateAssignmentsQuery] = await Promise.all([
      transaction.get(adminFirestore.collection("users").doc(actorUserId)),
      transaction.get(internshipRef.collection("managerAssignments").doc(actorUserId)),
      transaction.get(
        internshipRef
          .collection("teammateAssignments")
          .where("teammateUserId", "==", actorUserId),
      ),
    ]);

    const access = resolveProgressHubAccess(
      internship,
      actorUserId,
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

    const now = Timestamp.now();
    const docRef = internshipRef.collection("skillRatings").doc(weekKey);
    const existing = await transaction.get(docRef);

    if (!existing.exists) {
      transaction.set(docRef, {
        weekKey,
        ratings,
        createdBy: actorUserId,
        createdAt: now,
        updatedBy: actorUserId,
        updatedAt: now,
      });
    } else {
      transaction.update(docRef, {
        ratings,
        updatedBy: actorUserId,
        updatedAt: now,
      });
    }
  });

  return {
    weekKey,
    ratings,
    updatedAt: new Date().toISOString(),
    updatedBy: actorUserId,
  };
}

export async function getSkillRatings(
  internshipId: string,
  userId: string,
  options?: { weekKey?: string; limit?: number },
): Promise<SkillRatingsDocument | SkillRatingsDocument[] | null> {
  const internshipRef = adminFirestore.collection("internships").doc(internshipId);
  const internshipSnap = await internshipRef.get();
  if (!internshipSnap.exists) throw new NotFoundError("Internship not found.");
  const internship = parseInternshipDocument(internshipSnap.data());

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
