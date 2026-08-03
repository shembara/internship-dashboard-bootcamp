/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { internshipStages, internshipStatuses } from "@/lib/internships/types";

import { InternshipLifecycle } from "./InternshipLifecycle";

afterEach(cleanup);

function stageItems() {
  return within(
    screen.getByRole("list", { name: "Internship stage progression" }),
  ).getAllByRole("listitem");
}

describe("InternshipLifecycle", () => {
  it.each(internshipStatuses)(
    "displays the $label status label",
    ({ value, label }) => {
      render(<InternshipLifecycle status={value} currentStage="activeContribution" />);

      expect(
        within(screen.getByText("Status").parentElement!).getByText(label),
      ).toBeTruthy();
    },
  );

  it("shows all stages in order and identifies completed, current, and upcoming stages", () => {
    render(<InternshipLifecycle status="active" currentStage="activeContribution" />);

    const stages = stageItems();
    expect(
      stages.map((stage) => within(stage).getByRole("heading").textContent),
    ).toEqual(internshipStages.map(({ label }) => label));
    expect(within(stages[0]).getByText("Completed")).toBeTruthy();
    expect(within(stages[1]).getByText("Completed")).toBeTruthy();
    expect(within(stages[2]).getByText("Current")).toBeTruthy();
    expect(stages[2].getAttribute("aria-current")).toBe("step");
    expect(within(stages[3]).getByText("Upcoming")).toBeTruthy();
    expect(within(stages[4]).getByText("Upcoming")).toBeTruthy();
  });

  it("supports onboarding as the first stage", () => {
    render(<InternshipLifecycle status="paused" currentStage="onboarding" />);

    const stages = stageItems();
    expect(within(stages[0]).getByText("Current")).toBeTruthy();
    expect(stages[0].getAttribute("aria-current")).toBe("step");
    expect(within(stages[1]).getByText("Upcoming")).toBeTruthy();
  });

  it("supports final review as the last stage", () => {
    render(<InternshipLifecycle status="completed" currentStage="finalReview" />);

    const stages = stageItems();
    expect(within(stages[3]).getByText("Completed")).toBeTruthy();
    expect(within(stages[4]).getByText("Current")).toBeTruthy();
    expect(stages[4].getAttribute("aria-current")).toBe("step");
  });

  it("marks every lifecycle stage complete after final review is completed", () => {
    render(
      <InternshipLifecycle
        status="active"
        currentStage="finalReview"
        checklist={{
          stage: "finalReview",
          stageLabel: "Final review",
          requiredItems: [],
          recommendedItems: [],
          requiredCompletedCount: 0,
          requiredTotalCount: 0,
          readyToComplete: true,
          isStageCompleted: true,
          canCompleteStage: false,
        }}
      />,
    );

    expect(
      stageItems().every((stage) => stage.textContent?.includes("Completed")),
    ).toBe(true);
  });
});
