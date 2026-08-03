import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import {
  checkInMutationSchema,
  saveMentorCheckIn,
} from "@/server/progress-hub/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    await saveMentorCheckIn(
      internshipId,
      context.userId,
      checkInMutationSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
