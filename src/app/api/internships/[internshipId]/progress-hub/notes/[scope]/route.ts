import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireProgressHubMutationContext } from "@/server/progress-hub/http";
import {
  noteMutationSchema,
  savePrivateInternNote,
  savePrivateMentorNote,
  saveSharedNote,
} from "@/server/progress-hub/service";

const handlers = {
  shared: saveSharedNote,
  "private-intern": savePrivateInternNote,
  "private-mentor": savePrivateMentorNote,
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ internshipId: string; scope: string }> },
) {
  try {
    const context = await requireProgressHubMutationContext(request);
    const { internshipId, scope } = await params;
    const handler = handlers[scope as keyof typeof handlers];
    if (!handler) throw new Error("Unknown note scope.");
    await handler(
      internshipId,
      context.userId,
      noteMutationSchema.parse(await request.json()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
