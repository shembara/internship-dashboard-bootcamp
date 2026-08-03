import { NextResponse } from "next/server";

import { clearFirebaseSessionCookie } from "@/server/auth/firebase-session-provider";
import { hasValidRequestOrigin } from "@/server/auth/origin";

export async function POST(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  await clearFirebaseSessionCookie();
  return NextResponse.json({ ok: true });
}
