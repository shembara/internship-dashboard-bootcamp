import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import { skillRatingsMutationSchema, getSkillRatings, saveSkillRatings } from "@/server/skills/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    const url = new URL(request.url);
    const weekKey = url.searchParams.get("weekKey") ?? undefined;
    const data = await getSkillRatings(internshipId, context.userId, { weekKey: weekKey ?? undefined });
    return NextResponse.json(data ?? { error: "Not found" }, data ? { status: 200 } : { status: 404 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    const payload = skillRatingsMutationSchema.parse(await request.json());
    await saveSkillRatings(internshipId, context.userId, payload);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
