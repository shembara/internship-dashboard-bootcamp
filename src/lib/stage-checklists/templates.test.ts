import { describe, expect, it } from "vitest";

import { internshipStages } from "@/lib/internships/types";

import { stageChecklistTemplates } from "./templates";

describe("stage checklist templates", () => {
  it("defines one ordered template for every lifecycle stage", () => {
    expect(stageChecklistTemplates.map((template) => template.stage)).toEqual(
      internshipStages.map((stage) => stage.value),
    );
  });

  it("uses unique keys and configured permissions for every item", () => {
    for (const template of stageChecklistTemplates) {
      const keys = template.items.map((item) => item.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(
        template.items.every((item) => item.allowedCompletionActors.length > 0),
      ).toBe(true);
    }
  });

  it("contains both required and recommended items for every stage", () => {
    for (const template of stageChecklistTemplates) {
      expect(template.items.some((item) => item.type === "required")).toBe(true);
      expect(template.items.some((item) => item.type === "recommended")).toBe(true);
    }
  });

  it("uses the supplied Required and Recommended tasks for the final three levels", () => {
    expect(
      stageChecklistTemplates
        .find((template) => template.stage === "activeContribution")!
        .items.map(({ label, type }) => ({ label, type })),
    ).toEqual([
      {
        label: "Task independently broken down into subtasks/checklist before starting",
        type: "required",
      },
      { label: "Unit and integration tests written for own code", type: "required" },
      { label: "Review conducted on someone else's PR", type: "required" },
      { label: "Fixed a bug from a bug report", type: "required" },
      {
        label: "Gave an estimate for own task and compared it to actual time spent",
        type: "required",
      },
      { label: "Actively participated in sprint planning", type: "required" },
      { label: "Proposed an improvement in existing code", type: "recommended" },
      {
        label:
          "Observed the team's decisions regarding the product and gave an informed opinion",
        type: "recommended",
      },
      {
        label: "Gave a demo of own feature to the team and the client",
        type: "recommended",
      },
    ]);

    expect(
      stageChecklistTemplates
        .find((template) => template.stage === "independentWork")!
        .items.map(({ label, type }) => ({ label, type })),
    ).toEqual([
      {
        label:
          "Took a task and carried it through the entire cycle (analysis → implementation → tests → review → deploy) independently",
        type: "required",
      },
      { label: "At least one technical proposal/decision made", type: "required" },
      {
        label: "Led refinement/estimation of a task for someone else on the team",
        type: "required",
      },
      {
        label: "Independently investigated and fixed a production issue/edge case",
        type: "required",
      },
      {
        label: "Gave a full code review with constructive feedback",
        type: "required",
      },
      {
        label: "Shared with the team some interesting technical decision",
        type: "recommended",
      },
      {
        label: "Analyzed own progress over the internship (self-review draft)",
        type: "recommended",
      },
      {
        label: "Gave feedback to the mentor — what helped, what was missing",
        type: "recommended",
      },
    ]);

    expect(
      stageChecklistTemplates
        .find((template) => template.stage === "finalReview")!
        .items.map(({ label, type }) => ({ label, type })),
    ).toEqual([
      { label: "Summary of completed tasks and features prepared", type: "required" },
      {
        label:
          "Self-assessment form submitted, covering: technical skills, ownership, communication, and collaboration (1 short rating + comment per area)",
        type: "required",
      },
      { label: "Feedback collected from mentor and team", type: "required" },
      {
        label:
          "Final 1:1 conversation held — strengths, growth areas, next steps discussed",
        type: "required",
      },
      {
        label:
          "Mentor submits final outcome recommendation — one of: Extend contract / Convert to full offer / Conclude internship — with a short justification",
        type: "required",
      },
      {
        label: "Draft a personal development plan for the next 3–6 months",
        type: "recommended",
      },
      {
        label:
          "Prepare a short presentation of the 3-month journey and share with the team",
        type: "recommended",
      },
      {
        label:
          "Internship process survey completed (3–5 fixed questions: onboarding clarity, mentor support, task difficulty pacing)",
        type: "recommended",
      },
      {
        label: "Thank the team and exchange contacts for networking",
        type: "recommended",
      },
    ]);
  });
});
