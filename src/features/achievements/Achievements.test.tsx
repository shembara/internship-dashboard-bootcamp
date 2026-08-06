/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AchievementListDto } from "@/lib/achievements/types";
import { Achievements } from "./Achievements";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.refresh.mockReset();
});

const mockAchievementList: AchievementListDto = {
  achievements: [
    {
      id: "ach-1",
      title: "First Pull Request Merged",
      description: "Successfully merged the onboarding PR",
      category: "milestone",
      achievedOn: "2026-08-01",
      author: { id: "user-1", displayName: "Maya Manager" },
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      canEdit: true,
      canArchive: true,
      canRestore: false,
    },
  ],
  canCreate: true,
  readOnly: false,
};

describe("Achievements Component", () => {
  it("renders list of achievements and form inputs when creation is allowed", () => {
    render(<Achievements internshipId="internship-1" data = { mockAchievementList } />);

    expect(screen.getByText("First Pull Request Merged")).toBeTruthy();
    expect(screen.getByText(/milestone · 2026-08-01 · Maya Manager/)).toBeTruthy();
    expect(screen.getByPlaceholderText("Achievement title")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add achievement" })).toBeTruthy();
  });

  it("renders read-only notice when creation is disabled", () => {
    render(
      <Achievements
        internshipId="internship-1"
        data = {{ ...mockAchievementList, canCreate: false, readOnly: true }}
      />,
  );

  expect(
    screen.getByText("Achievements are read-only for this internship."),
  ).toBeTruthy();
  expect(screen.queryByPlaceholderText("Achievement title")).toBeNull();
});

it("submits achievement creation and refreshes page on success", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 201 })),
  );
  const user = userEvent.setup();

  render(<Achievements internshipId="internship-1" data = { mockAchievementList } />);

  const titleInput = screen.getByPlaceholderText("Achievement title");
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

  await user.type(titleInput, "Delivered Architecture Pitch");
  fireEvent.change(dateInput, { target: { value: "2026-08-05" } });

  await user.click(screen.getByRole("button", { name: "Add achievement" }));

  await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
});
});
