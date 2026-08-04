import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import {
  assignmentStatus,
  assertValidRange,
  containsRange,
  isCurrent,
  isCurrentManagerAssignment,
  isOngoingOrScheduled,
  rangesOverlap,
} from "./domain";

const at = (milliseconds: number) => Timestamp.fromMillis(milliseconds);

describe("assignment date ranges", () => {
  it("treats shared endpoints as overlapping and inclusive", () => {
    const first = { startsAt: at(100), endsAt: at(200) };
    const second = { startsAt: at(200), endsAt: at(300) };

    expect(rangesOverlap(first, second)).toBe(true);
    expect(isCurrent(first, at(200))).toBe(true);
    expect(assignmentStatus(first, at(200))).toBe("current");
  });

  it("recognizes scheduled and ended ranges", () => {
    expect(assignmentStatus({ startsAt: at(200) }, at(100))).toBe("scheduled");
    expect(assignmentStatus({ startsAt: at(100), endsAt: at(200) }, at(201))).toBe(
      "ended",
    );
  });

  it("allows manager assignments for scheduled internships", () => {
    const scheduled = { startsAt: at(200) };
    const ended = { startsAt: at(100), endsAt: at(150) };

    expect(isCurrentManagerAssignment(scheduled, at(100))).toBe(true);
    expect(isCurrentManagerAssignment(ended, at(200))).toBe(false);
  });

  it("keeps an intern unavailable through an inclusive end date", () => {
    const range = { startsAt: at(100), endsAt: at(200) };

    expect(isOngoingOrScheduled(range, at(200))).toBe(true);
    expect(isOngoingOrScheduled(range, at(201))).toBe(false);
  });

  it("requires teammate assignments to fit entirely within a placement", () => {
    const placement = { startsAt: at(100), endsAt: at(300) };

    expect(containsRange(placement, { startsAt: at(100), endsAt: at(300) })).toBe(true);
    expect(containsRange(placement, { startsAt: at(99), endsAt: at(200) })).toBe(false);
    expect(containsRange(placement, { startsAt: at(200) })).toBe(false);
  });

  it("rejects an end before the start", () => {
    expect(() => assertValidRange({ startsAt: at(200), endsAt: at(100) })).toThrow(
      "The end date cannot be before the start date.",
    );
  });
});
