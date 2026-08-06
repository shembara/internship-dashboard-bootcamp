export const internshipSkills = [
  { value: "technical", label: "Technical", maxPoints: 40 },
  { value: "productUnderstanding", label: "Product Understanding", maxPoints: 30 },
  { value: "communication", label: "Communication", maxPoints: 30 },
  { value: "collaboration", label: "Collaboration", maxPoints: 25 },
  { value: "ownership", label: "Ownership", maxPoints: 30 },
  { value: "planning", label: "Planning", maxPoints: 25 },
  { value: "codeQuality", label: "Code Quality", maxPoints: 35 },
  { value: "leadership", label: "Leadership", maxPoints: 20 },
] as const;

export type InternshipSkill = (typeof internshipSkills)[number]["value"];

export const customTaskPointLimits = { min: 1, max: 5 } as const;

export type SkillPointItem = {
  skills: readonly InternshipSkill[];
  weight: number;
  completed: boolean;
};

export type SkillProgressDto = {
  skill: InternshipSkill;
  label: string;
  completedPoints: number;
  maxPoints: number;
  percentage: number;
  totalPoints: number;
};
