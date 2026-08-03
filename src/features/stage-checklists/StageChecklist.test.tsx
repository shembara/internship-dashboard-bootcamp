/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { StageChecklistDto } from "@/lib/stage-checklists/types";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { StageChecklist } from "./StageChecklist";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.refresh.mockReset();
});

function checklist(overrides: Partial<StageChecklistDto> = {}): StageChecklistDto {
  return {
    stage: "onboarding",
    stageLabel: "Onboarding",
    requiredItems: [
      {
        key: "accounts",
        label: "Accounts configured",
        type: "required",
        completed: true,
        canComplete: true,
      },
      {
        key: "tools",
        label: "Tools configured",
        type: "required",
        completed: true,
        canComplete: true,
      },
    ],
    recommendedItems: [
      {
        key: "notes",
        label: "Project notes prepared",
        type: "recommended",
        completed: false,
        canComplete: true,
      },
    ],
    requiredCompletedCount: 2,
    requiredTotalCount: 2,
    readyToComplete: true,
    isStageCompleted: false,
    canCompleteStage: true,
    ...overrides,
  };
}

describe("StageChecklist", () => {
  it("disables every checklist action while an item mutation is pending", async () => {
    let resolveRequest: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => request),
    );
    const user = userEvent.setup();

    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);

    await user.click(screen.getAllByRole("button", { name: "Reopen" })[0]);

    expect(
      (screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Complete stage" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Complete" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveRequest!(new Response("{}", { status: 200 }));
    await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  it("prevents a second mutation while the first request is in flight", async () => {
    let resolveRequest: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn(() => request);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<StageChecklist internshipId="internship-1" checklist={checklist()} />);

    await user.click(screen.getAllByRole("button", { name: "Reopen" })[0]);
    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(fetchMock).toHaveBeenCalledOnce();
    resolveRequest!(new Response("{}", { status: 200 }));
  });

  it("renders a completed final review as read-only", () => {
    render(
      <StageChecklist
        internshipId="internship-1"
        checklist={checklist({
          stage: "finalReview",
          stageLabel: "Final review",
          isStageCompleted: true,
          completedAt: "2026-08-02T00:00:00.000Z",
          canCompleteStage: false,
          requiredItems: [
            {
              key: "final-notes",
              label: "Final notes complete",
              type: "required",
              completed: true,
              canComplete: false,
            },
          ],
          recommendedItems: [],
          requiredCompletedCount: 1,
          requiredTotalCount: 1,
        })}
      />,
    );

    expect(screen.getByText(/^Stage completed/)).toBeTruthy();
    expect(
      screen.getByText(
        /All lifecycle stages are complete and the internship is awaiting/i,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
