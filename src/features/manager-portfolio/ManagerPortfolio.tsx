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
import { cn } from "@/lib/utils";

function signalClass(severity: "critical" | "warning" | "neutral" | "positive") {
  return {
    critical: "border-destructive/30 bg-destructive/10 text-destructive",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-800",
    neutral: "border-muted-foreground/25 bg-muted text-muted-foreground",
    positive:
      "border-[var(--brand)]/25 bg-[var(--brand-soft)] text-[var(--brand-strong)]",
  }[severity];
}

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "No end date";
}

export function ManagerPortfolio({ portfolio }: { portfolio: ManagerPortfolioDto }) {
  return <ManagerPortfolioControls key={JSON.stringify(portfolio.query)} portfolio={portfolio} />;
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
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned internships", portfolio.metrics.total],
          ["Active", portfolio.metrics.byStatus.active],
          ["Paused", portfolio.metrics.byStatus.paused],
          ["Ready to complete", portfolio.metrics.stagesReadyToComplete],
          ["Missing reflections", portfolio.metrics.missingCurrentWeekReflections],
          [
            "Missing or draft check-ins",
            portfolio.metrics.missingOrDraftMentorCheckIns,
          ],
          ["With overdue actions", portfolio.metrics.withOverdueActionItems],
          ["Completed", portfolio.metrics.byStatus.completed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Search intern
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
            placeholder="Name"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="">All statuses</option>
            {internshipStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Stage
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="">All stages</option>
            {internshipStages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Attention
          <select
            value={attention}
            onChange={(event) => setAttention(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="">All signals</option>
            {managerAttentionSignals.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Mentor
          <select
            value={mentorId}
            onChange={(event) => setMentorId(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="">All mentors</option>
            {portfolio.mentorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="internName">Intern name</option>
            <option value="startsAt">Start date</option>
            <option value="currentStage">Current stage</option>
            <option value="latestActivity">Latest activity</option>
            <option value="overdueActions">Overdue actions</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Direction
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as typeof direction)
            }
            className="h-10 rounded-lg border bg-background px-3"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit">Apply filters</Button>
          <Button
            type="button"
            variant="outline"
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
                className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-[var(--brand)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{item.intern.displayName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {statusLabel} · {stageLabel} · {dateLabel(item.startsAt)} to{" "}
                      {dateLabel(item.endsAt)}
                    </p>
                  </div>
                  <p className="rounded-full border px-3 py-1 text-sm font-medium">
                    {item.currentStageChecklist.requiredCompletedCount}/
                    {item.currentStageChecklist.requiredTotalCount} required checklist
                    items
                  </p>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <dt className="text-muted-foreground">Mentors</dt>
                    <dd>{item.mentorNames.join(", ") || "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Team</dt>
                    <dd>{item.currentPlacement?.teamTitle ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Reflection</dt>
                    <dd>{item.reflectionState}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Check-in</dt>
                    <dd>{item.mentorCheckInState}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actions</dt>
                    <dd>
                      {item.openActionItems} open
                      {item.overdueActionItems
                        ? ` · ${item.overdueActionItems} overdue`
                        : ""}
                    </dd>
                  </div>
                </dl>
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
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No assigned internships match these filters.
        </div>
      )}
      {portfolio.totalPages > 1 ? (
        <nav
          aria-label="Portfolio pagination"
          className="flex items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">
            Page {portfolio.page} of {portfolio.totalPages} · {portfolio.total} matching
            internships
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={portfolio.page === 1}
              onClick={() => navigate(portfolio.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
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
