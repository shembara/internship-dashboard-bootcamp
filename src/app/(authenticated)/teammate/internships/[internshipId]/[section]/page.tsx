import { notFound, redirect } from "next/navigation";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import {
  ProgressHub,
  type ProgressHubSection,
} from "@/features/progress-hub/ProgressHub";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { SkillMatrix } from "@/features/skills/SkillMatrix";
import { workspaceStyles } from "@/lib/manager-workspace/theme";

import { listAchievements } from "@/server/achievements/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { getTeammateInternshipDetail } from "@/server/assignments/service";
import { AuthorizationError } from "@/server/authorization/errors";

const progressHubSections: ProgressHubSection[] = [
  "weekly-overview",
  "mentor-weekly-check-in",
  "intern-reflections",
  "shared-one-on-one-agenda",
  "shared-notes",
  "mentor-private-notes",
  "action-items",
  "history",
  "feedback-cycles",
];

export default async function TeammateInternshipSectionPage({
  params,
}: {
  params: Promise<{ internshipId: string; section: string }>;
}) {
  const { internshipId, section } = await params;
  const context = await requireTeammatePage();

  let internship: Awaited<ReturnType<typeof getTeammateInternshipDetail>>;
  try {
    internship = await getTeammateInternshipDetail(internshipId, context.userId);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }

  const isProgressHub = progressHubSections.includes(section as ProgressHubSection);

  let achievementsData: Awaited<ReturnType<typeof listAchievements>> | undefined;
  let timelineData: Awaited<ReturnType<typeof getInternshipTimeline>> | undefined;

  if (section === "achievements" || section === "internship-timeline") {
    achievementsData = await listAchievements(internshipId, context.userId);
    if (section === "internship-timeline") {
      timelineData = await getInternshipTimeline(internshipId, achievementsData);
    }
  }

  const validSections = [
    ...progressHubSections,
    "internship-lifecycle",
    "one-on-one-preparation",
    "achievements",
    "internship-timeline",
    "skill-metrics",
    "status-history",
  ];

  if (!isProgressHub && !validSections.includes(section)) {
    notFound();
  }

  const sectionLabel = section
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const styles = workspaceStyles("dark");

  return (
    <section className="workspace-page space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs
            variant="dark"
            items={[
              { label: "Internships", href: "/teammate" },
              {
                label: internship.internName,
                href: `/teammate/internships/${internshipId}`,
              },
              { label: sectionLabel },
            ]}
          />
          <p className={styles.eyebrow}>Teammate workspace</p>
          <h1 className={styles.pageHeading}>{internship.internName}</h1>
        </div>

        <Button
          nativeButton={false}
          render={
            <a
              href={`/api/internships/${internshipId}/report`}
              download
            />
          }
          variant="outline"
        >
          <FileText className="size-4" /> Export PDF Report
        </Button>
      </div>

      {section === "internship-lifecycle" ? (
        <InternshipLifecycle
          status={internship.status}
          currentStage={internship.currentStage}
          checklist={internship.checklist}
          internshipId={internshipId}
          variant="dark"
        />
      ) : null}

      {isProgressHub && internship.progressHub ? (
        <ProgressHub
          internshipId={internshipId}
          hub={internship.progressHub}
          visibleSection={section as ProgressHubSection}
          variant="dark"
        />
      ) : null}

      {section === "one-on-one-preparation" ? (
        <section className={styles.section}>
          <div>
            <h2 className={styles.heading}>1:1 Preparation</h2>
            <p className={styles.description}>
              Prepare talking points for upcoming one-to-one meetings.
            </p>
          </div>
          <div className={styles.dashedPlaceholder}>
            One-to-one preparation will be added here.
          </div>
        </section>
      ) : null}

      {section === "achievements" && achievementsData ? (
        <Achievements
          internshipId={internshipId}
          data={achievementsData}
          variant="dark"
        />
      ) : null}

      {section === "internship-timeline" && timelineData ? (
        <InternshipTimeline timeline={timelineData} variant="dark" />
      ) : null}

      {section === "skill-metrics" ? (
        <SkillMatrix internshipId={internshipId} isMentor={true} />
      ) : null}

      {section === "status-history" ? (
        <section className={styles.section}>
          <div>
            <h2 className={styles.heading}>Status history</h2>
            <p className={styles.description}>
              Status changes recorded for this internship.
            </p>
          </div>
          <div className={styles.dashedPlaceholder}>
            Status history details will appear here.
          </div>
        </section>
      ) : null}
    </section>
  );
}