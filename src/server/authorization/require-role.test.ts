import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import type { AuthorizationContext } from "./context";
import { AuthorizationError } from "./errors";
import { assertAppUser, assertRole } from "./assertions";

const identity = {
  uid: "firebase-uid",
  email: "person@example.com",
  displayName: "Person",
  emailVerified: true,
};

function appUserContext(
  roles: Array<"manager" | "intern" | "teammate">,
): Extract<AuthorizationContext, { access: "appUser" }> {
  return {
    access: "appUser",
    user: identity,
    userId: "internal-user-id",
    appUser: {
      active: true,
      createdAt: Timestamp.now(),
      displayName: "Person",
      email: "person@example.com",
      identityState: "linked",
      identities: [{ provider: "firebase", subject: "firebase-uid" }],
      roles,
      updatedAt: Timestamp.now(),
    },
  };
}

describe("role authorization", () => {
  it("allows every role explicitly assigned to a multi-role user", () => {
    const context = appUserContext(["manager", "teammate"]);

    expect(assertRole(context, "manager")).toBe(context);
    expect(assertRole(context, "teammate")).toBe(context);
  });

  it("does not infer manager access from teammate access", () => {
    expect(() => assertRole(appUserContext(["teammate"]), "manager")).toThrowError(
      expect.objectContaining<Partial<AuthorizationError>>({
        code: "ROLE_REQUIRED",
      }),
    );
  });

  it("treats a missing application-user record as guest access", () => {
    const guestContext: AuthorizationContext = {
      access: "guest",
      user: identity,
    };

    expect(() => assertAppUser(guestContext)).toThrowError(
      expect.objectContaining<Partial<AuthorizationError>>({
        code: "APP_USER_REQUIRED",
      }),
    );
  });

  it("does not downgrade a disabled user to guest access", () => {
    const activeContext = appUserContext(["intern"]);
    const disabledContext: AuthorizationContext = {
      ...activeContext,
      access: "disabled",
      appUser: {
        ...activeContext.appUser,
        active: false,
      },
    };

    expect(() => assertAppUser(disabledContext)).toThrowError(
      expect.objectContaining<Partial<AuthorizationError>>({
        code: "DISABLED",
      }),
    );
  });
});
