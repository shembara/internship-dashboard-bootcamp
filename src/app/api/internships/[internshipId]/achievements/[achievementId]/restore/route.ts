import { NextResponse } from "next/server";
import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import { archiveAchievement } from "@/server/achievements/service";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; achievementId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId, achievementId } = await params;
    await archiveAchievement(internshipId, achievementId, context.userId, true);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
