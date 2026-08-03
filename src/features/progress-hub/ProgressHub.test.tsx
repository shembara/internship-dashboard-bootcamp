/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  InternProgressHubDto,
  ManagerProgressHubDto,
  MentorProgressHubDto,
  WeeklyReflectionDto,
} from "@/lib/progress-hub/types";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { ProgressHub } from "./ProgressHub";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.refresh.mockReset();
});

const common = {
  currentWeek: {
    key: "2026-W31",
    startDate: "2026-07-27",
    endDate: "2026-08-02",
    label: "27 Jul - 2 Aug",
    state: "current" as const,
  },
  summary: {
    reflectionState: "missing" as const,
    mentorCheckInState: "missing" as const,
    openActionItems: 0,
    overdueActionItems: 0,
    unresolvedAgendaItems: 0,
    currentStage: "onboarding" as const,
    checklistCompleted: 0,
    checklistTotal: 2,
  },
  agendaItems: [],
  sharedNotes: [],
  actionItems: [],
  actionOwners: [
    { userId: "intern-1", ownerType: "intern" as const, label: "Intern · intern-1" },
  ],
  capabilities: {
    canSaveReflection: true,
    canSaveCheckIn: false,
    canCreateAgendaItem: true,
    canCreateSharedNote: true,
    canCreatePrivateInternNote: true,
    canCreatePrivateMentorNote: false,
    canCreateActionItem: true,
  },
};

function internHub(): InternProgressHubDto {
  return {
    viewer: "intern",
    viewerUserId: "intern-1",
    ...common,
    reflectionHistory: [],
    mentorCheckIns: [],
    privateInternNotes: [],
  };
}

function mentorHub(): MentorProgressHubDto {
  return {
    viewer: "mentor",
    viewerUserId: "mentor-1",
    ...common,
    capabilities: {
      ...common.capabilities,
      canSaveReflection: false,
      canSaveCheckIn: true,
      canCreatePrivateInternNote: false,
      canCreatePrivateMentorNote: true,
    },
    reflections: [],
    checkInHistory: [],
    privateMentorNotes: [],
  };
}

function managerHub(): ManagerProgressHubDto {
  return {
    viewer: "manager",
    viewerUserId: "manager-1",
    ...common,
    capabilities: {
      ...common.capabilities,
      canSaveReflection: false,
      canCreatePrivateInternNote: false,
      canCreatePrivateMentorNote: false,
    },
    reflections: [],
    mentorCheckIns: [],
    privateMentorNotes: [],
  };
}

const submittedReflection: WeeklyReflectionDto = {
  weekKey: "2026-W31",
  state: "submitted",
  accomplishments: "Completed the onboarding tasks",
  learnings: "Learned the release process",
  challenges: "No blockers",
  nextWeekFocus: "Take the first Jira task",
  supportNeeded: "A review of my first pull request",
  updatedAt: "2026-08-01T12:00:00.000Z",
  submittedAt: "2026-08-01T12:00:00.000Z",
  canEdit: false,
};

describe("ProgressHub", () => {
  it("renders only the intern-private section for the intern view", () => {
    render(<ProgressHub internshipId="internship-1" hub={internHub()} />);

    expect(screen.getByText("My private notes")).toBeTruthy();
    expect(screen.queryByText("Mentor-private notes")).toBeNull();
    expect(screen.queryByText("Mentor weekly check-in")).toBeNull();
  });

  it("renders mentor-only controls without an intern-private section", () => {
    render(<ProgressHub internshipId="internship-1" hub={mentorHub()} />);

    expect(screen.getByText("Mentor weekly check-in")).toBeTruthy();
    expect(screen.getByText("Mentor-private notes")).toBeTruthy();
    expect(screen.queryByText("My private notes")).toBeNull();
  });

  it("shows submitted intern reflections to the mentor", () => {
    render(
      <ProgressHub
        internshipId="internship-1"
        hub={{ ...mentorHub(), reflections: [submittedReflection] }}
      />,
    );

    expect(screen.getByText("Intern reflections")).toBeTruthy();
    expect(screen.getByText("Completed the onboarding tasks")).toBeTruthy();
    expect(screen.getByText("Take the first Jira task")).toBeTruthy();
  });

  it("shows submitted intern reflections to the manager", () => {
    render(
      <ProgressHub
        internshipId="internship-1"
        hub={{ ...managerHub(), reflections: [submittedReflection] }}
      />,
    );

    expect(screen.getByText("Intern reflections")).toBeTruthy();
    expect(screen.getByText("Completed the onboarding tasks")).toBeTruthy();
    expect(screen.getByText("Take the first Jira task")).toBeTruthy();
  });

  it("locks conflicting controls while one mutation is pending", async () => {
    let resolveRequest: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          }),
      ),
    );
    const user = userEvent.setup();
    render(<ProgressHub internshipId="internship-1" hub={internHub()} />);

    await user.type(
      screen.getByPlaceholderText("Add an agenda topic"),
      "Discuss goals",
    );
    await user.type(
      screen.getAllByPlaceholderText("Write a note")[0],
      "Shared context",
    );
    await user.click(screen.getByRole("button", { name: "Add topic" }));

    expect(
      (screen.getByRole("button", { name: "Add topic" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      screen
        .getAllByRole("button", { name: "Save note" })
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true);

    resolveRequest!(new Response("{}", { status: 200 }));
    await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  it("preserves agenda and note input after a failed mutation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ error: "Denied" }), { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    render(<ProgressHub internshipId="internship-1" hub={internHub()} />);

    const agendaInput = screen.getByPlaceholderText("Add an agenda topic");
    const sharedNoteInput = screen.getAllByPlaceholderText("Write a note")[0];
    await user.type(agendaInput, "Discuss priorities");
    await user.click(screen.getByRole("button", { name: "Add topic" }));
    await vi.waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((agendaInput as HTMLInputElement).value).toBe("Discuss priorities");

    await user.type(sharedNoteInput, "Keep this shared note");
    await user.click(screen.getAllByRole("button", { name: "Save note" })[0]);
    await vi.waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((sharedNoteInput as HTMLTextAreaElement).value).toBe(
      "Keep this shared note",
    );
  });

  it("clears action-item input only after a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    const user = userEvent.setup();
    render(<ProgressHub internshipId="internship-1" hub={internHub()} />);

    const titleInput = screen.getByPlaceholderText("Action item");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(titleInput, "Prepare questions");
    fireEvent.change(dateInput, { target: { value: "2026-08-07" } });
    await user.click(screen.getByRole("button", { name: "Add action" }));

    await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect((titleInput as HTMLInputElement).value).toBe("");
    expect(dateInput.value).toBe("");
  });
});
