import "server-only";

import {
  internshipStages,
  internshipStatuses,
  type InternshipStage,
  type InternshipStatus,
} from "@/lib/internships/types";
import {
  managerAttentionSignals,
  type ManagerAttentionSignal,
  type ManagerAttentionSignalKey,
  type ManagerPortfolioItemDto,
  type ManagerPortfolioMetricsDto,
  type ManagerPortfolioQuery,
} from "@/lib/manager-portfolio/types";

const signalByKey = new Map(
  managerAttentionSignals.map((signal) => [signal.value, signal]),
);

export function attentionSignal(
  key: ManagerAttentionSignalKey,
  details: Pick<ManagerAttentionSignal, "count" | "date"> = {},
): ManagerAttentionSignal {
  const signal = signalByKey.get(key);
  if (!signal) throw new Error(`Unknown manager attention signal: ${key}`);
  return { key, label: signal.label, severity: signal.severity, ...details };
}

export function portfolioMetrics(
  items: ManagerPortfolioItemDto[],
): ManagerPortfolioMetricsDto {
  const byStatus = Object.fromEntries(
    internshipStatuses.map(({ value }) => [value, 0]),
  ) as Record<InternshipStatus, number>;
  const byStage = Object.fromEntries(
    internshipStages.map(({ value }) => [value, 0]),
  ) as Record<InternshipStage, number>;
  items.forEach((item) => {
    byStatus[item.status] += 1;
    byStage[item.currentStage] += 1;
  });
  return {
    total: items.length,
    byStatus,
    byStage,
    missingCurrentWeekReflections: items.filter(
      (item) => item.reflectionState === "missing",
    ).length,
    missingOrDraftMentorCheckIns: items.filter(
      (item) =>
        item.mentorCheckInState === "missing" || item.mentorCheckInState === "draft",
    ).length,
    withOverdueActionItems: items.filter((item) => item.overdueActionItems > 0).length,
    stagesReadyToComplete: items.filter(
      (item) => item.currentStageChecklist?.readyToComplete,
    ).length,
  };
}

export function filterAndSortPortfolio(
  items: ManagerPortfolioItemDto[],
  query: ManagerPortfolioQuery,
): ManagerPortfolioItemDto[] {
  const filtered = items.filter((item) => {
    const queryText = query.search?.trim().toLowerCase();
    return (
      (!queryText || item.intern.displayName.toLowerCase().includes(queryText)) &&
      (!query.status || item.status === query.status) &&
      (!query.stage || item.currentStage === query.stage) &&
      (!query.attention ||
        item.attentionSignals.some((signal) => signal.key === query.attention)) &&
      (!query.mentorId || item.mentorUserIds.includes(query.mentorId))
    );
  });
  const stageIndex = new Map(
    internshipStages.map((stage, index) => [stage.value, index]),
  );
  const direction = query.direction === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    const comparison = (() => {
      switch (query.sort) {
        case "startsAt":
          return a.startsAt.localeCompare(b.startsAt);
        case "currentStage":
          return (
            (stageIndex.get(a.currentStage) ?? 0) -
            (stageIndex.get(b.currentStage) ?? 0)
          );
        case "latestActivity":
          return (a.latestSharedActivityAt ?? "").localeCompare(
            b.latestSharedActivityAt ?? "",
          );
        case "overdueActions":
          return a.overdueActionItems - b.overdueActionItems;
        default:
          return a.intern.displayName.localeCompare(b.intern.displayName);
      }
    })();
    return comparison === 0 ? a.id.localeCompare(b.id) : comparison * direction;
  });
}
