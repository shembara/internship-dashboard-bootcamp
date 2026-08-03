import "server-only";

import type { AuthenticatedUser } from "@/server/auth/types";
import type { ApplicationRole } from "@/server/users/app-user";

import { assertAppUser, assertRole } from "./assertions";
import { getAuthorizationContext, type AuthorizationContext } from "./context";

export async function requireAppUser(
  user: AuthenticatedUser,
): Promise<Extract<AuthorizationContext, { access: "appUser" }>> {
  const context = await getAuthorizationContext(user);
  return assertAppUser(context);
}

export async function requireRole(
  user: AuthenticatedUser,
  role: ApplicationRole,
): Promise<Extract<AuthorizationContext, { access: "appUser" }>> {
  return assertRole(await getAuthorizationContext(user), role);
}

export { assertAppUser, assertRole };
