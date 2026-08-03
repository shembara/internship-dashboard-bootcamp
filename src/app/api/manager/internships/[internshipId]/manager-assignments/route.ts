import { NextResponse } from "next/server";

import {
  addManagerAssignment,
  managerAssignmentInputSchema,
} from "@/server/manager-portfolio/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireManagerMutationContext(request);
    const { internshipId } = await params;
    await addManagerAssignment(
      internshipId,
      context.userId,
      managerAssignmentInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
