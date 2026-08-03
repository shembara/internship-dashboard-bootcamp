import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import {
  achievementInputSchema,
  updateAchievement,
} from "@/server/achievements/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; achievementId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId, achievementId } = await params;
    await updateAchievement(
      internshipId,
      achievementId,
      context.userId,
      achievementInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
