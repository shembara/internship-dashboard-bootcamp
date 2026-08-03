import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import {
  actionItemMutationSchema,
  actionItemStatusSchema,
  saveActionItem,
  setActionItemStatus,
} from "@/server/progress-hub/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    await saveActionItem(
      internshipId,
      context.userId,
      actionItemMutationSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    await setActionItemStatus(
      internshipId,
      context.userId,
      actionItemStatusSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
