import type { InternshipLifecycle, InternshipStage } from "@/lib/internships/types";
import type { ChecklistItemType } from "@/lib/stage-checklists/templates";

export type StageChecklistItemDto = {
  key: string;
  label: string;
  type: ChecklistItemType;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  canComplete: boolean;
};

export type StageChecklistDto = {
  stage: InternshipStage;
  stageLabel: string;
  requiredItems: StageChecklistItemDto[];
  recommendedItems: StageChecklistItemDto[];
  requiredCompletedCount: number;
  requiredTotalCount: number;
  readyToComplete: boolean;
  isStageCompleted: boolean;
  completedAt?: string;
  canCompleteStage: boolean;
};

export type InternshipLifecycleChecklistDto = InternshipLifecycle & {
  checklist: StageChecklistDto;
};
