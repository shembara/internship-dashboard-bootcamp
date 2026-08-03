import { NextResponse } from "next/server";

import {
  expectedEndDateInputSchema,
  updateExpectedEndDate,
} from "@/server/manager-portfolio/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireManagerMutationContext(request);
    const { internshipId } = await params;
    await updateExpectedEndDate(
      internshipId,
      context.userId,
      expectedEndDateInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
