import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  initialInternshipLifecycle,
  internshipStages,
  internshipStatuses,
} from "@/lib/internships/types";

import { parseInternshipDocument, serializeNewInternshipLifecycle } from "./repository";
import { parseInternshipLifecycle } from "./domain";

const timestamp = Timestamp.fromMillis(1);

function persistedInternship(overrides: Record<string, unknown> = {}) {
  return {
    internId: "intern-1",
    status: "active",
    currentStage: "onboarding",
    startsAt: timestamp,
    createdAt: timestamp,
    createdBy: "manager-1",
    updatedAt: timestamp,
    updatedBy: "manager-1",
    ...overrides,
  };
}

describe("internship Firestore lifecycle records", () => {
  it("creates the required active onboarding lifecycle", () => {
    expect(serializeNewInternshipLifecycle()).toEqual({
      status: "active",
      currentStage: "onboarding",
    });
    expect(initialInternshipLifecycle).toEqual(serializeNewInternshipLifecycle());
  });

  it.each(internshipStatuses)("parses the supported $value status", ({ value }) => {
    expect(parseInternshipDocument(persistedInternship({ status: value })).status).toBe(
      value,
    );
  });

  it.each(internshipStages)("parses the supported $value stage", ({ value }) => {
    expect(
      parseInternshipDocument(persistedInternship({ currentStage: value }))
        .currentStage,
    ).toBe(value);
  });

  it("reads legacy documents without a stage as onboarding", () => {
    const legacyDocument: Record<string, unknown> = persistedInternship();
    delete legacyDocument.currentStage;

    expect(parseInternshipDocument(legacyDocument).currentStage).toBe("onboarding");
  });

  it("maps the legacy archived status to completed", () => {
    expect(
      parseInternshipDocument(persistedInternship({ status: "archived" })).status,
    ).toBe("completed");
  });

  it.each([
    ["status", "atRisk"],
    ["currentStage", "graduated"],
  ])("rejects an unknown %s", (field, value) => {
    expect(() =>
      parseInternshipDocument(persistedInternship({ [field]: value })),
    ).toThrow(ZodError);
  });

  it("parses each supported lifecycle value without changing it", () => {
    for (const { value: status } of internshipStatuses) {
      for (const { value: currentStage } of internshipStages) {
        expect(parseInternshipLifecycle({ status, currentStage })).toEqual({
          status,
          currentStage,
        });
      }
    }
  });
});
