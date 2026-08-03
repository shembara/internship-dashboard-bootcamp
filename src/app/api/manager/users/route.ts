import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";
import { adminFirestore } from "@/server/firebase/admin";
import { findAppUserByEmail, normalizeEmail } from "@/server/repositories/app-users";

const requestSchema = z.object({
  email: z.string().email(),
  roles: z
    .array(z.enum(["intern", "teammate"]))
    .min(1)
    .max(2)
    .refine((roles) => new Set(roles).size === roles.length, "Roles must be unique."),
});

export async function POST(request: Request) {
  try {
    await requireManagerMutationContext(request);
    const { email, roles } = requestSchema.parse(await request.json());
    const normalizedEmail = normalizeEmail(email);
    if (await findAppUserByEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "An application user already exists for this email." },
        { status: 409 },
      );
    }
    const userRef = adminFirestore.collection("users").doc();
    await userRef.create({
      email: normalizedEmail,
      displayName: normalizedEmail,
      active: true,
      roles,
      identityState: "pending",
      identities: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: userRef.id }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
