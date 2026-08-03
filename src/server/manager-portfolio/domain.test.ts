import { describe, expect, it } from "vitest";

import type {
  ManagerPortfolioItemDto,
  ManagerPortfolioQuery,
} from "@/lib/manager-portfolio/types";
import { filterAndSortPortfolio, portfolioMetrics } from "./domain";

function item(overrides: Partial<ManagerPortfolioItemDto>): ManagerPortfolioItemDto {
  return {
    id: "internship-1",
    intern: { id: "intern-1", displayName: "Alex Intern", email: "alex@example.com" },
    status: "active",
    currentStage: "onboarding",
    startsAt: "2026-01-01T00:00:00.000Z",
    currentStageChecklist: {
      requiredCompletedCount: 0,
      requiredTotalCount: 2,
      readyToComplete: false,
      isStageCompleted: false,
    },
    mentorNames: ["Morgan Mentor"],
    mentorUserIds: ["mentor-1"],
    reflectionState: "missing",
    mentorCheckInState: "missing",
    openActionItems: 1,
    overdueActionItems: 0,
    unresolvedAgendaItems: 0,
    attentionSignals: [
      { key: "reflectionMissing", label: "Reflection missing", severity: "warning" },
    ],
    ...overrides,
  };
}

const query: ManagerPortfolioQuery = {
  sort: "internName",
  direction: "asc",
  page: 1,
  pageSize: 20,
};

describe("manager portfolio aggregation", () => {
  it("keeps aggregate metrics based on the full authorized result set", () => {
    const metrics = portfolioMetrics([
      item({}),
      item({
        id: "internship-2",
        status: "paused",
        currentStage: "finalReview",
        reflectionState: "submitted",
        mentorCheckInState: "draft",
        overdueActionItems: 2,
        attentionSignals: [],
      }),
    ]);

    expect(metrics.total).toBe(2);
    expect(metrics.byStatus.active).toBe(1);
    expect(metrics.byStatus.paused).toBe(1);
    expect(metrics.byStage.finalReview).toBe(1);
    expect(metrics.missingCurrentWeekReflections).toBe(1);
    expect(metrics.missingOrDraftMentorCheckIns).toBe(2);
    expect(metrics.withOverdueActionItems).toBe(1);
  });

  it("filters by the URL-supported criteria and uses a stable fallback order", () => {
    const items = [
      item({
        id: "b",
        intern: { id: "intern-b", displayName: "Bea", email: "bea@example.com" },
        mentorUserIds: ["mentor-2"],
      }),
      item({
        id: "a",
        intern: { id: "intern-a", displayName: "Ada", email: "ada@example.com" },
        attentionSignals: [
          {
            key: "overdueActions",
            label: "Overdue actions",
            severity: "critical",
            count: 1,
          },
        ],
      }),
    ];

    expect(
      filterAndSortPortfolio(items, { ...query, search: "ad" }).map(
        (entry) => entry.id,
      ),
    ).toEqual(["a"]);
    expect(
      filterAndSortPortfolio(items, { ...query, mentorId: "mentor-2" }).map(
        (entry) => entry.id,
      ),
    ).toEqual(["b"]);
    expect(
      filterAndSortPortfolio(items, { ...query, attention: "overdueActions" }).map(
        (entry) => entry.id,
      ),
    ).toEqual(["a"]);
  });
});
