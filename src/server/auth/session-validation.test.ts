import { describe, expect, it } from "vitest";

import { AuthenticationError } from "./errors";
import {
  assertRecentAuthentication,
  validateIdentityClaims,
} from "./session-validation";

const googleClaims = {
  uid: "firebase-uid",
  email: "person@example.com",
  email_verified: true,
  name: "Person",
  firebase: { sign_in_provider: "google.com" },
};

describe("Firebase session claim validation", () => {
  it("accepts a verified Google identity", () => {
    expect(validateIdentityClaims(googleClaims, false)).toEqual({
      uid: "firebase-uid",
      email: "person@example.com",
      displayName: "Person",
      emailVerified: true,
    });
  });

  it("accepts a password persona only in development password mode", () => {
    const claims = {
      ...googleClaims,
      firebase: { sign_in_provider: "password" },
    };

    expect(validateIdentityClaims(claims, true).uid).toBe("firebase-uid");
    expect(() => validateIdentityClaims(claims, false)).toThrowError(
      expect.objectContaining<Partial<AuthenticationError>>({
        code: "UNSUPPORTED_PROVIDER",
      }),
    );
  });

  it("rejects unverified and missing email claims", () => {
    expect(() =>
      validateIdentityClaims({ ...googleClaims, email_verified: false }, false),
    ).toThrowError(
      expect.objectContaining<Partial<AuthenticationError>>({
        code: "UNVERIFIED_EMAIL",
      }),
    );
    expect(() =>
      validateIdentityClaims({ ...googleClaims, email: undefined }, false),
    ).toThrowError(
      expect.objectContaining<Partial<AuthenticationError>>({
        code: "INVALID_SESSION",
      }),
    );
  });

  it("requires a sign-in no more than five minutes old", () => {
    expect(() => assertRecentAuthentication(700, 1_000)).not.toThrow();
    expect(() => assertRecentAuthentication(699, 1_000)).toThrowError(
      expect.objectContaining<Partial<AuthenticationError>>({
        code: "INVALID_SESSION",
      }),
    );
    expect(() => assertRecentAuthentication(undefined, 1_000)).toThrowError(
      expect.objectContaining<Partial<AuthenticationError>>({
        code: "INVALID_SESSION",
      }),
    );
  });
});
