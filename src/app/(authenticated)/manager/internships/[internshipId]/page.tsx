import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Achievements } from "@/features/achievements/Achievements";
import { AssignmentActions, TeammateAssignmentActions } from "@/features/assignments/AssignmentActions";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { ExpectedEndDateAction } from "@/features/manager-portfolio/ExpectedEndDateAction";
import { ManagerAssignmentActions } from "@/features/manager-portfolio/ManagerAssignmentActions";
import { ManagerStatusActions } from "@/features/manager-portfolio/ManagerStatusActions";
import { ProgressHub } from "@/features/progress-hub/ProgressHub";
import { InternshipTimeline } from "@/features/timeline/InternshipTimeline";
import { listAchievements } from "@/server/achievements/service";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagerPortfolioDetail } from "@/server/manager-portfolio/service";
import { getInternshipTimeline } from "@/server/timeline/service";
import { Menu } from "lucide-react";

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Ongoing";
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireManagerPage();
  const [detail, achievements] = await Promise.all([
    getManagerPortfolioDetail(internshipId, context.userId),
    listAchievements(internshipId, context.userId, true),
  ]);
  const timeline = await getInternshipTimeline(internshipId, achievements);
  const currentPlacement =
    detail.placements.find((placement) => placement.current) ?? detail.placements[0];
  const assignments = currentPlacement
    ? detail.teammateAssignments.filter(
      (assignment) => assignment.teamId === currentPlacement.teamId,
    )
    : [];
  const workspaceMenu = [
    {
      href: "#assignments",
      label: "Assignments",
    },
    {
      href: "#history",
      label: "History",
    },
    {
      href: "#feedback-cycles",
      label: "Feedback",
    },
  ];

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/manager/internships" },
            { label: detail.internship.intern.displayName },
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
      <InternshipLifecycle {...detail.internship} internshipId={internshipId} />
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Internship status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status commands are recorded in the immutable status history below.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
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
      {detail.internship.progressHub ? (
        <ProgressHub internshipId={internshipId} hub={detail.internship.progressHub} />
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
          <section id="assignments" className="scroll-mt-24 space-y-4">
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
                        {dateLabel(assignment.startsAt)} –{" "}
                        {dateLabel(assignment.endsAt)}
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
          <section id="managers" className="scroll-mt-24 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Manager assignments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current managers can manage this internship. Historical assignments
                  remain visible.
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
          <section id="history" className="scroll-mt-24 space-y-4">
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
          <section id="feedback-cycles" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Feedback cycles</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start and publish feedback cycles for this internship.
              </p>
            </div>
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Feedback cycle management will be added here.
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
