export const internshipSkills = [
  { value: "technical", label: "Technical" },
  { value: "productUnderstanding", label: "Product Understanding" },
  { value: "communication", label: "Communication" },
  { value: "collaboration", label: "Collaboration" },
  { value: "ownership", label: "Ownership" },
  { value: "planning", label: "Planning" },
  { value: "codeQuality", label: "Code Quality" },
  { value: "leadership", label: "Leadership" },
] as const;

export type InternshipSkill = (typeof internshipSkills)[number]["value"];

export type SkillProgressDto = {
  skill: InternshipSkill;
  label: string;
  completedPoints: number;
  totalPoints: number;
};
