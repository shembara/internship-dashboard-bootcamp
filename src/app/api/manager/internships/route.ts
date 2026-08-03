import { NextResponse } from "next/server";

import {
  createInternship,
  createInternshipInputSchema,
} from "@/server/assignments/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function POST(request: Request) {
  try {
    const context = await requireManagerMutationContext(request);
    const input = createInternshipInputSchema.parse(await request.json());
    const internship = await createInternship(context.userId, input);
    return NextResponse.json(internship, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
