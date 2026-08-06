import { describe, expect, it } from "vitest";

import { areRequiredChecklistItemsComplete } from "./service";

describe("areRequiredChecklistItemsComplete", () => {
  it("requires required custom tasks before completing Final Review", () => {
    const items = [
      { key: "template-required", type: "required" as const },
      { key: "custom-required", type: "required" as const },
      { key: "custom-recommended", type: "recommended" as const },
    ];

    expect(
      areRequiredChecklistItemsComplete(items, {
        "template-required": { completed: true },
        "custom-required": { completed: false },
        "custom-recommended": { completed: false },
      }),
    ).toBe(false);
    expect(
      areRequiredChecklistItemsComplete(items, {
        "template-required": { completed: true },
        "custom-required": { completed: true },
        "custom-recommended": { completed: false },
      }),
    ).toBe(true);
  });
});
