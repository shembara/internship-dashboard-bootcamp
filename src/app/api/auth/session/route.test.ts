import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createFirebaseSessionCookie: vi.fn(),
  setFirebaseSessionCookie: vi.fn(),
  hasValidRequestOrigin: vi.fn(),
}));

vi.mock("@/server/auth/firebase-session-provider", () => ({
  createFirebaseSessionCookie: mocks.createFirebaseSessionCookie,
  setFirebaseSessionCookie: mocks.setFirebaseSessionCookie,
}));

vi.mock("@/server/auth/origin", () => ({
  hasValidRequestOrigin: mocks.hasValidRequestOrigin,
}));

import { POST } from "./route";

describe("POST /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when request origin is invalid", async () => {
    mocks.hasValidRequestOrigin.mockReturnValue(false);

    const request = new Request("https://dashboard.example.com/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: "valid-token" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Invalid request origin.");
  });

  it("returns 400 when request body fails validation", async () => {
    mocks.hasValidRequestOrigin.mockReturnValue(true);

    const request = new Request("https://dashboard.example.com/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: "" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid authentication request.");
  });

  it("creates and sets session cookie on valid request", async () => {
    mocks.hasValidRequestOrigin.mockReturnValue(true);
    mocks.createFirebaseSessionCookie.mockResolvedValue("session-cookie-val");
    mocks.setFirebaseSessionCookie.mockResolvedValue(undefined);

    const request = new Request("https://dashboard.example.com/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: "valid-id-token" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mocks.createFirebaseSessionCookie).toHaveBeenCalledWith("valid-id-token");
    expect(mocks.setFirebaseSessionCookie).toHaveBeenCalledWith("session-cookie-val");
  });
});
