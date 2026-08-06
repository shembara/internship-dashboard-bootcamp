import { redirect } from "next/navigation";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  redirect(`/manager/internships/${internshipId}/internship-lifecycle`);
}
