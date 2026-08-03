import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireChecklistMutationContext } from "@/server/stage-checklists/http";
import {
  completeStage,
  stageAdvancementSchema,
} from "@/server/stage-checklists/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireChecklistMutationContext(request);
    const { internshipId } = await params;
    return NextResponse.json(
      await completeStage(
        internshipId,
        context.userId,
        stageAdvancementSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
