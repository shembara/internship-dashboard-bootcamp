import { NextResponse } from "next/server";

import {
  removeManagerAssignment,
  removeManagerAssignmentInputSchema,
} from "@/server/manager-portfolio/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; managerUserId: string }> },
) {
  try {
    const context = await requireManagerMutationContext(request);
    const { internshipId, managerUserId } = await params;
    await removeManagerAssignment(
      internshipId,
      context.userId,
      removeManagerAssignmentInputSchema.parse({
        ...(await request.json().catch(() => ({}))),
        managerUserId,
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
