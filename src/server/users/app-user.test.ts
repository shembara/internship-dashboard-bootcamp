import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import { appUserSchema } from "./app-user";

const validUser = {
  active: true,
  createdAt: Timestamp.now(),
  displayName: "Maya Manager",
  email: "manager@example.com",
  identityState: "linked" as const,
  identities: [{ provider: "firebase", subject: "firebase-uid" }],
  roles: ["manager"],
  updatedAt: Timestamp.now(),
};

describe("appUserSchema", () => {
  it("accepts an active application user with one or more roles", () => {
    expect(
      appUserSchema.parse({
        ...validUser,
        roles: ["manager", "teammate"],
      }).roles,
    ).toEqual(["manager", "teammate"]);
  });

  it("rejects application users without a role", () => {
    expect(() => appUserSchema.parse({ ...validUser, roles: [] })).toThrow();
  });

  it("rejects unknown application roles", () => {
    expect(() =>
      appUserSchema.parse({ ...validUser, roles: ["programManager"] }),
    ).toThrow();
  });
});
