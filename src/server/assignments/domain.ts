import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export type DateRange = { startsAt: Timestamp; endsAt?: Timestamp };

/**
 * Canonical Firestore document shapes shared by every feature that reads
 * managerAssignments, teammateAssignments, or teamPlacements sub-collections.
 * Import these instead of re-declaring ad-hoc subsets per feature so the
 * validated shape can't silently drift between callers.
 */
export const managerAssignmentDocumentSchema = z.object({
  userId: z.string().min(1),
  startsAt: z.instanceof(Timestamp).optional(),
  endsAt: z.instanceof(Timestamp).optional(),
});

export const teammateAssignmentDocumentSchema = z.object({
  teammateUserId: z.string().min(1),
  teamId: z.string().min(1),
  responsibilities: z.array(z.string()),
  startsAt: z.instanceof(Timestamp),
  endsAt: z.instanceof(Timestamp).optional(),
});

export const placementDocumentSchema = z.object({
  teamId: z.string().min(1),
  startsAt: z.instanceof(Timestamp),
  endsAt: z.instanceof(Timestamp).optional(),
});

export type ManagerAssignmentPeriod = {
  startsAt?: Timestamp;
  endsAt?: Timestamp;
};

// Legacy manager assignments omit startsAt and are effective immediately.
export function isCurrentManagerAssignment(
  assignment: ManagerAssignmentPeriod,
  now = Timestamp.now(),
): boolean {
  return (
    (!assignment.startsAt || assignment.startsAt.toMillis() <= now.toMillis()) &&
    (!assignment.endsAt || assignment.endsAt.toMillis() > now.toMillis())
  );
}

export function isOperationalInternshipStatus(status: string): boolean {
  return status === "active" || status === "paused";
}

export function assertValidRange({ startsAt, endsAt }: DateRange): void {
  if (endsAt && endsAt.toMillis() < startsAt.toMillis()) {
    throw new Error("The end date cannot be before the start date.");
  }
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  const aEnd = a.endsAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  const bEnd = b.endsAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  return a.startsAt.toMillis() <= bEnd && b.startsAt.toMillis() <= aEnd;
}

export function containsRange(container: DateRange, candidate: DateRange): boolean {
  const containerEnd = container.endsAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  const candidateEnd = candidate.endsAt?.toMillis() ?? Number.POSITIVE_INFINITY;
  return (
    container.startsAt.toMillis() <= candidate.startsAt.toMillis() &&
    candidateEnd <= containerEnd
  );
}

export function isCurrent(range: DateRange, now = Timestamp.now()): boolean {
  return (
    range.startsAt.toMillis() <= now.toMillis() &&
    (!range.endsAt || now.toMillis() <= range.endsAt.toMillis())
  );
}

export function isOngoingOrScheduled(range: DateRange, now = Timestamp.now()): boolean {
  return !range.endsAt || range.endsAt.toMillis() >= now.toMillis();
}

export function assignmentStatus(
  range: DateRange,
  now = Timestamp.now(),
): "current" | "scheduled" | "ended" {
  if (range.endsAt && range.endsAt.toMillis() < now.toMillis()) {
    return "ended";
  }

  return range.startsAt.toMillis() > now.toMillis() ? "scheduled" : "current";
}
