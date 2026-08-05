import { describe, expect, it } from "vitest";

import { formatDate } from "./utils";

describe("formatDate", () => {
  it("formats ISO date values as MM/DD/YYYY", () => {
    expect(formatDate("2026-08-04T00:00:00.000Z")).toBe("08/04/2026");
    expect(formatDate("2026-08-04")).toBe("08/04/2026");
    expect(formatDate("2026-08-03T22:30:00.000Z")).toBe("08/04/2026");
  });
});
