import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerEnvironment } from "./server";

const originalEnvironment = {
  FIREBASE_AUTHENTICATION_MODE: process.env.FIREBASE_AUTHENTICATION_MODE,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_AUTHENTICATION_MODE: process.env.NEXT_PUBLIC_AUTHENTICATION_MODE,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

afterEach(() => {
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("getServerEnvironment", () => {
  it("accepts development email/password mode outside production", () => {
    process.env.FIREBASE_PROJECT_ID = "fluxon-internships-development";
    process.env.FIREBASE_AUTHENTICATION_MODE = "email-password-development";
    process.env.NEXT_PUBLIC_AUTHENTICATION_MODE = "email-password-development";

    expect(getServerEnvironment().authenticationMode).toBe(
      "email-password-development",
    );
  });

  it("rejects development email/password mode in production", () => {
    process.env.FIREBASE_AUTHENTICATION_MODE = "email-password-development";
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getServerEnvironment()).toThrow(
      "Email/password development authentication is unavailable in production.",
    );
  });

  it("requires matching client and server Firebase configuration", () => {
    process.env.FIREBASE_PROJECT_ID = "server-project";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "client-project";

    expect(() => getServerEnvironment()).toThrow(
      "Client and server Firebase project IDs must match.",
    );
  });

  it("requires matching client and server authentication modes", () => {
    process.env.FIREBASE_AUTHENTICATION_MODE = "google";
    process.env.NEXT_PUBLIC_AUTHENTICATION_MODE = "email-password-development";

    expect(() => getServerEnvironment()).toThrow(
      "Client and server authentication modes must match.",
    );
  });
});
