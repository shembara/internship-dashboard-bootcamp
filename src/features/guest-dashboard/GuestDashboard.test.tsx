/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { GuestDashboardDto } from "@/lib/guest-dashboard/types";

import { GuestDashboard } from "./GuestDashboard";

afterEach(cleanup);

function dashboard(): GuestDashboardDto {
  return {
    metrics: { total: 1, active: 0, paused: 0, completed: 1 },
    items: [
      {
        id: "internship-1",
        internName: "Ada Lovelace",
        status: "completed",
        currentStage: "finalReview",
        startsAt: "2026-08-01T00:00:00.000Z",
        dayOfInternship: 10,
        dayOfInternshipDate: "2026-08-10T00:00:00.000Z",
        mentors: [],
        managers: [],
        requiredCompletedCount: 0,
        requiredTotalCount: 0,
        timeline: [
          {
            id: "internship:created",
            occurredAt: "2026-08-03T00:00:00.000Z",
            title: "Internship created",
          },
          {
            id: "status:active",
            occurredAt: "2026-08-02T00:00:00.000Z",
            title: "Internship active",
          },
          {
            id: "stage:onboarding",
            occurredAt: "2026-08-02T00:00:00.000Z",
            title: "onboarding stage completed",
          },
          {
            id: "achievement:deal",
            occurredAt: "2026-08-01T00:00:00.000Z",
            title: "Made a deal",
            description: "collaboration",
          },
        ],
        achievements: [],
      },
    ],
  };
}

describe("GuestDashboard", () => {
  it("shows a completed internship's final duration and completion date", () => {
    render(<GuestDashboard dashboard={dashboard()} />);

    expect(screen.getByText("Day 10 · 10 Aug 2026")).toBeTruthy();
  });

  it("shows all internship profile events when details are expanded", () => {
    render(<GuestDashboard dashboard={dashboard()} />);
    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect(screen.getByText(/Internship created/)).toBeTruthy();
    expect(screen.getByText(/Internship active/)).toBeTruthy();
    expect(screen.getByText(/onboarding stage completed/)).toBeTruthy();
    expect(screen.getByText(/Made a deal · collaboration/)).toBeTruthy();
  });
});
