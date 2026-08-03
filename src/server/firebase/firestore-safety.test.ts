import { describe, expect, it } from "vitest";

import {
  assertSafeFirestoreEnvironment,
  shouldBlockFirestoreForUnitTests,
  throwForBlockedFirestoreAccess,
} from "./firestore-safety";

describe("Firestore safety", () => {
  it("blocks unit-test Firestore access unless an emulator is explicitly configured", () => {
    expect(shouldBlockFirestoreForUnitTests({ NODE_ENV: "test" })).toBe(true);
    expect(
      shouldBlockFirestoreForUnitTests({
        NODE_ENV: "test",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      }),
    ).toBe(false);
    expect(throwForBlockedFirestoreAccess).toThrow("disabled during unit tests");
  });

  it("rejects emulator hosts in production", () => {
    expect(() =>
      assertSafeFirestoreEnvironment({
        NODE_ENV: "production",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      }),
    ).toThrow("must not be configured in production");
    expect(() =>
      assertSafeFirestoreEnvironment({
        NODE_ENV: "production",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      }),
    ).toThrow("must not be configured in production");
  });
});
