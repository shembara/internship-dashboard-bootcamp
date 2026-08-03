import "server-only";

import { AuthenticationError } from "./errors";
import { getOptionalFirebaseSessionUser } from "./firebase-session-provider";
import type { AuthenticatedUser } from "./types";

export async function getOptionalAuthenticatedUser(): Promise<
  AuthenticatedUser | undefined
> {
  return getOptionalFirebaseSessionUser();
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getOptionalAuthenticatedUser();

  if (!user) {
    throw new AuthenticationError("UNAUTHENTICATED", "Authentication is required.");
  }

  return user;
}
