import { describe, expect, it } from "vitest";

import {
  assertWritableWeek,
  getCurrentWeek,
  getWeekPeriod,
  progressHubTimeZone,
} from "./week";

describe("Progress Hub week periods", () => {
  it("uses one deterministic ISO week in the application timezone", () => {
    const week = getCurrentWeek(new Date("2026-08-02T18:00:00.000Z"));

    expect(progressHubTimeZone).toBe("Europe/Uzhgorod");
    expect(week).toMatchObject({
      key: "2026-W31",
      state: "current",
    });
    expect(week.startDate).toBe("2026-07-27");
    expect(week.endDate).toBe("2026-08-02");
  });

  it("handles ISO year boundaries and distinguishes past and future weeks", () => {
    expect(getCurrentWeek(new Date("2025-12-29T12:00:00.000Z")).key).toBe("2026-W01");
    expect(getWeekPeriod("2026-W30", new Date("2026-08-02T18:00:00.000Z")).state).toBe(
      "past",
    );
    expect(getWeekPeriod("2026-W32", new Date("2026-08-02T18:00:00.000Z")).state).toBe(
      "future",
    );
  });

  it("keeps local date-only boundaries stable across winter and DST weeks", () => {
    expect(getCurrentWeek(new Date("2026-01-07T12:00:00.000Z"))).toMatchObject({
      key: "2026-W02",
      startDate: "2026-01-05",
      endDate: "2026-01-11",
    });
    expect(getCurrentWeek(new Date("2026-03-29T12:00:00.000Z"))).toMatchObject({
      key: "2026-W13",
      startDate: "2026-03-23",
      endDate: "2026-03-29",
    });
    expect(getCurrentWeek(new Date("2026-10-25T12:00:00.000Z"))).toMatchObject({
      key: "2026-W43",
      startDate: "2026-10-19",
      endDate: "2026-10-25",
    });
  });

  it("rejects invalid and future client week keys", () => {
    expect(() => getWeekPeriod("not-a-week")).toThrow("Invalid week key");
    expect(() => getWeekPeriod("2026-W54")).toThrow("Invalid week key");
    expect(() =>
      assertWritableWeek("2026-W32", new Date("2026-08-02T18:00:00.000Z")),
    ).toThrow("Future weeks");
  });
});
