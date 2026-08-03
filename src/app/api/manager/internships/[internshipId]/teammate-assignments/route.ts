import { NextResponse } from "next/server";

import {
  addTeammateAssignment,
  createTeammateAssignmentInputSchema,
} from "@/server/assignments/service";
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
    const assignment = await addTeammateAssignment(
      internshipId,
      context.userId,
      createTeammateAssignmentInputSchema.parse(await request.json()),
    );
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
