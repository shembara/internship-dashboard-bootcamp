import "server-only";

import { z } from "zod";

const authenticationModeSchema = z.enum(["email-password-development", "google"]);

const serverEnvironmentSchema = z.object({
  appOrigin: z.string().url().optional(),
  authenticationMode: authenticationModeSchema,
  firestoreDatabaseId: z.string().min(1),
  projectId: z.string().min(1),
  sessionCookieName: z.string().min(1),
  sessionMaxAgeSeconds: z.coerce.number().int().min(300).max(1_209_600),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getServerEnvironment(): ServerEnvironment {
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const configuredServerProjectId =
    process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (process.env.NODE_ENV === "production" && !configuredServerProjectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required in production.",
    );
  }

  const projectId =
    configuredServerProjectId ??
    publicProjectId ??
    "fluxon-internships-development";
  const authenticationMode =
    process.env.FIREBASE_AUTHENTICATION_MODE ??
    process.env.NEXT_PUBLIC_AUTHENTICATION_MODE ??
    "google";

  if (
    process.env.FIREBASE_AUTHENTICATION_MODE &&
    process.env.NEXT_PUBLIC_AUTHENTICATION_MODE &&
    process.env.FIREBASE_AUTHENTICATION_MODE !==
    process.env.NEXT_PUBLIC_AUTHENTICATION_MODE
  ) {
    throw new Error("Client and server authentication modes must match.");
  }

  if (
    authenticationMode === "email-password-development" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "Email/password development authentication is unavailable in production.",
    );
  }

  if (publicProjectId && publicProjectId !== projectId) {
    throw new Error("Client and server Firebase project IDs must match.");
  }

  return serverEnvironmentSchema.parse({
    appOrigin:
      process.env.APP_ORIGIN ??
      (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"),
    authenticationMode,
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID ?? "(default)",
    projectId,
    sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "__session",
    sessionMaxAgeSeconds: process.env.SESSION_MAX_AGE_SECONDS ?? "432000",
  });
}
