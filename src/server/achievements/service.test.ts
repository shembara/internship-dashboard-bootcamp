import { describe, expect, it } from "vitest";
import { achievementInputSchema } from "./service";

describe("achievementInputSchema", () => {
  it("validates a complete, valid achievement input", () => {
    const valid = {
      title: "Completed security audit",
      description: "Audited auth flow and fixed 2 vulnerabilities",
      category: "delivery",
      achievedOn: "2026-08-01",
      linkedStage: "activeContribution",
      evidenceUrl: "https://github.com/fluxon/project/pull/42",
    };

    expect(achievementInputSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty titles or titles exceeding length limit", () => {
    expect(() =>
      achievementInputSchema.parse({
        title: "",
        category: "milestone",
        achievedOn: "2026-08-01",
      }),
    ).toThrow();

    expect(() =>
      achievementInputSchema.parse({
        title: "a".repeat(161),
        category: "milestone",
        achievedOn: "2026-08-01",
      }),
    ).toThrow();
  });

  it("rejects invalid category or non-date achievedOn strings", () => {
    expect(() =>
      achievementInputSchema.parse({
        title: "Achievement",
        category: "invalidCategory",
        achievedOn: "2026-08-01",
      }),
    ).toThrow();

    expect(() =>
      achievementInputSchema.parse({
        title: "Achievement",
        category: "milestone",
        achievedOn: "08/01/2026",
      }),
    ).toThrow();
  });

  it("rejects non-HTTP/HTTPS evidence URLs", () => {
    expect(() =>
      achievementInputSchema.parse({
        title: "Achievement",
        category: "milestone",
        achievedOn: "2026-08-01",
        evidenceUrl: "javascript:alert(1)",
      }),
    ).toThrow();
  });
});
