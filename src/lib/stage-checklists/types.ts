import type { InternshipLifecycle, InternshipStage } from "@/lib/internships/types";
import type { ChecklistItemType } from "@/lib/stage-checklists/templates";
import type { InternshipSkill, SkillProgressDto } from "@/lib/skills/types";

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
