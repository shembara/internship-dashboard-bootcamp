import "server-only";

import { getServerEnvironment } from "@/lib/env/server";

export function isAllowedRequestOrigin(
  origin: string | null,
  allowedOrigin: string,
): boolean {
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(allowedOrigin).origin;
  } catch {
    return false;
  }
}

export function hasValidRequestOrigin(request: Request): boolean {
  const allowedOrigin = getServerEnvironment().appOrigin;
  if (!allowedOrigin) {
    return false;
  }

  return isAllowedRequestOrigin(request.headers.get("origin"), allowedOrigin);
}
