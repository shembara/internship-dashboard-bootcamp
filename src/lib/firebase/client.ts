"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

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

  authInstance = getAuth(app);
  if (environment.authEmulatorHost) {
    connectAuthEmulator(authInstance, `http://${environment.authEmulatorHost}`, {
      disableWarnings: true,
    });
  }

  return authInstance;
}
