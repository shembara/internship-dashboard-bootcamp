import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireChecklistReadContext } from "@/server/stage-checklists/http";
import {
  getStageChecklist,
  stageSelectionSchema,
} from "@/server/stage-checklists/service";
import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const context = await requireChecklistReadContext();
    const { internshipId } = await params;
    const internshipRef = adminFirestore.collection("internships").doc(internshipId);
    const internship = await internshipRef.get();
    if (!internship.exists)
      return NextResponse.json({ error: "Internship not found." }, { status: 404 });
    const { stage } = stageSelectionSchema.parse({
      stage: new URL(request.url).searchParams.get("stage") ?? undefined,
    });
    return NextResponse.json(
      await getStageChecklist(
        internshipRef,
        parseInternshipDocument(internship.data()),
        context.userId,
        stage,
      ),
    );
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
