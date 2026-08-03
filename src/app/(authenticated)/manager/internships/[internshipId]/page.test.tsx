import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getManagerPortfolioDetail: vi.fn(),
  getInternshipTimeline: vi.fn(),
  listAchievements: vi.fn(),
  requireManagerPage: vi.fn(),
}));

vi.mock("@/server/assignments/page-auth", () => ({
  requireManagerPage: mocks.requireManagerPage,
}));

vi.mock("@/server/manager-portfolio/service", () => ({
  getManagerPortfolioDetail: mocks.getManagerPortfolioDetail,
}));

vi.mock("@/server/achievements/service", () => ({
  listAchievements: mocks.listAchievements,
}));

vi.mock("@/server/timeline/service", () => ({
  getInternshipTimeline: mocks.getInternshipTimeline,
}));

vi.mock("@/features/achievements/Achievements", () => ({
  Achievements: () => <div>Achievements</div>,
}));

vi.mock("@/features/timeline/InternshipTimeline", () => ({
  InternshipTimeline: () => <div>Timeline</div>,
}));

import AssignmentDetailPage from "./page";

describe("AssignmentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAchievements.mockResolvedValue({
      achievements: [],
      canCreate: true,
      readOnly: false,
    });
    mocks.getInternshipTimeline.mockResolvedValue({
      events: [],
      hasMore: false,
      page: 1,
      group: "all",
    });
  });

  it("shows lifecycle data returned for an authorized manager", async () => {
    mocks.requireManagerPage.mockResolvedValue({ userId: "manager-1" });
    mocks.getManagerPortfolioDetail.mockResolvedValue({
      internship: {
        id: "internship-1",
        intern: {
          id: "intern-1",
          displayName: "Indira Intern",
          email: "intern@example.com",
        },
        status: "paused",
        currentStage: "independentWork",
        startsAt: "2026-01-01T00:00:00.000Z",
        currentStageChecklist: {
          requiredCompletedCount: 0,
          requiredTotalCount: 2,
          readyToComplete: false,
          isStageCompleted: false,
        },
        mentorNames: [],
        mentorUserIds: [],
        reflectionState: "missing",
        mentorCheckInState: "missing",
        openActionItems: 0,
        overdueActionItems: 0,
        unresolvedAgendaItems: 0,
        attentionSignals: [],
      },
      placements: [],
      teammateAssignments: [],
      managerAssignments: [],
      statusHistory: [],
      eligibleManagers: [],
      eligibleTeammates: [],
      capabilities: { canManage: false, canTransitionStatus: false },
    });

    const markup = renderToStaticMarkup(
      await AssignmentDetailPage({
        params: Promise.resolve({ internshipId: "internship-1" }),
      }),
    );

    expect(mocks.requireManagerPage).toHaveBeenCalledOnce();
    expect(mocks.getManagerPortfolioDetail).toHaveBeenCalledWith(
      "internship-1",
      "manager-1",
    );
    expect(mocks.listAchievements).toHaveBeenCalledWith(
      "internship-1",
      "manager-1",
      true,
    );
    expect(markup).toContain("Internship lifecycle");
    expect(markup).toContain("Paused");
    expect(markup).toContain("Independent work");
  });
});
