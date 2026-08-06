"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  initializeAuth,
  type Auth,
} from "firebase/auth";

import { getClientEnvironment } from "@/lib/env/client";

let authInstance: Auth | undefined;

export function getFirebaseClientAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const environment = getClientEnvironment();
  const app = getApps().length
    ? getApp()
    : environment.firebase
      ? initializeApp(environment.firebase)
      : initializeApp();

  // The SDK's default IndexedDB-backed persistence can drop the pending
  // redirect-sign-in result when a transaction is interrupted by the
  // page's navigation to/from the identity provider (a known SDK issue:
  // https://github.com/firebase/firebase-js-sdk/issues/10041), surfacing
  // as a thrown "Database is closing/hidden" error. Plain localStorage
  // persistence has no such async-transaction race. popupRedirectResolver
  // must be supplied explicitly here (getAuth() includes it by default,
  // but initializeAuth() does not), or signInWithRedirect/getRedirectResult
  // throw auth/argument-error.
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  if (environment.authEmulatorHost) {
    connectAuthEmulator(authInstance, `http://${environment.authEmulatorHost}`, {
      disableWarnings: true,
    });
  }

  return authInstance;
}
