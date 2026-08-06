import { redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Menu } from "@/components/ui/Menu";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ProgressHub } from "@/features/progress-hub/ProgressHub";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { listAchievements } from "@/server/achievements/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { getTeammateInternshipDetail } from "@/server/assignments/service";
import { AuthorizationError } from "@/server/authorization/errors";
import { SkillMatrix } from "@/features/skills/SkillMatrix";

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
  const workspaceMenu = [
    { href: "#feedback", label: "Feedback" },
    { href: "#one-on-one-preparation", label: "1:1 Preparation" },
  ];

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/teammate" },
            { label: internship.internName },
          ]}
        />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Teammate workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {internship.internName}
        </h1>
      </div>
      <InternshipLifecycle {...internship} internshipId={internshipId} />

      <SkillMatrix internshipId={internshipId} isMentor={true} />

      {internship.progressHub ? (
        <ProgressHub internshipId={internshipId} hub={internship.progressHub} />
      ) : null}
      <Achievements internshipId={internshipId} data={achievements} />
      <InternshipTimeline timeline={timeline} />
      <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
        <Menu
          items={workspaceMenu}
          label="Internship navigation"
          className="md:flex-col md:overflow-visible"
        />
        <div className="space-y-10">
          <section id="feedback" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Feedback</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give feedback for this intern&apos;s active feedback cycles.
              </p>
            </div>
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Feedback tasks will appear here.
            </div>
          </section>
          <section id="one-on-one-preparation" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">1:1 Preparation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Prepare talking points for upcoming one-to-one meetings.
              </p>
            </div>
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              One-to-one preparation will be added here.
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
