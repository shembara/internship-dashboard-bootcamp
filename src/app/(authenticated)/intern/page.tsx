import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ProgressHub } from "@/features/progress-hub/ProgressHub";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { workspaceStyles } from "@/lib/manager-workspace/theme";
import { requireInternPage } from "@/server/assignments/page-auth";
import { getCurrentInternshipForIntern } from "@/server/assignments/service";
import { listAchievements } from "@/server/achievements/service";
import { getInternshipTimeline } from "@/server/timeline/service";

export default async function InternPage() {
  const context = await requireInternPage();
  const internship = await getCurrentInternshipForIntern(context.userId);
  const achievements = internship
    ? await listAchievements(internship.id, context.userId)
    : undefined;
  const timeline =
    internship && achievements
      ? await getInternshipTimeline(internship.id, achievements)
      : undefined;
  const styles = workspaceStyles("dark");

  return (
    <section className="workspace-page space-y-7">
      <div className="space-y-2">
        <Breadcrumbs variant="dark" items={[{ label: "Intern dashboard" }]} />
        <p className={styles.eyebrow}>Intern workspace</p>
        <h1 className={styles.pageHeading}>Intern dashboard</h1>
      </div>
      {internship ? (
        <div className="space-y-6">
          <InternshipLifecycle
            {...internship}
            internshipId={internship.id}
            variant="dark"
          />
          {internship.status !== "active" ? (
            <p className={styles.readOnlyBanner}>
              This {internship.status} internship is available as historical context and
              is read-only.
            </p>
          ) : null}
          {internship.progressHub ? (
            <ProgressHub
              internshipId={internship.id}
              hub={internship.progressHub}
              variant="dark"
            />
          ) : null}
          {achievements ? (
            <Achievements
              internshipId={internship.id}
              data={achievements}
              variant="dark"
            />
          ) : null}
          {timeline ? <InternshipTimeline timeline={timeline} variant="dark" /> : null}
          <div className="space-y-10">
            <section id="feedback" className="scroll-mt-24 space-y-4">
              <div>
                <h2 className={styles.heading}>Feedback</h2>
                <p className={styles.description}>
                  Review feedback that has been published for your internship.
                </p>
              </div>
              <div className={styles.dashedPlaceholder}>
                Published feedback will appear here.
              </div>
            </section>
            <section id="one-on-one-preparation" className="scroll-mt-24 space-y-4">
              <div>
                <h2 className={styles.heading}>1:1 Preparation</h2>
                <p className={styles.description}>
                  Prepare discussion points for your upcoming one-to-one meetings.
                </p>
              </div>
              <div className={styles.dashedPlaceholder}>
                One-to-one preparation will be added here.
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className="font-semibold text-white">No internship history available</h2>
          <p className="mt-2 text-sm text-[#8b949e]">
            Your internship dashboard will be available when an internship is assigned
            to you.
          </p>
        </div>
      )}
    </section>
  );
}
