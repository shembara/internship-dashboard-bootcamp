import "server-only";

import { applicationDefault, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { getServerEnvironment } from "@/lib/env/server";

import {
  assertSafeFirestoreEnvironment,
  shouldBlockFirestoreForUnitTests,
  throwForBlockedFirestoreAccess,
} from "./firestore-safety";

assertSafeFirestoreEnvironment();
const environment = getServerEnvironment();

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: applicationDefault(),
      projectId: environment.projectId,
    });

export const adminAuth = getAuth(adminApp);

function blockedFirestore(): Firestore {
  return new Proxy({} as Firestore, {
    get() {
      return throwForBlockedFirestoreAccess();
    },
  });
}

// Module imports remain safe for unit tests; actual database use fails before a request.
export const adminFirestore = shouldBlockFirestoreForUnitTests()
  ? blockedFirestore()
  : getFirestore(adminApp, environment.firestoreDatabaseId);
