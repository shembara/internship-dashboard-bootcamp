"use client";

import { useState, type ReactNode } from "react";
import { Award, BarChart3, Clock3, MessageSquareText, Sun } from "lucide-react";

import type { GuestDashboardDto } from "@/lib/guest-dashboard/types";
import { internshipStages, internshipStatuses } from "@/lib/internships/types";
import { SKILLS } from "@/lib/skills/types";
import { cn, formatDate } from "@/lib/utils";

function label<T extends { value: string; label: string }>(
  items: readonly T[],
  value: string,
) {
  return items.find((item) => item.value === value)?.label ?? value;
}

const statusPillStyles: Record<string, string> = {
  active: "border-emerald-500/50 text-emerald-400",
  cancelled: "border-red-500/50 text-red-400",
  completed: "border-violet-500/50 text-violet-400",
  paused: "border-amber-500/50 text-amber-400",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusPillStyles[status] ?? "border-white/20 text-[#8b949e]",
      )}
    >
      {label(internshipStatuses, status)}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof Clock3;
  children: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 font-semibold">
      <Icon aria-hidden="true" className="size-4 text-emerald-400" />
      {children}
    </h3>
  );
}

function TasksProgress({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-[#8b949e]">
        <span>Tasks progress</span>
        <span>
          {completed}/{total} tasks
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#0d1117]">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function GuestDashboard({
  dashboard,
  guestDisplayName,
}: {
  dashboard: GuestDashboardDto;
  guestDisplayName?: string;
}) {
  const [open, setOpen] = useState<string>();

  const metricCards = [
    {
      key: "total",
      label: "Assigned internships",
      value: dashboard.metrics.total,
      accent: false,
    },
    {
      key: "active",
      label: "Active",
      value: dashboard.metrics.active,
      accent: true,
    },
    {
      key: "paused",
      label: "Paused",
      value: dashboard.metrics.paused,
      accent: false,
    },
    {
      key: "completed",
      label: "Completed",
      value: dashboard.metrics.completed,
      accent: false,
    },
  ] as const;

  return (
    <section className="-mx-5 -mb-5 min-h-[calc(100vh-4rem)] space-y-6 bg-transparent px-5 pb-5 pt-1 text-white sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
            Executive workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Internship overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b949e]">
            Monitor internship lifecycle and progress across all interns.
          </p>
        </div>
        {guestDisplayName ? (
          <span className="inline-flex shrink-0 self-start rounded-full border border-white/15 bg-[#161b22] px-3 py-1.5 text-xs font-medium text-[#c9d1d9]">
            {guestDisplayName} (Guest Mode)
          </span>
        ) : null}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.key}
            className={cn(
              "rounded-2xl border bg-[#161b22] p-4",
              metric.accent
                ? "border-emerald-500/20 shadow-[0_0_32px_rgba(16,185,129,0.12)]"
                : "border-white/10",
            )}
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]">
              {metric.label}
            </dt>
            <dd className="mt-2 text-3xl font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3">
        {dashboard.items.map((item) => {
          const expanded = open === item.id;

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#161b22]"
            >
              <div className="grid gap-4 p-5 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_auto] lg:p-6">
                <div>
                  <h2 className="text-lg font-semibold">{item.internName}</h2>
                  <p className="mt-1 text-sm text-[#8b949e]">
                    Started {formatDate(item.startsAt)}
                  </p>
                  <p className="mt-1 text-sm text-[#8b949e]">
                    Project: {item.project ?? "Unassigned"}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <StatusPill status={item.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Current stage
                    </dt>
                    <dd className="mt-1">
                      {label(internshipStages, item.currentStage)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Tasks count
                    </dt>
                    <dd className="mt-1">
                      {item.requiredCompletedCount}/{item.requiredTotalCount} required
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Mentor
                    </dt>
                    <dd className="mt-1">{item.mentor ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Manager
                    </dt>
                    <dd className="mt-1">{item.manager ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.08em] text-[#6e7681]">
                      Length of internship
                    </dt>
                    <dd className="mt-1">{item.dayOfInternship} days</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="h-10 self-start rounded-lg border border-white/15 bg-[#0d1117] px-4 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/5"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? undefined : item.id)}
                >
                  {expanded ? "Hide details" : "Details"}
                </button>
              </div>

              {expanded ? (
                <div className="grid gap-5 border-t border-white/10 p-5 md:grid-cols-2 lg:p-6">
                  <section className="md:col-span-2">
                    <TasksProgress
                      completed={item.requiredCompletedCount}
                      total={item.requiredTotalCount}
                    />
                  </section>

                  <section>
                    <SectionHeading icon={Clock3}>
                      Internship lifecycle timeline
                    </SectionHeading>
                    {item.timeline.length ? (
                      <ul className="relative mt-4 space-y-4 border-l border-white/10 pl-5">
                        {item.timeline.map((event) => (
                          <li key={event.id} className="relative text-sm">
                            <span
                              aria-hidden="true"
                              className="absolute -left-[1.35rem] top-1.5 size-2 rounded-full bg-emerald-500 ring-4 ring-[#161b22]"
                            />
                            <p className="font-medium text-[#c9d1d9]">
                              {formatDate(event.occurredAt)} · {event.title}
                              {event.description ? ` · ${event.description}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#8b949e]">
                        No timeline entries yet.
                      </p>
                    )}
                  </section>

                  <section>
                    <SectionHeading icon={MessageSquareText}>
                      Mentor feedback about intern
                    </SectionHeading>
                    {item.mentorFeedback ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#0d1117] p-4 text-sm">
                        <p>{item.mentorFeedback.progressSummary}</p>
                        <p className="text-[#8b949e]">
                          {item.mentorFeedback.strengthsObserved}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#8b949e]">
                        No mentor check-ins yet.
                      </p>
                    )}
                  </section>

                  <section>
                    <SectionHeading icon={Sun}>
                      Intern feeling about internship
                    </SectionHeading>
                    <p className="mt-2 text-sm text-[#8b949e]">Not available yet.</p>
                  </section>

                  <section>
                    <SectionHeading icon={BarChart3}>Skill metrics</SectionHeading>
                    <div className="mt-3 space-y-3">
                      {SKILLS.map((skill) => {
                        const score = item.skillRatings?.[skill] ?? 0;
                        return (
                          <div key={skill} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-[#8b949e]">{skill}</span>
                              <span className="font-semibold">{score}/100</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0d1117]">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="md:col-span-2">
                    <SectionHeading icon={Award}>Achievements</SectionHeading>
                    {item.achievements.length ? (
                      <ul className="mt-3 space-y-2 text-sm">
                        {item.achievements.map((achievement) => (
                          <li
                            key={achievement.id}
                            className="rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3"
                          >
                            {achievement.title} · {achievement.category} ·{" "}
                            {formatDate(achievement.achievedOn)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-[#8b949e]">
                        No achievements yet.
                      </p>
                    )}
                  </section>
                </div>
              ) : null}
            </article>
          );
        })}

        {!dashboard.items.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#161b22] p-8 text-center">
            <h2 className="font-semibold">No internships available</h2>
            <p className="mt-2 text-sm text-[#8b949e]">
              Internship information will appear here when it is available.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
