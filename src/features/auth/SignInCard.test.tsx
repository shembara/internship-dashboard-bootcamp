/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/auth", async () => {
  return vi.importActual<typeof import("firebase/auth")>("firebase/auth");
});

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseClientAuth: vi.fn(() => ({})),
}));

import { SignInCard } from "./SignInCard";

describe("SignInCard", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("shows deterministic local personas in development password mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTHENTICATION_MODE", "email-password-development");

    render(<SignInCard />);

    await waitFor(() =>
      screen.getByText("Sign in to Internship Platform"),
    );

    expect(
      screen.getByRole("button", { name: "Authenticate as manager2" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Authenticate as guest" }),
    ).toBeTruthy();
    expect(screen.getByText("Sasha Manager")).toBeTruthy();
    expect(screen.getByText("Sasha Mentor")).toBeTruthy();
    expect(screen.getByText("Sasha Intern")).toBeTruthy();
    expect(screen.getByText("Sasha Guest")).toBeTruthy();
  });
});
