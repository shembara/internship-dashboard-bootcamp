export const internshipStatuses = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type InternshipStatus = (typeof internshipStatuses)[number]["value"];

export const internshipStages = [
  { value: "onboarding", label: "Onboarding" },
  { value: "firstJiraTasks", label: "First Jira tasks" },
  { value: "activeContribution", label: "Workflow" },
  { value: "independentWork", label: "Independent work" },
  { value: "finalReview", label: "Wrap-up" },
] as const;

export type InternshipStage = (typeof internshipStages)[number]["value"];

export type InternshipLifecycle = {
  status: InternshipStatus;
  currentStage: InternshipStage;
};

export const initialInternshipLifecycle = {
  status: "active",
  currentStage: "onboarding",
} as const satisfies InternshipLifecycle;

export type InternshipListItemDto = InternshipLifecycle & {
  id: string;
  internName: string;
  progressSummary?: import("@/lib/progress-hub/types").ProgressHubSummaryDto;
};

export type CurrentInternshipDto = InternshipLifecycle & {
  id: string;
  checklist?: import("@/lib/stage-checklists/types").StageChecklistDto;
  progressHub?: import("@/lib/progress-hub/types").InternProgressHubDto;
};
