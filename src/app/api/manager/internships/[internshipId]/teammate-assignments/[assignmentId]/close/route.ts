import { NextResponse } from "next/server";

import { closeTeammateAssignment } from "@/server/assignments/service";
import {
  assignmentErrorResponse,
  requireManagerMutationContext,
} from "@/server/assignments/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; assignmentId: string }> },
) {
  try {
    const context = await requireManagerMutationContext(request);
    const { internshipId, assignmentId } = await params;
    await closeTeammateAssignment(internshipId, assignmentId, context.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
