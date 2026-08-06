import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function TeammateInternshipPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  redirect(`/teammate/internships/${internshipId}/internship-lifecycle`);
}
