import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assignmentErrorResponse: vi.fn(),
  createInternship: vi.fn(),
  createInternshipInputSchema: { parse: vi.fn((input: unknown) => input) },
  requireManagerMutationContext: vi.fn(),
}));

vi.mock("@/server/assignments/http", () => ({
  assignmentErrorResponse: mocks.assignmentErrorResponse,
  requireManagerMutationContext: mocks.requireManagerMutationContext,
}));

vi.mock("@/server/assignments/service", () => ({
  createInternship: mocks.createInternship,
  createInternshipInputSchema: mocks.createInternshipInputSchema,
}));

import { POST } from "./route";

describe("POST /api/manager/internships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assignmentErrorResponse.mockReturnValue(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
  });

  it("continues to require the existing manager mutation context before creation", async () => {
    mocks.requireManagerMutationContext.mockRejectedValue(new Error("Forbidden"));

    const response = await POST(
      new Request("https://dashboard.example.com/api/manager/internships", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(mocks.requireManagerMutationContext).toHaveBeenCalledOnce();
    expect(mocks.createInternship).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
