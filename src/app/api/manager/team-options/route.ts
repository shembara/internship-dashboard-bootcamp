import { NextResponse } from "next/server";

import {
  assignmentErrorResponse,
  requireManagerContext,
} from "@/server/assignments/http";
import { searchTeams } from "@/server/assignments/service";

export async function GET(request: Request) {
  try {
    await requireManagerContext();
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json({ teams: await searchTeams(query) });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
