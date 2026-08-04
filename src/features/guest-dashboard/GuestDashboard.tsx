"use client";

import { useState } from "react";
import type { GuestDashboardDto } from "@/lib/guest-dashboard/types";
import { internshipStages, internshipStatuses } from "@/lib/internships/types";

function label<T extends { value: string; label: string }>(
  items: readonly T[],
  value: string,
) {
  return items.find((item) => item.value === value)?.label ?? value;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00.000Z`));
}

export function GuestDashboard({ dashboard }: { dashboard: GuestDashboardDto }) {
  const [open, setOpen] = useState<string>();
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Executive workspace
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Internship overview
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monitor internship lifecycle and progress across all interns.
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned internships", dashboard.metrics.total],
          ["Active", dashboard.metrics.active],
          ["Paused", dashboard.metrics.paused],
          ["Completed", dashboard.metrics.completed],
        ].map(([name, value]) => (
          <div key={String(name)} className="rounded-2xl border bg-card p-4 shadow-sm">
            <dt className="text-sm text-muted-foreground">{name}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3">
        {dashboard.items.map((item) => {
          const expanded = open === item.id;
          return (
            <article key={item.id} className="rounded-2xl border bg-card shadow-sm">
              <div className="grid gap-4 p-10 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_auto]">
                <div>
                  <h2 className="text-lg font-semibold">{item.internName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Started {dateLabel(item.startsAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Project: {item.project ?? "Unassigned"}
                  </p>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{label(internshipStatuses, item.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current stage</dt>
                    <dd>{label(internshipStages, item.currentStage)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tasks count</dt>
                    <dd>
                      {item.requiredCompletedCount}/{item.requiredTotalCount} required
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Mentor</dt>
                    <dd>{item.mentor ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Manager</dt>
                    <dd>{item.manager ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Length of internship</dt>
                    <dd>{item.dayOfInternship} days</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="h-10 rounded-lg border px-3 text-sm font-medium"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? undefined : item.id)}
                >
                  {expanded ? "Hide details" : "Details"}
                </button>
              </div>
              {expanded ? (
                <div className="grid gap-5 border-t p-5 md:grid-cols-2">
                  <section>
                    <h3 className="font-semibold">Internship lifecycle timeline</h3>
                    {item.timeline.length ? (
                      <ul className="mt-3 space-y-2 text-sm">
                        {item.timeline.map((event) => (
                          <li key={event.id}>
                            {dateLabel(event.occurredAt)} · {event.title}
                            {event.description ? ` · ${event.description}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No timeline entries yet.
                      </p>
                    )}
                  </section>
                  <section>
                    <h3 className="font-semibold">Mentor feedback about intern</h3>
                    {item.mentorFeedback ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <p>{item.mentorFeedback.progressSummary}</p>
                        <p className="text-muted-foreground">
                          {item.mentorFeedback.strengthsObserved}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No mentor check-ins yet.
                      </p>
                    )}
                  </section>
                  <section>
                    <h3 className="font-semibold">Intern feeling about internship</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Not available yet.
                    </p>
                  </section>
                  <section>
                    <h3 className="font-semibold">Skill metrics</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Not available yet.
                    </p>
                  </section>
                  <section className="md:col-span-2">
                    <h3 className="font-semibold">Achievements</h3>
                    {item.achievements.length ? (
                      <ul className="mt-3 space-y-2 text-sm">
                        {item.achievements.map((achievement) => (
                          <li key={achievement.id}>
                            {achievement.title} · {achievement.category} ·{" "}
                            {dateLabel(achievement.achievedOn)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <h2 className="font-semibold">No internships available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Internship information will appear here when it is available.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
