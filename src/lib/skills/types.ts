export const SKILLS = [
  "Technical Skills",
  "Problem Solving",
  "Communication",
  "Teamwork",
  "Autonomy",
] as const;

export type SkillName = (typeof SKILLS)[number];

export type SkillRatings = Record<SkillName, number>;

export type SkillRatingDTO = {
  weekKey: string;
  ratings: SkillRatings;
  updatedAt?: string;
};
