/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRedirectResult: vi.fn(),
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return {
    ...actual,
    getRedirectResult: mocks.getRedirectResult,
  };
});

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseClientAuth: vi.fn(() => ({})),
}));

import { SignInCard } from "./SignInCard";

describe("SignInCard", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    mocks.getRedirectResult.mockReset();
  });

  it("shows deterministic local personas in development password mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "email-password-development");
    mocks.getRedirectResult.mockResolvedValue(null);

    render(<SignInCard />);

    await waitFor(() => screen.getByText("Internship Dashboard"));

    expect(screen.getByText("Authenticate as manager2")).toBeTruthy();
    expect(screen.getByText("Authenticate as guest")).toBeTruthy();
    expect(screen.getByText("manager@fluxon.com")).toBeTruthy();
    expect(screen.getByText("mentor@fluxon.com")).toBeTruthy();
    expect(screen.getByText("intern@fluxon.com")).toBeTruthy();
    expect(screen.getByText("guest@fluxon.com")).toBeTruthy();
  });
});
