import type { InternshipLifecycle, InternshipStage } from "@/lib/internships/types";
import type { ChecklistItemType } from "@/lib/stage-checklists/templates";
import type { InternshipSkill } from "@/lib/skills/types";

export type StageChecklistItemDto = {
  key: string;
  label: string;
  type: ChecklistItemType;
  skills: readonly InternshipSkill[];
  weight: number;
  status: "todo" | "inProgress" | "done";
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  canComplete: boolean;
  canDelete: boolean;
};

export const skillProgressAreas = [
  { value: "technical", label: "Technical" },
  { value: "communication", label: "Communication" },
  { value: "ownership", label: "Ownership" },
  { value: "codeQuality", label: "Code quality" },
  { value: "productUnderstanding", label: "Product understanding" },
  { value: "collaboration", label: "Collaboration" },
  { value: "planning", label: "Planning" },
  { value: "leadership", label: "Leadership" },
] as const;

export type SkillProgressArea = (typeof skillProgressAreas)[number]["value"];

export type SkillProgressDto = {
  area: SkillProgressArea;
  completed: number;
  total: number;
};

export type StageChecklistDto = {
  stage: InternshipStage;
  stageLabel: string;
  requiredItems: StageChecklistItemDto[];
  recommendedItems: StageChecklistItemDto[];
  items: StageChecklistItemDto[];
  requiredCompletedCount: number;
  requiredTotalCount: number;
  readyToComplete: boolean;
  isStageCompleted: boolean;
  completedAt?: string;
  canCompleteStage: boolean;
  canAddTasks: boolean;
  latestReviewRequest?: string;
  reviewStatus: "active" | "underReview" | "completed";
  canViewAllStages: boolean;
  skillProgress: SkillProgressDto[];
};

export type InternshipLifecycleChecklistDto = InternshipLifecycle & {
  checklist: StageChecklistDto;
};
