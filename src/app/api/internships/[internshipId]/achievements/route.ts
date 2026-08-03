import { NextResponse } from "next/server";
import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import {
  achievementInputSchema,
  createAchievement,
} from "@/server/achievements/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    await createAchievement(
      internshipId,
      context.userId,
      achievementInputSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
