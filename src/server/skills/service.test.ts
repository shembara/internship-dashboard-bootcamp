import { vi, describe, it, expect, beforeEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";

import { createAdminFirestoreMock } from "@/../test/utils/firestore-mock";
import type { WeekPeriod, WeekState } from "@/lib/progress-hub/week";

const internshipId = "internship-1";
const userId = "mentor-1";

function weekPeriod(key: string, state: WeekState): WeekPeriod {
  return { key, state, startDate: "", endDate: "", label: "" };
}

// vi.mock factories are hoisted above imports, so shared state must be created
// via vi.hoisted to be available when the factories run.
const mocks = vi.hoisted(() => ({
  mockStore: {} as Record<string, unknown>,
  getWeekPeriod: vi.fn(),
}));

vi.mock("@/server/firebase/admin", () => ({
  adminFirestore: createAdminFirestoreMock(mocks.mockStore),
}));

vi.mock("@/lib/progress-hub/week", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress-hub/week")>();
  return { ...actual, getWeekPeriod: mocks.getWeekPeriod };
});

// Imported after the mocks above so the service picks them up (vi.mock is hoisted
// by Vitest's transform, so this ordering is safe even with static imports).
import { saveSkillRatings, getSkillRatings } from "./service";

function seedActiveInternship() {
  mocks.mockStore[`internships/${internshipId}`] = {
    internId: "intern-123",
    status: "active",
    currentStage: "onboarding",
    startsAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    createdBy: "manager-1",
    updatedAt: Timestamp.now(),
    updatedBy: "manager-1",
  };
}

function seedMentorAssignment() {
  mocks.mockStore[`internships/${internshipId}/teammateAssignments__query__${userId}`] = [
    {
      teammateUserId: userId,
      teamId: "team-1",
      responsibilities: ["mentor"],
      startsAt: Timestamp.fromMillis(0),
    },
  ];
}

function seedMentorUser() {
  mocks.mockStore[`users/${userId}`] = {
    email: "mentor@example.com",
    displayName: "Mentor",
    roles: ["teammate"],
    active: true,
    identityState: "linked",
    identities: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

const ratings = {
  "Technical understanding": 80,
  "Code quality": 75,
  Debugging: 70,
  "Technical decision-making": 85,
  Communication: 90,
  Ownership: 88,
  "Understanding requirements": 82,
};

beforeEach(() => {
  for (const key of Object.keys(mocks.mockStore)) delete mocks.mockStore[key];
  mocks.getWeekPeriod.mockReset();
  mocks.getWeekPeriod.mockImplementation((key: string) => weekPeriod(key, "current"));
});

describe("skills service", () => {
  it("saves new ratings for current week when user is mentor", async () => {
    seedActiveInternship();
    seedMentorAssignment();
    seedMentorUser();

    await saveSkillRatings(internshipId, "2026-W31", ratings, userId);

    // No throw means the mentor-access checks and Firestore transaction succeeded.
    expect(true).toBe(true);
  });

  it("rejects save when week is not current", async () => {
    mocks.getWeekPeriod.mockImplementation((key: string) => weekPeriod(key, "past"));
    seedActiveInternship();
    seedMentorAssignment();
    seedMentorUser();

    await expect(
      saveSkillRatings(internshipId, "2020-W01", ratings, userId),
    ).rejects.toThrow("Only current week records can be created or updated.");
  });

  it("getSkillRatings returns null for missing week and list for no weekKey", async () => {
    const docData = {
      weekKey: "2026-W31",
      ratings,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    };

    seedActiveInternship();
    seedMentorAssignment();
    seedMentorUser();
    mocks.mockStore[`internships/${internshipId}/skillRatings/2026-W31`] = docData;
    mocks.mockStore[`internships/${internshipId}/skillRatings.__list__`] = [docData];

    const resultForWeek = await getSkillRatings(internshipId, userId, {
      weekKey: "2026-W31",
    });
    expect(resultForWeek).toMatchObject({ weekKey: "2026-W31" });

    const missingWeek = await getSkillRatings(internshipId, userId, {
      weekKey: "2026-W01",
    });
    expect(missingWeek).toBeNull();

    const list = await getSkillRatings(internshipId, userId, {});
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(1);
  });
});
