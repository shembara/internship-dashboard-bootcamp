import { describe, expect, it } from "vitest";
import {
  createInternshipInputSchema,
  createPlacementInputSchema,
  createTeammateAssignmentInputSchema,
  updateResponsibilitiesInputSchema,
} from "./service";

describe("assignments service schemas", () => {
  describe("createInternshipInputSchema", () => {
    it("parses valid internship creation payload with existing team ID", () => {
      const input = {
        internId: "intern-123",
        team: { teamId: "team-456" },
        startsAt: "2026-01-15T00:00:00.000Z",
        endsAt: "2026-07-15T00:00:00.000Z",
        initialMentorUserId: "mentor-789",
      };

      const parsed = createInternshipInputSchema.parse(input);
      expect(parsed.internId).toBe("intern-123");
      expect(parsed.team).toEqual({ teamId: "team-456" });
      expect(parsed.initialMentorUserId).toBe("mentor-789");
    });

    it("parses valid internship creation payload with new team name", () => {
      const input = {
        internId: "intern-123",
        team: { newTeamName: "Core Platform" },
        startsAt: "2026-01-15T00:00:00.000Z",
      };

      const parsed = createInternshipInputSchema.parse(input);
      expect(parsed.team).toEqual({ newTeamName: "Core Platform" });
    });

    it("rejects payload providing both teamId and newTeamName", () => {
      expect(() =>
        createInternshipInputSchema.parse({
          internId: "intern-123",
          team: { teamId: "team-456", newTeamName: "Core Platform" },
          startsAt: "2026-01-15T00:00:00.000Z",
        }),
      ).toThrow();
    });
  });

  describe("createTeammateAssignmentInputSchema", () => {
    it("accepts valid teammate assignment with unique responsibilities", () => {
      const input = {
        teammateUserId: "user-1",
        teamId: "team-1",
        responsibilities: ["mentor", "teamLead"],
        startsAt: "2026-01-15T00:00:00.000Z",
      };

      expect(createTeammateAssignmentInputSchema.parse(input)).toBeDefined();
    });

    it("rejects duplicate responsibilities or invalid responsibility values", () => {
      expect(() =>
        createTeammateAssignmentInputSchema.parse({
          teammateUserId: "user-1",
          teamId: "team-1",
          responsibilities: ["mentor", "mentor"],
          startsAt: "2026-01-15T00:00:00.000Z",
        }),
      ).toThrow();

      expect(() =>
        createTeammateAssignmentInputSchema.parse({
          teammateUserId: "user-1",
          teamId: "team-1",
          responsibilities: ["invalidRole"],
          startsAt: "2026-01-15T00:00:00.000Z",
        }),
      ).toThrow();
    });
  });

  describe("updateResponsibilitiesInputSchema", () => {
    it("validates responsibility updates", () => {
      expect(
        updateResponsibilitiesInputSchema.parse({
          responsibilities: ["mentor", "projectManager"],
        }),
      ).toEqual({ responsibilities: ["mentor", "projectManager"] });
    });
  });
});
