import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireChecklistMutationContext } from "@/server/stage-checklists/http";
import {
  createChecklistItem,
  createChecklistItemSchema,
  deleteChecklistItem,
  deleteChecklistItemSchema,
} from "@/server/stage-checklists/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireChecklistMutationContext(request);
    const { internshipId } = await params;
    return NextResponse.json(
      await createChecklistItem(
        internshipId,
        context.userId,
        createChecklistItemSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireChecklistMutationContext(request);
    const { internshipId } = await params;
    return NextResponse.json(
      await deleteChecklistItem(
        internshipId,
        context.userId,
        deleteChecklistItemSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
