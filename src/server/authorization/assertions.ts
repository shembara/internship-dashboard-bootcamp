import type { ApplicationRole } from "@/server/users/app-user";

import type { AuthorizationContext } from "./context";
import { AuthorizationError } from "./errors";

export function assertAppUser(
  context: AuthorizationContext,
): Extract<AuthorizationContext, { access: "appUser" }> {
  if (context.access === "disabled") {
    throw new AuthorizationError("DISABLED", "This application account is disabled.");
  }

  if (context.access !== "appUser") {
    throw new AuthorizationError(
      "APP_USER_REQUIRED",
      "An active application-user record is required.",
    );
  }

  return context;
}

export function assertRole(
  context: AuthorizationContext,
  role: ApplicationRole,
): Extract<AuthorizationContext, { access: "appUser" }> {
  const appUserContext = assertAppUser(context);

  if (!appUserContext.appUser.roles.includes(role)) {
    throw new AuthorizationError(
      "ROLE_REQUIRED",
      `The ${role} role is required.`,
      role,
    );
  }

  return appUserContext;
}
