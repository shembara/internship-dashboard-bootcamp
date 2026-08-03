import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentInternshipForIntern: vi.fn(),
  getInternshipTimeline: vi.fn(),
  listAchievements: vi.fn(),
  requireInternPage: vi.fn(),
}));

vi.mock("@/server/assignments/page-auth", () => ({
  requireInternPage: mocks.requireInternPage,
}));

vi.mock("@/server/assignments/service", () => ({
  getCurrentInternshipForIntern: mocks.getCurrentInternshipForIntern,
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

import InternPage from "./page";

describe("InternPage", () => {
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

  it("shows lifecycle data returned for an authorized intern", async () => {
    mocks.requireInternPage.mockResolvedValue({ userId: "intern-1" });
    mocks.getCurrentInternshipForIntern.mockResolvedValue({
      id: "internship-1",
      status: "active",
      currentStage: "firstJiraTasks",
    });

    const markup = renderToStaticMarkup(await InternPage());

    expect(mocks.requireInternPage).toHaveBeenCalledOnce();
    expect(mocks.getCurrentInternshipForIntern).toHaveBeenCalledWith("intern-1");
    expect(mocks.listAchievements).toHaveBeenCalledWith("internship-1", "intern-1");
    expect(mocks.getInternshipTimeline).toHaveBeenCalledWith(
      "internship-1",
      expect.objectContaining({ achievements: [] }),
    );
    expect(markup).toContain("Internship lifecycle");
    expect(markup).toContain("Active");
    expect(markup).toContain("First Jira tasks");
  });

  it("renders an authorized non-active internship as read-only history", async () => {
    mocks.requireInternPage.mockResolvedValue({ userId: "intern-1" });
    mocks.getCurrentInternshipForIntern.mockResolvedValue({
      id: "internship-1",
      status: "paused",
      currentStage: "activeContribution",
    });

    const markup = renderToStaticMarkup(await InternPage());

    expect(markup).toContain("historical context");
    expect(markup).toContain("read-only");
  });
});
