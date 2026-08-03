import type { ApplicationRole } from "@/server/users/app-user";

export class AuthorizationError extends Error {
  constructor(
    public readonly code:
      "APP_USER_REQUIRED" | "ROLE_REQUIRED" | "DISABLED" | "INVALID_REQUEST_ORIGIN",
    message: string,
    public readonly requiredRole?: ApplicationRole,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}
