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

  it("does not make weekly reflections or Feedback App coordination advancement gates", () => {
    const activeContribution = stageChecklistTemplates.find(
      (template) => template.stage === "activeContribution",
    )!;
    const finalReview = stageChecklistTemplates.find(
      (template) => template.stage === "finalReview",
    )!;

    expect(
      activeContribution.items.some(
        (item) => item.key === "weekly-reflections-submitted",
      ),
    ).toBe(false);
    expect(
      [...activeContribution.items, ...finalReview.items]
        .filter((item) =>
          [
            "official-feedback-cycle-published",
            "final-feedback-cycle-started",
            "required-teammate-feedback-collected",
            "final-feedback-published",
          ].includes(item.key),
        )
        .every((item) => item.type === "recommended"),
    ).toBe(true);
  });
});
