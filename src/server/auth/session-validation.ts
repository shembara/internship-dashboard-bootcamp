import { AuthenticationError } from "./errors";
import type { AuthenticatedUser } from "./types";

export type FirebaseIdentityClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: unknown;
  auth_time?: number;
  firebase?: { sign_in_provider?: string };
};

export function validateIdentityClaims(
  claims: FirebaseIdentityClaims,
  allowDevelopmentPassword: boolean,
): AuthenticatedUser {
  if (!claims.email) {
    throw new AuthenticationError(
      "INVALID_SESSION",
      "The authenticated identity has no email.",
    );
  }

  if (!claims.email_verified) {
    throw new AuthenticationError("UNVERIFIED_EMAIL", "A verified email is required.");
  }

  const provider = claims.firebase?.sign_in_provider;
  const allowedProviders = new Set([
    "google.com",
    ...(allowDevelopmentPassword ? ["password"] : []),
  ]);

  if (!provider || !allowedProviders.has(provider)) {
    throw new AuthenticationError(
      "UNSUPPORTED_PROVIDER",
      "The identity provider is not enabled.",
    );
  }

  return {
    uid: claims.uid,
    email: claims.email,
    displayName: typeof claims.name === "string" ? claims.name : undefined,
    emailVerified: true,
  };
}

export function assertRecentAuthentication(
  authenticationTime: number | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): void {
  if (authenticationTime === undefined || nowSeconds - authenticationTime > 300) {
    throw new AuthenticationError(
      "INVALID_SESSION",
      "Sign in again before creating an application session.",
    );
  }
}
