import { z } from "zod";

export const SKILLS = [
  "Technical understanding",
  "Code quality",
  "Debugging",
  "Technical decision-making",
  "Communication",
  "Ownership",
  "Understanding requirements",
] as const;

export type Skill = (typeof SKILLS)[number];

// Rating object with each skill from SKILLS mapped to 0-100 number
export const ratingsSchema = z.object(
  Object.fromEntries(
    SKILLS.map((s) => [s, z.number().min(0).max(100)]) as [string, z.ZodTypeAny][],
  ) as Record<string, z.ZodTypeAny>,
);

export type Ratings = z.infer<typeof ratingsSchema>;

export const weekKeySchema = z.string().regex(/^\d{4}-W\d{2}$/);

export type SkillRatings = Record<Skill, number>;
