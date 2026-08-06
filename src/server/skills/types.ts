import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { weekKeySchema, ratingsSchema } from "@/lib/skills/types";

export const skillRatingsDocumentSchema = z.object({
  weekKey: weekKeySchema,
  ratings: ratingsSchema,
  createdBy: z.string().min(1),
  createdAt: z.instanceof(Timestamp),
  updatedBy: z.string().min(1),
  updatedAt: z.instanceof(Timestamp),
});

export type SkillRatingsDocument = z.infer<typeof skillRatingsDocumentSchema>;
