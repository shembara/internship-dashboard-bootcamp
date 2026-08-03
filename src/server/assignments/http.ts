import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthorizationError } from "@/server/authorization/errors";
import { AuthenticationError } from "@/server/auth/errors";
import { hasValidRequestOrigin } from "@/server/auth/origin";
import { requireRole } from "@/server/authorization/require-role";
import { requireAuthenticatedUser } from "@/server/auth/require-user";

export async function requireManagerContext() {
  return requireRole(await requireAuthenticatedUser(), "manager");
}

export async function requireManagerMutationContext(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    throw new AuthorizationError("INVALID_REQUEST_ORIGIN", "Invalid request origin.");
  }

  return requireManagerContext();
}

export function assignmentErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  const message =
    error instanceof Error ? error.message : "Unable to complete this request.";
  return NextResponse.json({ error: message }, { status: 400 });
}
