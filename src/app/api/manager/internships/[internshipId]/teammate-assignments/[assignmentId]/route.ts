import { NextResponse } from "next/server";

import {
  updateResponsibilitiesInputSchema,
  updateTeammateResponsibilities,
} from "@/server/assignments/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; assignmentId: string }> },
) {
  try {
    const context = await requireManagerMutationContext(request);
    const { internshipId, assignmentId } = await params;
    const { responsibilities } = updateResponsibilitiesInputSchema.parse(
      await request.json(),
    );
    await updateTeammateResponsibilities(
      internshipId,
      assignmentId,
      context.userId,
      responsibilities,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
