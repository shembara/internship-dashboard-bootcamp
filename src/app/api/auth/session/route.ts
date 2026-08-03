import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthenticationError } from "@/server/auth/errors";
import {
  createFirebaseSessionCookie,
  setFirebaseSessionCookie,
} from "@/server/auth/firebase-session-provider";
import { hasValidRequestOrigin } from "@/server/auth/origin";

const requestSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body = requestSchema.parse(await request.json());
    const sessionCookie = await createFirebaseSessionCookie(body.idToken);
    await setFirebaseSessionCookie(sessionCookie);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid authentication request." },
        { status: 400 },
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "Unable to create a session." }, { status: 401 });
  }
}
