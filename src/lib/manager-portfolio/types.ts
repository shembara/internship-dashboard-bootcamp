import type { ApplicationUserOption } from "@/lib/assignments/types";
import type { InternshipStage, InternshipStatus } from "@/lib/internships/types";
import type { ManagerProgressHubDto } from "@/lib/progress-hub/types";
import type { StageChecklistDto } from "@/lib/stage-checklists/types";

export const managerAttentionSignals = [
  {
    value: "reflectionMissing",
    label: "Reflection missing",
    severity: "warning",
    rule: "The current-week reflection has not been created or submitted.",
  },
  {
    value: "mentorCheckInMissing",
    label: "Mentor check-in missing",
    severity: "warning",
    rule: "The current-week mentor check-in has not been created.",
  },
  {
    value: "mentorCheckInDraft",
    label: "Mentor check-in draft",
    severity: "neutral",
    rule: "The current-week mentor check-in exists but has not been shared.",
  },
  {
    value: "overdueActions",
    label: "Overdue actions",
    severity: "critical",
    rule: "One or more open action items have a due date before today.",
  },
  {
    value: "stageReadyToComplete",
    label: "Stage ready to complete",
    severity: "positive",
    rule: "Every required checklist item in the current stage is complete.",
  },
  {
    value: "internshipPaused",
    label: "Internship paused",
    severity: "neutral",
    rule: "The internship status is paused.",
  },
  {
    value: "finalReviewCompletedAwaitingDecision",
    label: "Final review awaiting decision",
    severity: "warning",
    rule: "Final Review is complete and the internship has not been completed or cancelled.",
  },
  {
    value: "noCurrentMentor",
    label: "No current mentor",
    severity: "warning",
    rule: "No current teammate assignment has the mentor responsibility.",
  },
  {
    value: "endingSoon",
    label: "Ending soon",
    severity: "neutral",
    rule: "The expected end date is within the next 14 calendar days.",
  },
] as const;

export type ManagerAttentionSignalKey =
  (typeof managerAttentionSignals)[number]["value"];
export type ManagerAttentionSeverity =
  (typeof managerAttentionSignals)[number]["severity"];

export type ManagerAttentionSignal = {
  key: ManagerAttentionSignalKey;
  label: string;
  severity: ManagerAttentionSeverity;
  count?: number;
  date?: string;
};

export type ManagerPortfolioItemDto = {
  id: string;
  intern: { id: string; displayName: string; email: string };
  status: InternshipStatus;
  currentStage: InternshipStage;
  startsAt: string;
  endsAt?: string;
  currentStageChecklist: Pick<
    StageChecklistDto,
    | "requiredCompletedCount"
    | "requiredTotalCount"
    | "readyToComplete"
    | "isStageCompleted"
  >;
  mentorNames: string[];
  mentorUserIds: string[];
  currentPlacement?: { teamId: string; teamTitle: string };
  reflectionState: "draft" | "submitted" | "missing";
  mentorCheckInState: "draft" | "shared" | "missing";
  openActionItems: number;
  overdueActionItems: number;
  nextDueAction?: { title: string; dueDate: string };
  unresolvedAgendaItems: number;
  latestSharedActivityAt?: string;
  attentionSignals: ManagerAttentionSignal[];
};

export type ManagerPortfolioMetricsDto = {
  total: number;
  byStatus: Record<InternshipStatus, number>;
  byStage: Record<InternshipStage, number>;
  missingCurrentWeekReflections: number;
  missingOrDraftMentorCheckIns: number;
  withOverdueActionItems: number;
  stagesReadyToComplete: number;
};

export type ManagerPortfolioQuery = {
  search?: string;
  status?: InternshipStatus;
  stage?: InternshipStage;
  attention?: ManagerAttentionSignalKey;
  mentorId?: string;
  sort:
    "internName" | "startsAt" | "currentStage" | "latestActivity" | "overdueActions";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

export type ManagerPortfolioDto = {
  items: ManagerPortfolioItemDto[];
  metrics: ManagerPortfolioMetricsDto;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  mentorOptions: Array<Pick<ApplicationUserOption, "id" | "displayName">>;
  query: ManagerPortfolioQuery;
};

export type ManagerStatusHistoryDto = {
  id: string;
  previousStatus: InternshipStatus;
  newStatus: InternshipStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
};

export type ManagerAssignmentDto = {
  userId: string;
  displayName: string;
  startsAt?: string;
  endsAt?: string;
  current: boolean;
};

export type ManagerPortfolioDetailDto = {
  internship: ManagerPortfolioItemDto & {
    checklist: StageChecklistDto;
    progressHub: ManagerProgressHubDto;
  };
  managerAssignments: ManagerAssignmentDto[];
  statusHistory: ManagerStatusHistoryDto[];
  placements: Array<{
    id: string;
    teamId: string;
    teamTitle: string;
    startsAt: string;
    endsAt?: string;
    current: boolean;
    status: "current" | "scheduled" | "ended";
  }>;
  teammateAssignments: Array<{
    id: string;
    teammateUserId: string;
    teammateName: string;
    teamId: string;
    teamTitle: string;
    responsibilities: string[];
    startsAt: string;
    endsAt?: string;
    current: boolean;
    status: "current" | "scheduled" | "ended";
  }>;
  eligibleManagers: ApplicationUserOption[];
  eligibleTeammates: ApplicationUserOption[];
  capabilities: {
    canManage: boolean;
    canEditExpectedEnd: boolean;
    canManageManagers: boolean;
    canManagePlacements: boolean;
    canManageTeammates: boolean;
    canChangeStatus: boolean;
    canTransitionStatus: boolean;
  };
};
