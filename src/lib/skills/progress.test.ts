import { describe, expect, it } from "vitest";

import { calculateSkillProgress, exceedsSkillPointTargets } from "./progress";

describe("calculateSkillProgress", () => {
  it("calculates a whole-number percentage against each skill maximum", () => {
    const progress = calculateSkillProgress([
      { skills: ["technical"], weight: 32, completed: true },
      { skills: ["communication"], weight: 18, completed: true },
    ]);

    expect(progress.find((skill) => skill.skill === "technical")).toMatchObject({
      completedPoints: 32,
      maxPoints: 40,
      percentage: 80,
    });
    expect(progress.find((skill) => skill.skill === "communication")).toMatchObject({
      completedPoints: 18,
      maxPoints: 30,
      percentage: 60,
    });
  });

  it("detects points that exceed a configured skill maximum", () => {
    expect(
      exceedsSkillPointTargets([{ skills: ["leadership"], weight: 21, completed: true }]),
    ).toBe(true);
  });
});
