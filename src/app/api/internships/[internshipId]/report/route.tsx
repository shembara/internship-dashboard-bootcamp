import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { assignmentErrorResponse } from "@/server/assignments/http";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { requireAppUser } from "@/server/authorization/require-role";
import { InternReportDocument } from "@/server/reports/components/InternReportDocument";
import { getInternReportData } from "@/server/reports/intern-report";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser();
    const appUserContext = await requireAppUser(user);
    const { internshipId } = await params;

    const reportData = await getInternReportData(internshipId, appUserContext.userId);
    const pdfStream = await renderToStream(<InternReportDocument data={reportData} />);

    const sanitizedName = reportData.internship.intern.displayName.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );

    return new NextResponse(pdfStream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedName}_Internship_Report.pdf"`,
      },
    });
  } catch (error) {
    return assignmentErrorResponse(error);
  }
}
