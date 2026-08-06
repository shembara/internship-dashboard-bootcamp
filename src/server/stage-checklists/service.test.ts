import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import type { InternshipDocument } from "@/server/internships/domain";

import { getStageChecklistTemplate } from "@/lib/stage-checklists/templates";

import { canCompleteChecklistItem, resolveChecklistAccess } from "./service";

const now = Timestamp.now();

function appUser(roles: Array<"manager" | "intern" | "teammate">, active = true) {
  return {
    active,
    createdAt: now,
    displayName: "Checklist user",
    email: "checklist@example.com",
    identityState: "linked" as const,
    identities: [{ provider: "firebase" as const, subject: "firebase-user" }],
    roles,
    updatedAt: now,
  };
}

function document(data: unknown) {
  return {
    exists: data !== undefined,
    data: () => data,
  } as unknown as FirebaseFirestore.DocumentSnapshot;
}

function assignments(...records: unknown[]) {
  return {
    docs: records.map((record) => ({ data: () => record })),
  } as unknown as FirebaseFirestore.QuerySnapshot;
}

function internship(internId = "intern-1"): InternshipDocument {
  return {
    internId,
    status: "active",
    currentStage: "onboarding",
    startsAt: now,
    createdAt: now,
    createdBy: "manager-1",
    updatedAt: now,
    updatedBy: "manager-1",
  };
}

const currentMentorAssignment = {
  teammateUserId: "mentor-1",
  teamId: "team-1",
  responsibilities: ["mentor"],
  startsAt: Timestamp.fromMillis(0),
};

describe("checklist access", () => {
  it("does not let an intern complete a mentor-or-manager-only task", () => {
    const finalOutcome = getStageChecklistTemplate("finalReview").items.find(
      (item) => item.key === "mentor-final-outcome-recommendation-submitted",
    )!;

    expect(canCompleteChecklistItem(finalOutcome, ["intern"])).toBe(false);
    expect(canCompleteChecklistItem(finalOutcome, ["mentor"])).toBe(true);
    expect(canCompleteChecklistItem(finalOutcome, ["manager"])).toBe(true);
  });

  it("denies an assigned intern without the intern role", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "intern-1",
        document(appUser(["teammate"])),
        document(undefined),
        assignments(),
      ),
    ).toThrow("cannot view this internship");
  });

  it("denies a manager assignment without the manager role", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "manager-1",
        document(appUser(["teammate"])),
        document({ userId: "manager-1" }),
        assignments(),
      ),
    ).toThrow("cannot view this internship");
  });

  it("denies a mentor assignment without the teammate role", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "mentor-1",
        document(appUser(["intern"])),
        document(undefined),
        assignments(currentMentorAssignment),
      ),
    ).toThrow("cannot view this internship");
  });

  it("allows an active role with a current matching assignment", () => {
    expect(
      resolveChecklistAccess(
        internship(),
        "mentor-1",
        document(appUser(["teammate"])),
        document(undefined),
        assignments(currentMentorAssignment),
      ),
    ).toEqual({
      completionActors: ["mentor"],
      canAdvance: true,
      canAddTasks: true,
    });
  });

  it("denies inactive users even when their assignment is current", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "mentor-1",
        document(appUser(["teammate"], false)),
        document(undefined),
        assignments(currentMentorAssignment),
      ),
    ).toThrow("disabled");
  });

  it("rejects a stale mentor assignment from the current authorization snapshot", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "mentor-1",
        document(appUser(["teammate"])),
        document(undefined),
        assignments({
          ...currentMentorAssignment,
          endsAt: Timestamp.fromMillis(1),
        }),
      ),
    ).toThrow("cannot view this internship");
  });

  it("removes mentor advancement when the current assignment loses mentor responsibility", () => {
    const access = resolveChecklistAccess(
      internship(),
      "mentor-1",
      document(appUser(["teammate"])),
      document(undefined),
      assignments({ ...currentMentorAssignment, responsibilities: ["teamLead"] }),
    );

    expect(access.completionActors).toEqual([]);
    expect(access.canAdvance).toBe(false);
  });

  it("rejects a manager when the current assignment snapshot has been removed", () => {
    expect(() =>
      resolveChecklistAccess(
        internship(),
        "manager-1",
        document(appUser(["manager"])),
        document(undefined),
        assignments(),
      ),
    ).toThrow("cannot view this internship");
  });
});
