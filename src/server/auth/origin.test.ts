import { describe, expect, it } from "vitest";

import { isAllowedRequestOrigin } from "./origin";

describe("isAllowedRequestOrigin", () => {
  const allowedOrigin = "https://dashboard.example.com";

  it.each([
    null,
    "",
    "not a URL",
    "https://attacker.example",
    "http://dashboard.example.com",
    "https://dashboard.example.com.attacker.example",
  ])("rejects %s", (origin) => {
    expect(isAllowedRequestOrigin(origin, allowedOrigin)).toBe(false);
  });

  it("accepts the configured origin exactly", () => {
    expect(isAllowedRequestOrigin("https://dashboard.example.com", allowedOrigin)).toBe(
      true,
    );
  });
});
