import { redirect } from "next/navigation";

export default async function TeammateInternshipPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  redirect(`/teammate/internships/${internshipId}/internship-lifecycle`);
}
