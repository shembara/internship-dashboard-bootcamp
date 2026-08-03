import { z } from "zod";

const authenticationModeSchema = z.enum(["email-password-development", "google"]);

const clientEnvironmentSchema = z.object({
  authenticationMode: authenticationModeSchema,
  authEmulatorHost: z.string().min(1).optional(),
  firebase: z
    .object({
      apiKey: z.string().min(1),
      authDomain: z.string().min(1),
      projectId: z.string().min(1),
    })
    .optional(),
});

export type ClientEnvironment = z.infer<typeof clientEnvironmentSchema>;

export function getClientEnvironment(): ClientEnvironment {
  const authenticationMode = process.env.NEXT_PUBLIC_AUTHENTICATION_MODE ?? "google";
  const explicitFirebaseValues = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ];
  const hasAnyExplicitValue = explicitFirebaseValues.some(Boolean);
  const hasEveryExplicitValue = explicitFirebaseValues.every(Boolean);

  if (hasAnyExplicitValue && !hasEveryExplicitValue) {
    throw new Error(
      "Firebase web configuration is incomplete. Provide every NEXT_PUBLIC_FIREBASE_* value or rely on Firebase App Hosting automatic configuration.",
    );
  }

  if (
    authenticationMode === "email-password-development" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "Email/password development authentication is unavailable in production.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST
  ) {
    throw new Error("Firebase Auth Emulator is unavailable in production.");
  }

  return clientEnvironmentSchema.parse({
    authenticationMode,
    authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    firebase: hasEveryExplicitValue
      ? {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
      : undefined,
  });
}
