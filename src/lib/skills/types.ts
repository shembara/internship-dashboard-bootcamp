export const internshipSkills = [
<<<<<<< HEAD
  { value: "technical", label: "Technical", maxPoints: 40 },
  { value: "productUnderstanding", label: "Product Understanding", maxPoints: 30 },
  { value: "communication", label: "Communication", maxPoints: 30 },
  { value: "collaboration", label: "Collaboration", maxPoints: 25 },
  { value: "ownership", label: "Ownership", maxPoints: 30 },
  { value: "planning", label: "Planning", maxPoints: 25 },
  { value: "codeQuality", label: "Code Quality", maxPoints: 35 },
  { value: "leadership", label: "Leadership", maxPoints: 20 },
=======
  { value: "technical", label: "Technical" },
  { value: "productUnderstanding", label: "Product Understanding" },
  { value: "communication", label: "Communication" },
  { value: "collaboration", label: "Collaboration" },
  { value: "ownership", label: "Ownership" },
  { value: "planning", label: "Planning" },
  { value: "codeQuality", label: "Code Quality" },
  { value: "leadership", label: "Leadership" },
>>>>>>> 64f05f94c6a5c89c9e0262ff1d7538b097ded4c4
] as const;

export type InternshipSkill = (typeof internshipSkills)[number]["value"];

<<<<<<< HEAD
export const customTaskPointLimits = { min: 1, max: 5 } as const;

export type SkillPointItem = {
  skills: readonly InternshipSkill[];
  weight: number;
  completed: boolean;
};

=======
>>>>>>> 64f05f94c6a5c89c9e0262ff1d7538b097ded4c4
export type SkillProgressDto = {
  skill: InternshipSkill;
  label: string;
  completedPoints: number;
<<<<<<< HEAD
  maxPoints: number;
  percentage: number;
=======
  totalPoints: number;
>>>>>>> 64f05f94c6a5c89c9e0262ff1d7538b097ded4c4
};
