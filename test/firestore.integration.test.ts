import { deleteApp, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminFirestore } from "@/server/firebase/admin";
import { findAppUserByFirebaseUid } from "@/server/repositories/app-users";
import { getClientEnvironment } from "@/lib/env/client";

const firebaseUid = "integration-user";
const userId = "integration-app-user";

beforeAll(async () => {
  await adminFirestore
    .collection("users")
    .doc(userId)
    .set({
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      displayName: "Integration User",
      email: "integration@example.com",
      identities: [{ provider: "firebase", subject: firebaseUid }],
      roles: ["teammate"],
      updatedAt: FieldValue.serverTimestamp(),
    });
});

afterAll(async () => {
  await adminFirestore.collection("users").doc(userId).delete();
});

describe("server-only Firestore boundary", () => {
  it("allows the server repository to resolve an application user", async () => {
    const appUser = await findAppUserByFirebaseUid(firebaseUid);

    expect(appUser?.id).toBe(userId);
    expect(appUser?.data.roles).toEqual(["teammate"]);
  });

  it("denies direct client reads through Firestore Rules", async () => {
    const firebase = getClientEnvironment().firebase;
    if (!firebase) {
      throw new Error(
        "Development Firebase web configuration is required for this test.",
      );
    }

    const clientApp = initializeApp(firebase, "integration-client");
    const clientFirestore = getFirestore(clientApp);

    await expect(getDoc(doc(clientFirestore, "users", userId))).rejects.toMatchObject({
      code: "permission-denied",
    });

    await deleteApp(clientApp);
  });
});
