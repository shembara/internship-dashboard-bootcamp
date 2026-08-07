"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { internshipStages, internshipStatuses } from "@/lib/internships/types";
import {
  managerAttentionSignals,
  type ManagerPortfolioDto,
} from "@/lib/manager-portfolio/types";
import {
  managerStatusPillStyles,
  managerTheme,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

function signalClass(severity: "critical" | "warning" | "neutral" | "positive") {
  return {
    critical: "border-red-500/40 bg-red-500/10 text-red-400",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    neutral: "border-white/15 bg-[#0d1117] text-[#8b949e]",
    positive: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  }[severity];
}

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "No end date";
}

function attentionValueClass(value: string) {
  if (/missing|draft|overdue/i.test(value)) {
    return "text-amber-400";
  }
  return "text-[#c9d1d9]";
}

type MetricCard = {
  key: string;
  label: string;
  value: number;
  accent?: boolean;
  warning?: boolean;
};

export function ManagerPortfolio({ portfolio }: { portfolio: ManagerPortfolioDto }) {
  return <ManagerPortfolioControls portfolio={portfolio} />;
}

function ManagerPortfolioControls({ portfolio }: { portfolio: ManagerPortfolioDto }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(portfolio.query.search ?? "");
  const [status, setStatus] = useState(portfolio.query.status ?? "");
  const [stage, setStage] = useState(portfolio.query.stage ?? "");
  const [attention, setAttention] = useState(portfolio.query.attention ?? "");
  const [mentorId, setMentorId] = useState(portfolio.query.mentorId ?? "");
  const [sort, setSort] = useState(portfolio.query.sort);
  const [direction, setDirection] = useState(portfolio.query.direction);

  const primaryMetrics: MetricCard[] = [
    { key: "total", label: "Assigned internships", value: portfolio.metrics.total },
    {
      key: "active",
      label: "Active",
      value: portfolio.metrics.byStatus.active,
      accent: true,
    },
    {
      key: "ready",
      label: "Ready to complete",
      value: portfolio.metrics.stagesReadyToComplete,
    },
  ];

  const secondaryMetrics: MetricCard[] = [
    {
      key: "reflections",
      label: "Missing reflections",
      value: portfolio.metrics.missingCurrentWeekReflections,
      warning: true,
    },
    {
      key: "checkins",
      label: "Missing or draft check-ins",
      value: portfolio.metrics.missingOrDraftMentorCheckIns,
      warning: true,
    },
    {
      key: "overdue",
      label: "With overdue actions",
      value: portfolio.metrics.withOverdueActionItems,
      warning: true,
    },
    { key: "paused", label: "Paused", value: portfolio.metrics.byStatus.paused },
    {
      key: "completed",
      label: "Completed",
      value: portfolio.metrics.byStatus.completed,
    },
  ];

  function navigate(page = 1) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (stage) params.set("stage", stage);
    if (attention) params.set("attention", attention);
    if (mentorId) params.set("mentorId", mentorId);
    params.set("sort", sort);
    params.set("direction", direction);
    params.set("page", String(page));
    params.set("pageSize", String(portfolio.query.pageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <dl className="grid gap-3 sm:grid-cols-3">
          {primaryMetrics.map((metric) => (
            <div
              key={metric.key}
              className={cn("p-4", metric.accent ? managerTheme.cardAccent : managerTheme.card)}
            >
              <dt className={managerTheme.label}>{metric.label}</dt>
              <dd
                className={cn(
                  "mt-2 text-3xl font-semibold",
                  metric.accent && "text-emerald-400",
                )}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {secondaryMetrics.map((metric) => (
            <div key={metric.key} className={cn(managerTheme.card, "p-4")}>
              <dt className={managerTheme.label}>{metric.label}</dt>
              <dd
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  metric.warning && metric.value > 0 && "text-amber-400",
                )}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <form
        onSubmit={submit}
        className={cn(managerTheme.card, "grid gap-4 p-4 md:grid-cols-3 xl:grid-cols-6")}
      >
        <label className="grid gap-1.5 md:col-span-2">
          <span className={managerTheme.label}>Search intern</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={managerTheme.input}
            placeholder="Name"
          />
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={managerTheme.input}
          >
            <option value="">All statuses</option>
            {internshipStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Stage</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className={managerTheme.input}
          >
            <option value="">All stages</option>
            {internshipStages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Attention</span>
          <select
            value={attention}
            onChange={(event) => setAttention(event.target.value)}
            className={managerTheme.input}
          >
            <option value="">All signals</option>
            {managerAttentionSignals.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Mentor</span>
          <select
            value={mentorId}
            onChange={(event) => setMentorId(event.target.value)}
            className={managerTheme.input}
          >
            <option value="">All mentors</option>
            {portfolio.mentorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className={managerTheme.input}
          >
            <option value="internName">Intern name</option>
            <option value="startsAt">Start date</option>
            <option value="currentStage">Current stage</option>
            <option value="latestActivity">Latest activity</option>
            <option value="overdueActions">Overdue actions</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={managerTheme.label}>Direction</span>
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as typeof direction)
            }
            className={managerTheme.input}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <div className="flex items-end gap-2 xl:col-span-2">
          <Button type="submit" className={managerTheme.primaryButton}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={managerTheme.ghostButton}
            onClick={() => {
              setSearch("");
              setStatus("");
              setStage("");
              setAttention("");
              setMentorId("");
              setSort("internName");
              setDirection("asc");
              router.push(pathname);
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {portfolio.items.length ? (
        <div className="grid gap-4">
          {portfolio.items.map((item) => {
            const statusLabel = internshipStatuses.find(
              (status) => status.value === item.status,
            )?.label;
            const stageLabel = internshipStages.find(
              (stage) => stage.value === item.currentStage,
            )?.label;
            return (
              <Link
                key={item.id}
                href={`/manager/internships/${item.id}`}
                className={cn(
                  managerTheme.card,
                  "block p-5 transition hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{item.intern.displayName}</h2>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          managerStatusPillStyles[item.status] ??
                            "border-white/20 text-[#8b949e]",
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className={cn("mt-1 text-sm", managerTheme.muted)}>
                      {stageLabel} · {dateLabel(item.startsAt)} to {dateLabel(item.endsAt)}
                    </p>
                  </div>
                  <p className="rounded-full border border-white/15 bg-[#0d1117] px-3 py-1 text-sm font-medium text-[#c9d1d9]">
                    {item.currentStageChecklist.requiredCompletedCount}/
                    {item.currentStageChecklist.requiredTotalCount} required checklist items
                  </p>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <dt className={managerTheme.label}>Mentors</dt>
                    <dd className="mt-1">{item.mentorNames.join(", ") || "None"}</dd>
                  </div>
                  <div>
                    <dt className={managerTheme.label}>Team</dt>
                    <dd className="mt-1">{item.currentPlacement?.teamTitle ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className={managerTheme.label}>Reflection</dt>
                    <dd className={cn("mt-1", attentionValueClass(item.reflectionState))}>
                      {item.reflectionState}
                    </dd>
                  </div>
                  <div>
                    <dt className={managerTheme.label}>Check-in</dt>
                    <dd className={cn("mt-1", attentionValueClass(item.mentorCheckInState))}>
                      {item.mentorCheckInState}
                    </dd>
                  </div>
                  <div>
                    <dt className={managerTheme.label}>Actions</dt>
                    <dd className="mt-1">
                      {item.openActionItems} open
                      {item.overdueActionItems
                        ? ` · ${item.overdueActionItems} overdue`
                        : ""}
                    </dd>
                  </div>
                </dl>
                {item.attentionSignals.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.attentionSignals.map((signal) => (
                      <span
                        key={signal.key}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          signalClass(signal.severity),
                        )}
                      >
                        {signal.label}
                        {signal.count ? ` (${signal.count})` : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            managerTheme.card,
            "border-dashed p-8 text-center text-sm text-[#8b949e]",
          )}
        >
          No assigned internships match these filters.
        </div>
      )}
      {portfolio.totalPages > 1 ? (
        <nav
          aria-label="Portfolio pagination"
          className="flex items-center justify-between gap-3"
        >
          <p className={cn("text-sm", managerTheme.muted)}>
            Page {portfolio.page} of {portfolio.totalPages} · {portfolio.total} matching
            internships
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={managerTheme.outlineButton}
              disabled={portfolio.page === 1}
              onClick={() => navigate(portfolio.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className={managerTheme.outlineButton}
              disabled={portfolio.page === portfolio.totalPages}
              onClick={() => navigate(portfolio.page + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
