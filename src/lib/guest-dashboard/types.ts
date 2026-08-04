import type { InternshipStage, InternshipStatus } from "@/lib/internships/types";

export type GuestDashboardItem = {
  id: string;
  internName: string;
  status: InternshipStatus;
  currentStage: InternshipStage;
  startsAt: string;
  dayOfInternship: number;
  dayOfInternshipDate: string;
  project?: string;
  mentors: string[];
  managers: string[];
  requiredCompletedCount: number;
  requiredTotalCount: number;
  timeline: Array<{
    id: string;
    occurredAt: string;
    title: string;
    description?: string;
  }>;
  mentorFeedback?: {
    progressSummary: string;
    strengthsObserved: string;
    sharedAt?: string;
  };
  achievements: Array<{
    id: string;
    title: string;
    category: string;
    achievedOn: string;
  }>;
};

export type GuestDashboardDto = {
  items: GuestDashboardItem[];
  metrics: Record<"total" | "active" | "paused" | "completed", number>;
};
