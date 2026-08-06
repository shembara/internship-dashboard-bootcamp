import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import AssignmentDetailPage from "./page";

describe("AssignmentDetailPage", () => {
  it("redirects manager to internship-lifecycle section", async () => {
    await AssignmentDetailPage({
      params: Promise.resolve({ internshipId: "internship-1" }),
    });

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/manager/internships/internship-1/internship-lifecycle",
    );
  });
});
