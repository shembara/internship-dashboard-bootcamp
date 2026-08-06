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

    await waitFor(() => screen.getByText("Internship Dashboard"));

    expect(screen.getByText("Authenticate as manager2")).toBeTruthy();
    expect(screen.getByText("Authenticate as guest")).toBeTruthy();
    expect(screen.getByText("manager@fluxon.com")).toBeTruthy();
    expect(screen.getByText("mentor@fluxon.com")).toBeTruthy();
    expect(screen.getByText("intern@fluxon.com")).toBeTruthy();
    expect(screen.getByText("guest@fluxon.com")).toBeTruthy();
  });
});
