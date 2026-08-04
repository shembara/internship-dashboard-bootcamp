import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/server/firebase/admin";
import { appUserSchema, type AppUser } from "@/server/users/app-user";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AppUserRecord = {
  id: string;
  data: AppUser;
};

export async function findAppUserByEmail(
  email: string,
): Promise<AppUserRecord | undefined> {
  const normalized = normalizeEmail(email);
  const snapshot = await adminFirestore
    .collection("users")
    .where("email", "==", normalized)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return undefined;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: appUserSchema.parse(doc.data()),
  };
}

export async function findAppUserByFirebaseUid(
  firebaseUid: string,
): Promise<AppUserRecord | undefined> {
  const snapshot = await adminFirestore
    .collection("users")
    .where("identities", "array-contains", {
      provider: "firebase",
      subject: firebaseUid,
    })
    .limit(1)
    .get();

  if (snapshot.empty) {
    return undefined;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: appUserSchema.parse(doc.data()),
  };
}

export async function linkPendingAppUser(
  firebaseUid: string,
  email: string,
): Promise<AppUserRecord | undefined> {
  const normalized = normalizeEmail(email);
  const userRecord = await findAppUserByEmail(normalized);

  if (!userRecord || userRecord.data.identityState !== "pending") {
    return undefined;
  }

  const userRef = adminFirestore.collection("users").doc(userRecord.id);
  const newIdentity = { provider: "firebase", subject: firebaseUid };

  await userRef.update({
    identityState: "linked",
    identities: FieldValue.arrayUnion(newIdentity),
    updatedAt: FieldValue.serverTimestamp(), // <-- Додано оновлення часу updatedAt
  });

  const updatedDoc = await userRef.get();
  return {
    id: updatedDoc.id,
    data: appUserSchema.parse(updatedDoc.data()),
  };
}
