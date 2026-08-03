import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/server/firebase/admin";
import { recordFirestoreReadPath } from "@/server/firebase/read-diagnostics";
import { appUserSchema, type AppUserRecord } from "@/server/users/app-user";

export class DuplicateIdentityError extends Error {
  constructor() {
    super("More than one application user has the same identity.");
    this.name = "DuplicateIdentityError";
  }
}

export async function findAppUserByFirebaseUid(
  firebaseUid: string,
): Promise<AppUserRecord | undefined> {
  recordFirestoreReadPath("users.find-by-firebase-uid");
  const identity = {
    provider: "firebase",
    subject: firebaseUid,
  };

  const snapshot = await adminFirestore
    .collection("users")
    .where("identities", "array-contains", identity)
    .limit(2)
    .get();

  if (snapshot.size > 1) {
    throw new DuplicateIdentityError();
  }

  const document = snapshot.docs[0];
  if (!document) {
    return undefined;
  }

  return {
    id: document.id,
    data: appUserSchema.parse(document.data()),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findAppUserByEmail(
  email: string,
): Promise<AppUserRecord | undefined> {
  recordFirestoreReadPath("users.find-by-email");
  const snapshot = await adminFirestore
    .collection("users")
    .where("email", "==", email)
    .limit(2)
    .get();

  if (snapshot.size > 1) {
    throw new DuplicateIdentityError();
  }

  const document = snapshot.docs[0];
  return document
    ? { id: document.id, data: appUserSchema.parse(document.data()) }
    : undefined;
}

export async function linkPendingAppUser(
  firebaseUid: string,
  email: string,
): Promise<AppUserRecord | undefined> {
  const normalizedEmail = normalizeEmail(email);

  return adminFirestore.runTransaction(async (transaction) => {
    const existingIdentity = await transaction.get(
      adminFirestore
        .collection("users")
        .where("identities", "array-contains", {
          provider: "firebase",
          subject: firebaseUid,
        })
        .limit(2),
    );

    if (existingIdentity.size > 1) {
      throw new DuplicateIdentityError();
    }

    const linkedDocument = existingIdentity.docs[0];
    if (linkedDocument) {
      return {
        id: linkedDocument.id,
        data: appUserSchema.parse(linkedDocument.data()),
      };
    }

    const pendingSnapshot = await transaction.get(
      adminFirestore.collection("users").where("email", "==", normalizedEmail).limit(2),
    );

    if (pendingSnapshot.size > 1) {
      throw new DuplicateIdentityError();
    }

    const pendingDocument = pendingSnapshot.docs[0];
    if (!pendingDocument) {
      return undefined;
    }

    const pendingUser = appUserSchema.parse(pendingDocument.data());
    if (pendingUser.identityState !== "pending" || pendingUser.identities.length) {
      return undefined;
    }

    const identity = { provider: "firebase" as const, subject: firebaseUid };
    transaction.update(pendingDocument.ref, {
      identities: [identity],
      identityState: "linked",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      id: pendingDocument.id,
      data: { ...pendingUser, identityState: "linked", identities: [identity] },
    };
  });
}
