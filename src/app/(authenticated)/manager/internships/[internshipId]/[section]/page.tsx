import { notFound, redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ManagerStatusActions } from "@/features/manager-portfolio/ManagerStatusActions";
import { ExpectedEndDateAction } from "@/features/manager-portfolio/ExpectedEndDateAction";
import { ProgressHub, type ProgressHubSection } from "@/features/progress-hub/ProgressHub";
import { Achievements } from "@/features/achievements/Achievements";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { AssignmentActions, TeammateAssignmentActions } from "@/features/assignments/AssignmentActions";
import { ManagerAssignmentActions } from "@/features/manager-portfolio/ManagerAssignmentActions";

import { listAchievements } from "@/server/achievements/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagerPortfolioDetail } from "@/server/manager-portfolio/service";
import { AuthorizationError } from "@/server/authorization/errors";

const progressHubSections: ProgressHubSection[] = [
  "weekly-overview",
  "intern-reflections",
  "shared-one-on-one-agenda",
  "shared-notes",
  "mentor-private-notes",
  "action-items",
  "history",
  "feedback-cycles",
];

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Ongoing";
}

export default async function ManagerInternshipSectionPage({
  params,
}: {
  params: Promise<{ internshipId: string; section: string }>;
}) {
  const { internshipId, section } = await params;
  const context = await requireManagerPage();

  let detail: Awaited<ReturnType<typeof getManagerPortfolioDetail>>;
  try {
    detail = await getManagerPortfolioDetail(internshipId, context.userId);
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/forbidden");
    throw error;
  }

  const isProgressHub = progressHubSections.includes(section as ProgressHubSection);

  let achievementsData: Awaited<ReturnType<typeof listAchievements>> | undefined;
  let timelineData: Awaited<ReturnType<typeof getInternshipTimeline>> | undefined;

  if (section === "achievements" || section === "internship-timeline") {
    achievementsData = await listAchievements(internshipId, context.userId, true);
    if (section === "internship-timeline") {
      timelineData = await getInternshipTimeline(internshipId, achievementsData);
    }
  }

  const validSections = [
    ...progressHubSections,
    "internship-lifecycle",
    "internship-status",
    "achievements",
    "internship-timeline",
    "assignments",
    "managers",
    "status-history",
  ];

  if (!isProgressHub && !validSections.includes(section)) {
    notFound();
  }

  const sectionLabel = section.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const currentPlacement =
    detail.placements.find((placement) => placement.current) ?? detail.placements[0];
  const assignments = currentPlacement
    ? detail.teammateAssignments.filter(
        (assignment) => assignment.teamId === currentPlacement.teamId,
      )
    : [];

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/manager/internships" },
            {
              label: detail.internship.intern.displayName,
              href: `/manager/internships/${internshipId}`,
            },
            { label: sectionLabel },
          ]}
        />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Manager workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {detail.internship.intern.displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateLabel(detail.internship.startsAt)} to{" "}
          {dateLabel(detail.internship.endsAt)}
        </p>
      </div>

      {section === "internship-lifecycle" ? (
        <InternshipLifecycle
          status={detail.internship.status}
          currentStage={detail.internship.currentStage}
          checklist={detail.internship.checklist}
          internshipId={internshipId}
        />
      ) : null}

      {section === "internship-status" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Internship status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status commands are recorded in the immutable status history below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.capabilities.canChangeStatus ? (
              <ManagerStatusActions
                internshipId={internshipId}
                status={detail.internship.status}
              />
            ) : null}
            {detail.capabilities.canEditExpectedEnd ? (
              <ExpectedEndDateAction
                internshipId={internshipId}
                startsAt={detail.internship.startsAt}
                endsAt={detail.internship.endsAt}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {isProgressHub && detail.internship.progressHub ? (
        <ProgressHub
          internshipId={internshipId}
          hub={detail.internship.progressHub}
          visibleSection={section as ProgressHubSection}
        />
      ) : null}

      {section === "achievements" && achievementsData ? (
        <Achievements internshipId={internshipId} data={achievementsData} />
      ) : null}

      {section === "internship-timeline" && timelineData ? (
        <InternshipTimeline timeline={timelineData} />
      ) : null}

      {section === "assignments" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Assignments</h2>
              {currentPlacement ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentPlacement.teamTitle} · started{" "}
                  {dateLabel(currentPlacement.startsAt)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  No current Team Placement.
                </p>
              )}
            </div>
            {currentPlacement && detail.capabilities.canManagePlacements ? (
              <AssignmentActions
                internshipId={internshipId}
                teamId={currentPlacement.teamId}
                teamTitle={currentPlacement.teamTitle}
                teammates={detail.eligibleTeammates}
              />
            ) : null}
          </div>
          {assignments.length ? (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
                >
                  <div className="grow">
                    <p className="font-medium">{assignment.teammateName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {assignment.responsibilities.join(", ") || "General teammate"} ·{" "}
                      {dateLabel(assignment.startsAt)} – {dateLabel(assignment.endsAt)}
                    </p>
                  </div>
                  {assignment.status !== "ended" &&
                  detail.capabilities.canManageTeammates ? (
                    <TeammateAssignmentActions
                      internshipId={internshipId}
                      assignmentId={assignment.id}
                      responsibilities={assignment.responsibilities}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Ended</span>
                  )}
                  {assignment.status === "scheduled" ? (
                    <span className="text-sm text-muted-foreground">Scheduled</span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No teammates assigned to the current Team yet.
            </div>
          )}
        </section>
      ) : null}

      {section === "managers" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Manager assignments</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current managers can manage this internship. Historical assignments remain visible.
              </p>
            </div>
            {detail.capabilities.canManageManagers ? (
              <ManagerAssignmentActions
                internshipId={internshipId}
                managers={detail.eligibleManagers}
              />
            ) : null}
          </div>
          <div className="space-y-3">
            {detail.managerAssignments.map((assignment) => (
              <article
                key={assignment.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{assignment.displayName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignment.current ? "Current" : "Historical"} ·{" "}
                    {dateLabel(assignment.startsAt)} – {dateLabel(assignment.endsAt)}
                  </p>
                </div>
                {assignment.current && detail.capabilities.canManageManagers ? (
                  <ManagerAssignmentActions
                    internshipId={internshipId}
                    managerUserId={assignment.userId}
                    managers={detail.eligibleManagers}
                  />
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {section === "status-history" ? (
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Status history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Server-recorded lifecycle status changes.
            </p>
          </div>
          {detail.statusHistory.length ? (
            <ul className="space-y-3">
              {detail.statusHistory.map((entry) => (
                <li key={entry.id} className="rounded-xl border bg-card p-4 text-sm">
                  <p className="font-medium">
                    {entry.previousStatus} to {entry.newStatus}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {dateLabel(entry.changedAt)} · changed by {entry.changedBy}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No status changes have been recorded.
            </p>
          )}
        </section>
      ) : null}
    </section>
  );
}
