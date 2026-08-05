"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Trophy } from "lucide-react";

import type {
  GuestDashboardDto,
  GuestDashboardItem,
} from "@/lib/guest-dashboard/types";
import { internshipStages, internshipStatuses } from "@/lib/internships/types";
import { cn, formatDate } from "@/lib/utils";

function label<T extends { value: string; label: string }>(
  items: readonly T[],
  value: string,
) {
  return items.find((item) => item.value === value)?.label ?? value;
}

function progress(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function statusClass(status: GuestDashboardItem["status"]) {
  return {
    active: "border-[#00e5a3]/20 bg-[#00e5a3]/10 text-[#00e5a3]",
    paused: "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#fbbf24]",
    completed: "border-[#a78bfa]/20 bg-[#a78bfa]/10 text-[#c4b5fd]",
    cancelled: "border-[#f87171]/20 bg-[#f87171]/10 text-[#fca5a5]",
  }[status];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
      {children}
    </h3>
  );
}

function SkillMetrics({ item }: { item: GuestDashboardItem }) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#121a20] p-4">
      <SectionTitle>📊 Skill metrics & achievements</SectionTitle>
      <p className="mt-3 text-xs leading-5 text-[#9ca3af]">
        Progress is calculated from completed required tasks in the current stage.
      </p>
      <ul className="mt-4 space-y-3">
        {item.skills.map((skill) => (
          <li key={skill.id}>
            <div className="mb-1.5 flex justify-between gap-3 text-xs text-[#d1d5db]">
              <span>{skill.label}</span>
              <span className="text-[#9ca3af]">{skill.progress}%</span>
            </div>
            <div
              aria-label={`${skill.label}: ${skill.progress}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={skill.progress}
              className="h-1.5 overflow-hidden rounded-full bg-[#27343c]"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-[#00e5a3] transition-[width] duration-300"
                style={{ width: `${skill.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <Trophy className="size-3.5 text-[#f59e0b]" />
          Achievements
        </div>
        {item.achievements.length ? (
          <ul className="mt-2 space-y-1.5 text-sm text-[#f3f4f6]">
            {item.achievements.map((achievement) => (
              <li key={achievement.id}>
                {achievement.title}
                <span className="text-[#9ca3af]"> · {achievement.category}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#9ca3af]">No achievements yet.</p>
        )}
      </div>
    </section>
  );
}

function Details({ item }: { item: GuestDashboardItem }) {
  const completion = progress(item.requiredCompletedCount, item.requiredTotalCount);
  return (
    <div className="border-t border-white/[0.08] p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-white/[0.08] bg-[#121a20] p-4">
          <SectionTitle>💬 Mentor feedback</SectionTitle>
          {item.mentorFeedback ? (
            <div className="mt-3 space-y-2 text-sm leading-5">
              <p className="text-[#f3f4f6]">{item.mentorFeedback.progressSummary}</p>
              <p className="text-[#9ca3af]">{item.mentorFeedback.strengthsObserved}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#9ca3af]">No mentor check-ins yet.</p>
          )}
        </section>
        <section className="rounded-xl border border-white/[0.08] bg-[#121a20] p-4">
          <SectionTitle>😊 Intern sentiment</SectionTitle>
          {item.internSentiment ? (
            <>
              <div
                className="mt-3 flex gap-1"
                aria-label={`Sentiment: ${item.internSentiment.score} out of 10`}
              >
                {Array.from({ length: 10 }, (_, index) => (
                  <span
                    key={index}
                    className={
                      index < item.internSentiment!.score
                        ? "text-[#00e5a3]"
                        : "text-[#4b5563]"
                    }
                  >
                    ●
                  </span>
                ))}
              </div>
              {item.internSentiment.note ? (
                <p className="mt-2 text-sm text-[#9ca3af]">
                  {item.internSentiment.note}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-[#9ca3af]">
              No sentiment data submitted yet.
            </p>
          )}
        </section>
        <SkillMetrics item={item} />
      </div>

      <section className="mt-4 rounded-xl border border-white/[0.08] bg-[#121a20] p-4">
        <SectionTitle>🕒 Internship lifecycle timeline</SectionTitle>
        {item.timeline.length ? (
          <ol className="mt-4 space-y-4 border-l border-[#31404a] pl-4">
            {item.timeline.map((event) => (
              <li key={event.id} className="relative text-sm">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-[#00e5a3] shadow-[0_0_0_4px_#121a20]" />
                <p className="text-[#f3f4f6]">{event.title}</p>
                <p className="mt-1 text-xs text-[#9ca3af]">
                  {formatDate(event.occurredAt)}
                  {event.description ? ` · ${event.description}` : ""}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-[#9ca3af]">No timeline entries yet.</p>
        )}
      </section>

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#121a20] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-[#d1d5db]">Required tasks in this stage</span>
          <span className="text-sm font-medium text-[#f3f4f6]">
            {item.requiredCompletedCount}/{item.requiredTotalCount}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#27343c]">
          <div
            className="h-full rounded-full bg-[#00e5a3]"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function GuestDashboard({ dashboard }: { dashboard: GuestDashboardDto }) {
  const [open, setOpen] = useState<string | undefined>(
    dashboard.items.find((item) => item.status === "active")?.id,
  );

  const metrics = [
    ["Active internships", dashboard.metrics.active, "text-[#00e5a3]"],
    ["Completed", dashboard.metrics.completed, "text-[#f3f4f6]"],
    ["Total assigned", dashboard.metrics.total, "text-[#f3f4f6]"],
  ] as const;

  return (
    <section className="text-[#f3f4f6]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Internship Overview</h1>
          <p className="mt-2 text-[#9ca3af]">
            Monitor internship lifecycle and progress across all interns.
          </p>
        </div>
        <span className="rounded-lg border border-white/[0.08] bg-[#19242c] px-3 py-2 text-sm text-[#9ca3af]">
          Data Guest (Guest Mode)
        </span>
      </header>

      <dl className="mt-7 grid gap-3 sm:grid-cols-3">
        {metrics.map(([name, value, valueClass]) => (
          <div
            key={name}
            className="rounded-xl border border-white/[0.08] bg-[#121a20] p-4"
          >
            <dt className="text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
              {name}
            </dt>
            <dd className={cn("mt-2 text-3xl font-semibold", valueClass)}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-4">
        {dashboard.items.map((item) => {
          const expanded = open === item.id;
          const completion = progress(
            item.requiredCompletedCount,
            item.requiredTotalCount,
          );
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#19242c] shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
            >
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(220px,1.35fr)_minmax(180px,0.85fr)_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{item.internName}</h2>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs",
                        statusClass(item.status),
                      )}
                    >
                      {label(internshipStatuses, item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#9ca3af]">
                    Started: {formatDate(item.startsAt)} · Project:{" "}
                    {item.project ?? "Unassigned"}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    Mentor: {item.mentor ?? "None"} · Manager: {item.manager ?? "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Current stage</p>
                  <p className="mt-1 text-sm font-medium text-[#f3f4f6]">
                    {label(internshipStages, item.currentStage)}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#27343c]">
                    <div
                      className="h-full rounded-full bg-[#00e5a3]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#9ca3af]">
                    {item.requiredCompletedCount}/{item.requiredTotalCount} tasks
                    required · Day {item.dayOfInternship}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#121a20] px-3 text-sm font-medium text-[#f3f4f6] transition-colors hover:bg-[#27343c]"
                  aria-expanded={expanded}
                  aria-controls={`internship-details-${item.id}`}
                  onClick={() => setOpen(expanded ? undefined : item.id)}
                >
                  {expanded ? "Hide details" : "Details"}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {expanded ? (
                <div id={`internship-details-${item.id}`}>
                  <Details item={item} />
                </div>
              ) : null}
            </article>
          );
        })}
        {!dashboard.items.length ? (
          <div className="rounded-2xl border border-dashed border-white/[0.16] bg-[#121a20] p-8 text-center">
            <Sparkles className="mx-auto size-5 text-[#00e5a3]" />
            <h2 className="mt-3 font-semibold">No internships available</h2>
            <p className="mt-2 text-sm text-[#9ca3af]">
              Internship information will appear here when it is available.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
