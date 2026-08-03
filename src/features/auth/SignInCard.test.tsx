import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignInCard } from "./SignInCard";

describe("SignInCard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows deterministic local personas in development password mode", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "email-password-development");
    const markup = renderToStaticMarkup(<SignInCard />);

    expect(markup).toContain("Internship Dashboard");
    expect(markup).toContain("Authenticate as manager");
    expect(markup).toContain("Authenticate as guest");
    expect(markup).toContain("manager@example.com");
    expect(markup).toContain("mentor@example.com");
    expect(markup).toContain("intern@example.com");
    expect(markup).toContain("guest@example.com");
  });
});
