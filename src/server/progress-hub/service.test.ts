import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import type { InternshipDocument } from "@/server/internships/domain";

import {
  assertCheckInTransition,
  assertReflectionTransition,
  resolveProgressHubAccess,
} from "./service";

const now = Timestamp.now();

function user(roles: Array<"manager" | "intern" | "teammate">, active = true) {
  return {
    active,
    createdAt: now,
    displayName: "Progress user",
    email: "progress@example.com",
    identityState: "linked" as const,
    identities: [{ provider: "firebase" as const, subject: "progress-user" }],
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

function internship(
  status: InternshipDocument["status"] = "active",
): InternshipDocument {
  return {
    internId: "intern-1",
    status,
    currentStage: "onboarding",
    startsAt: now,
    createdAt: now,
    createdBy: "manager-1",
    updatedAt: now,
    updatedBy: "manager-1",
  };
}

describe("Progress Hub authorization", () => {
  it("requires the teammate role and a current mentor responsibility", () => {
    const currentMentor = {
      teammateUserId: "mentor-1",
      teamId: "team-1",
      responsibilities: ["mentor"],
      startsAt: Timestamp.fromMillis(0),
    };
    expect(
      resolveProgressHubAccess(
        internship(),
        "mentor-1",
        document(user(["teammate"])),
        document(undefined),
        assignments(currentMentor),
      ),
    ).toMatchObject({ viewer: "mentor", mentor: true, writable: true });

    expect(() =>
      resolveProgressHubAccess(
        internship(),
        "mentor-1",
        document(user(["teammate"])),
        document(undefined),
        assignments({ ...currentMentor, responsibilities: ["teamLead"] }),
      ),
    ).toThrow("assigned intern, mentor, or manager");
  });

  it("keeps non-active internships readable but not mutable", () => {
    expect(
      resolveProgressHubAccess(
        internship("paused"),
        "intern-1",
        document(user(["intern"])),
        document(undefined),
        assignments(),
      ),
    ).toMatchObject({ viewer: "intern", writable: false });
  });

  it("does not grant access from an ID match without the active role", () => {
    expect(() =>
      resolveProgressHubAccess(
        internship(),
        "intern-1",
        document(user(["teammate"])),
        document(undefined),
        assignments(),
      ),
    ).toThrow("cannot view this internship");

    expect(() =>
      resolveProgressHubAccess(
        internship(),
        "manager-1",
        document(user(["manager"], false)),
        document({ userId: "manager-1" }),
        assignments(),
      ),
    ).toThrow("disabled");
  });
});

describe("Progress Hub weekly state transitions", () => {
  it("locks a submitted reflection from any further changes", () => {
    expect(() =>
      assertReflectionTransition({ state: "submitted", submittedAt: now } as never),
    ).toThrow("read-only");
    expect(() =>
      assertReflectionTransition({ state: "draft", submittedAt: now } as never),
    ).toThrow("cannot have submission metadata");
  });

  it("locks a shared check-in from any further changes", () => {
    expect(() =>
      assertCheckInTransition({ state: "shared", sharedAt: now } as never),
    ).toThrow("read-only");
    expect(() =>
      assertCheckInTransition({ state: "draft", sharedAt: now } as never),
    ).toThrow("cannot have sharing metadata");
  });
});
