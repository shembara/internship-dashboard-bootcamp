import "server-only";

import { redirect } from "next/navigation";

import { AuthorizationError } from "@/server/authorization/errors";
import { requireRole } from "@/server/authorization/require-role";
import { requireAuthenticatedUser } from "@/server/auth/require-user";

export async function requireManagerPage() {
  try {
    return await requireRole(await requireAuthenticatedUser(), "manager");
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }
}

export async function requireTeammatePage() {
  try {
    return await requireRole(await requireAuthenticatedUser(), "teammate");
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }
}

export async function requireInternPage() {
  try {
    return await requireRole(await requireAuthenticatedUser(), "intern");
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }
}
