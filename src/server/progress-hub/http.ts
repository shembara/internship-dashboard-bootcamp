import "server-only";

import { hasValidRequestOrigin } from "@/server/auth/origin";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { getAuthorizationContext } from "@/server/authorization/context";
import { AuthorizationError } from "@/server/authorization/errors";
import { assertAppUser } from "@/server/authorization/require-role";

export async function requireProgressHubMutationContext(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    throw new AuthorizationError("INVALID_REQUEST_ORIGIN", "Invalid request origin.");
  }
  return assertAppUser(await getAuthorizationContext(await requireAuthenticatedUser()));
}
