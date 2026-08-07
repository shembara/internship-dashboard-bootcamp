import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import { skillRatingsMutationSchema, getSkillRatings, saveSkillRatings } from "@/server/skills/service";
import { SKILLS, SkillRatings } from "@/lib/skills/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId } = await params;
    const url = new URL(request.url);
    const weekKey = url.searchParams.get("weekKey") ?? undefined;
    const data = await getSkillRatings(internshipId, context.userId, { weekKey });
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
    const body = await request.json();

    const rawRatings = body.ratings || {};
    const sanitizedRatings: Record<string, number> = {};

    SKILLS.forEach((skill) => {
      const val = Number(rawRatings[skill]);
      sanitizedRatings[skill] = !isNaN(val) ? val : 50;
    });

    const payload = skillRatingsMutationSchema.parse({
      weekKey: body.weekKey,
      ratings: sanitizedRatings,
    });

    const result = await saveSkillRatings(
      internshipId,
      payload.weekKey,
      payload.ratings as SkillRatings,
      context.userId,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
