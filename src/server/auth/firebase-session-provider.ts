import "server-only";

import { cookies } from "next/headers";

import { getServerEnvironment } from "@/lib/env/server";
import { adminAuth } from "@/server/firebase/admin";

import {
  assertRecentAuthentication,
  validateIdentityClaims,
} from "./session-validation";
import type { AuthenticatedUser } from "./types";

const environment = getServerEnvironment();

function toAuthenticatedUser(
  decodedToken: Awaited<ReturnType<typeof adminAuth.verifySessionCookie>>,
): AuthenticatedUser {
  return validateIdentityClaims(
    decodedToken,
    environment.authenticationMode === "email-password-development",
  );
}

export async function createFirebaseSessionCookie(idToken: string): Promise<string> {
  const decodedToken = await adminAuth.verifyIdToken(idToken, true);
  assertRecentAuthentication(decodedToken.auth_time);
  validateIdentityClaims(
    decodedToken,
    environment.authenticationMode === "email-password-development",
  );

  return adminAuth.createSessionCookie(idToken, {
    expiresIn: environment.sessionMaxAgeSeconds * 1000,
  });
}

export async function getOptionalFirebaseSessionUser(): Promise<
  AuthenticatedUser | undefined
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(environment.sessionCookieName)?.value;

  if (!sessionCookie) {
    return undefined;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return toAuthenticatedUser(decodedToken);
  } catch {
    return undefined;
  }
}

export async function setFirebaseSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(environment.sessionCookieName, sessionCookie, {
    httpOnly: true,
    maxAge: environment.sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearFirebaseSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(environment.sessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
