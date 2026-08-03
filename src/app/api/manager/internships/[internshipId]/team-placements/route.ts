import { NextResponse } from "next/server";

import {
  addTeamPlacement,
  createPlacementInputSchema,
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
    await addTeamPlacement(
      internshipId,
      context.userId,
      createPlacementInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
