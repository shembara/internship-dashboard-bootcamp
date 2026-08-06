/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StageChecklistDto } from "@/lib/stage-checklists/types";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
import { StageChecklist } from "./StageChecklist";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.refresh.mockReset();
});

function checklist(): StageChecklistDto {
  const items = [
    {
      key: "accounts",
      label: "Accounts configured",
      type: "required" as const,
      status: "todo" as const,
      completed: false,
      skills: ["technical"] as const,
      weight: 1,
      canComplete: true,
      canDelete: false,
    },
    {
      key: "notes",
      label: "Prepare notes",
      type: "recommended" as const,
      status: "inProgress" as const,
      completed: false,
      skills: ["planning"] as const,
      weight: 1,
      canComplete: true,
      canDelete: true,
    },
    {
      key: "tools",
      label: "Tools configured",
      type: "required" as const,
      status: "done" as const,
      completed: true,
      skills: ["technical", "codeQuality"] as const,
      weight: 1,
      canComplete: true,
      canDelete: false,
    },
  ];
  return {
    stage: "onboarding",
    stageLabel: "Onboarding",
    items,
    requiredItems: [items[0], items[2]],
    recommendedItems: [items[1]],
    requiredCompletedCount: 1,
    requiredTotalCount: 2,
    readyToComplete: false,
    isStageCompleted: false,
    canCompleteStage: true,
    canAddTasks: true,
    reviewStatus: "underReview",
    canViewAllStages: false,
    skillProgress: [],
  };
}

describe("StageChecklist", () => {
  it("renders tasks in the three workflow columns", () => {
    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);
    expect(screen.getByRole("region", { name: "To do" }).textContent).toContain(
      "Accounts configured",
    );
    expect(screen.getByRole("region", { name: "In progress" }).textContent).toContain(
      "Prepare notes",
    );
    expect(screen.getByRole("region", { name: "Done" }).textContent).toContain(
      "Tools configured",
    );
  });

  it("sends a status update when a task is moved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}", { status: 200 }))),
    );
    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Start" }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/items"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          stage: "onboarding",
          itemKey: "accounts",
          status: "inProgress",
        }),
      }),
    );
  });

  it("renders the required-task progress bar and mentor review action", () => {
    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);
    expect(
      screen
        .getByRole("progressbar", { name: "Required task progress" })
        .getAttribute("aria-valuenow"),
    ).toBe("1");
    expect(screen.getByText("Under mentor review")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Request changes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add task" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Confirm mentor review" }),
    ).toBeNull();
  });

  it("deletes a custom task", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}", { status: 200 }))),
    );
    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Delete task" }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/tasks"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ stage: "onboarding", itemKey: "notes" }),
      }),
    );
  });
});
