import { notFound, redirect } from "next/navigation";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ProgressHub, type ProgressHubSection } from "@/features/progress-hub/ProgressHub";
import { StageChecklist } from "@/features/stage-checklists/StageChecklist";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";

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
    "stage-checklist",
    "one-on-one-preparation",
    "achievements",
    "internship-timeline",
    "status-history",
  ];

  if (!isProgressHub && !validSections.includes(section)) {
    notFound();
  }

  const sectionLabel = section.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: "Internships", href: "/teammate" },
              {
                label: internship.internName,
                href: `/teammate/internships/${internshipId}`,
              },
              { label: sectionLabel },
            ]}
          />
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            Teammate workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {internship.internName}
          </h1>
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
        <InternshipLifecycle status={internship.status} currentStage={internship.currentStage} />
      ) : null}

      {section === "stage-checklist" && internship.checklist ? (
        <StageChecklist internshipId={internshipId} checklist={internship.checklist} />
      ) : null}

      {isProgressHub && internship.progressHub ? (
        <ProgressHub
          internshipId={internshipId}
          hub={internship.progressHub}
          visibleSection={section as ProgressHubSection}
        />
      ) : null}

      {section === "one-on-one-preparation" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
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
      ) : null}

      {section === "achievements" && achievementsData ? (
        <Achievements internshipId={internshipId} data={achievementsData} />
      ) : null}

      {section === "internship-timeline" && timelineData ? (
        <InternshipTimeline timeline={timelineData} />
      ) : null}

      {section === "status-history" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Status history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status changes recorded for this internship.
            </p>
          </div>
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Status history details will appear here.
          </div>
        </section>
      ) : null}
    </section>
  );
}
