import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireChecklistMutationContext } from "@/server/stage-checklists/http";
import {
  checklistItemMutationSchema,
  updateChecklistItem,
} from "@/server/stage-checklists/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireChecklistMutationContext(request);
    const { internshipId } = await params;
    return NextResponse.json(
      await updateChecklistItem(
        internshipId,
        context.userId,
        checklistItemMutationSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
