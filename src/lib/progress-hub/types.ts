import type { InternshipStage } from "@/lib/internships/types";
import type { WeekPeriod } from "@/lib/progress-hub/week";

export type ReflectionState = "draft" | "submitted";
export type CheckInState = "draft" | "shared";
export type ActionItemStatus = "open" | "completed";
export type ActionOwnerType = "intern" | "mentor" | "manager";

export type WeeklyReflectionDto = {
  weekKey: string;
  state: ReflectionState;
  accomplishments: string;
  learnings: string;
  challenges: string;
  nextWeekFocus: string;
  supportNeeded: string;
  updatedAt: string;
  submittedAt?: string;
  canEdit: boolean;
};

export type MentorCheckInDto = {
  weekKey: string;
  state: CheckInState;
  progressSummary: string;
  strengthsObserved: string;
  areasToImprove: string;
  supportNeeded: string;
  nextWeekFocus: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  sharedAt?: string;
  canEdit: boolean;
};

export type AgendaItemDto = {
  id: string;
  text: string;
  resolved: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  canEdit: boolean;
  canResolve: boolean;
};

export type NoteDto = {
  id: string;
  weekKey: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

export type ActionItemDto = {
  id: string;
  title: string;
  description?: string;
  ownerType: ActionOwnerType;
  ownerUserId: string;
  dueDate: string;
  status: ActionItemStatus;
  overdue: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  canEdit: boolean;
  canToggle: boolean;
};

export type ActionOwnerOptionDto = {
  userId: string;
  ownerType: ActionOwnerType;
  label: string;
};

export type ProgressHubSummaryDto = {
  reflectionState: "draft" | "submitted" | "missing";
  mentorCheckInState: "draft" | "shared" | "missing";
  openActionItems: number;
  overdueActionItems: number;
  nextDueAction?: Pick<ActionItemDto, "id" | "title" | "dueDate">;
  unresolvedAgendaItems: number;
  latestSharedCheckInAt?: string;
  currentStage: InternshipStage;
  checklistCompleted: number;
  checklistTotal: number;
};

export type ProgressHubCapabilities = {
  canSaveReflection: boolean;
  canSaveCheckIn: boolean;
  canCreateAgendaItem: boolean;
  canCreateSharedNote: boolean;
  canCreatePrivateInternNote: boolean;
  canCreatePrivateMentorNote: boolean;
  canCreateActionItem: boolean;
};

export type InternProgressHubDto = {
  viewer: "intern";
  viewerUserId: string;
  currentWeek: WeekPeriod;
  summary: ProgressHubSummaryDto;
  reflection?: WeeklyReflectionDto;
  reflectionHistory: WeeklyReflectionDto[];
  mentorCheckIns: MentorCheckInDto[];
  agendaItems: AgendaItemDto[];
  sharedNotes: NoteDto[];
  privateInternNotes: NoteDto[];
  actionItems: ActionItemDto[];
  actionOwners: ActionOwnerOptionDto[];
  capabilities: ProgressHubCapabilities;
};

export type MentorProgressHubDto = {
  viewer: "mentor";
  viewerUserId: string;
  currentWeek: WeekPeriod;
  summary: ProgressHubSummaryDto;
  reflections: WeeklyReflectionDto[];
  checkIn?: MentorCheckInDto;
  checkInHistory: MentorCheckInDto[];
  agendaItems: AgendaItemDto[];
  sharedNotes: NoteDto[];
  privateMentorNotes: NoteDto[];
  actionItems: ActionItemDto[];
  actionOwners: ActionOwnerOptionDto[];
  capabilities: ProgressHubCapabilities;
};

export type ManagerProgressHubDto = {
  viewer: "manager";
  viewerUserId: string;
  currentWeek: WeekPeriod;
  summary: ProgressHubSummaryDto;
  reflections: WeeklyReflectionDto[];
  mentorCheckIns: MentorCheckInDto[];
  agendaItems: AgendaItemDto[];
  sharedNotes: NoteDto[];
  privateMentorNotes: NoteDto[];
  actionItems: ActionItemDto[];
  actionOwners: ActionOwnerOptionDto[];
  capabilities: ProgressHubCapabilities;
};

export type ProgressHubDto =
  InternProgressHubDto | MentorProgressHubDto | ManagerProgressHubDto;
