import { NextResponse } from "next/server";

import {
  statusCommandSchema,
  transitionInternshipStatus,
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
    await transitionInternshipStatus(
      internshipId,
      context.userId,
      statusCommandSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
