import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import {
  initialInternshipLifecycle,
  internshipStages,
  internshipStatuses,
  type InternshipLifecycle,
  type InternshipStage,
  type InternshipStatus,
} from "@/lib/internships/types";

const statusValues = internshipStatuses.map(({ value }) => value) as [
  InternshipStatus,
  ...InternshipStatus[],
];
const stageValues = internshipStages.map(({ value }) => value) as [
  InternshipStage,
  ...InternshipStage[],
];

export const internshipStatusSchema = z.enum(statusValues);
export const internshipStageSchema = z.enum(stageValues);
export const internshipLifecycleSchema = z.object({
  status: internshipStatusSchema,
  currentStage: internshipStageSchema,
});

export const legacyInternshipStatusMappings = {
  archived: "completed",
} as const satisfies Record<string, InternshipStatus>;

const persistedInternshipStatusSchema = z.union([
  internshipStatusSchema,
  z.literal("archived"),
]);

export const persistedInternshipDocumentSchema = z.object({
  internId: z.string().min(1),
  status: persistedInternshipStatusSchema,
  currentStage: internshipStageSchema.optional().default("onboarding"),
  startsAt: z.instanceof(Timestamp),
  endsAt: z.instanceof(Timestamp).optional(),
  createdAt: z.instanceof(Timestamp),
  createdBy: z.string().min(1),
  updatedAt: z.instanceof(Timestamp),
  updatedBy: z.string().min(1),
});

export type InternshipDocument = Omit<
  z.infer<typeof persistedInternshipDocumentSchema>,
  "status"
> & {
  status: InternshipStatus;
};

export function parseInternshipDocument(data: unknown): InternshipDocument {
  const document = persistedInternshipDocumentSchema.parse(data);
  const legacyStatus =
    legacyInternshipStatusMappings[
      document.status as keyof typeof legacyInternshipStatusMappings
    ];

  return {
    ...document,
    status: legacyStatus ?? document.status,
  };
}

export function parseInternshipLifecycle(lifecycle: unknown): InternshipLifecycle {
  return internshipLifecycleSchema.parse(lifecycle);
}

export function createInitialInternshipLifecycle(): InternshipLifecycle {
  return parseInternshipLifecycle(initialInternshipLifecycle);
}
