import { redirect } from "next/navigation";

import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ProgressHub } from "@/features/progress-hub/ProgressHub";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { listAchievements } from "@/server/achievements/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { getTeammateInternshipDetail } from "@/server/assignments/service";
import { AuthorizationError } from "@/server/authorization/errors";

export default async function TeammateInternshipPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireTeammatePage();
  let internship: Awaited<ReturnType<typeof getTeammateInternshipDetail>>;
  try {
    internship = await getTeammateInternshipDetail(internshipId, context.userId);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }
  const achievements = await listAchievements(internshipId, context.userId);
  const timeline = await getInternshipTimeline(internshipId, achievements);
  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <div className="space-y-2">
        <a
          href="/teammate"
          className="inline-flex text-sm font-medium text-[#00e5a3] hover:text-[#65f0c2]"
        >
          ← Internships
        </a>
        <p className="text-sm font-medium text-[#9ca3af]">Teammate workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {internship.internName}
        </h1>
      </div>
      <InternshipLifecycle {...internship} internshipId={internshipId} />
      {internship.progressHub ? (
        <ProgressHub internshipId={internshipId} hub={internship.progressHub} />
      ) : null}
      <Achievements internshipId={internshipId} data={achievements} />
      <InternshipTimeline timeline={timeline} />
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Feedback</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Give feedback for this intern&apos;s active feedback cycles.
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-white/[0.16] bg-[#121a20] p-6 text-sm text-[#9ca3af]">
            Feedback tasks will appear here.
          </div>
        </section>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">1:1 Preparation</h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Prepare talking points for upcoming one-to-one meetings.
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-white/[0.16] bg-[#121a20] p-6 text-sm text-[#9ca3af]">
            One-to-one preparation will be added here.
          </div>
        </section>
      </div>
    </section>
  );
}
