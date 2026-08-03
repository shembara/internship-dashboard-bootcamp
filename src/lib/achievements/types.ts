import type { InternshipStage } from "@/lib/internships/types";

export const achievementCategories = [
  { value: "delivery", label: "Delivery" },
  { value: "learning", label: "Learning" },
  { value: "collaboration", label: "Collaboration" },
  { value: "ownership", label: "Ownership" },
  { value: "communication", label: "Communication" },
  { value: "milestone", label: "Milestone" },
] as const;

export type AchievementCategory = (typeof achievementCategories)[number]["value"];

export type AchievementDto = {
  id: string;
  title: string;
  description?: string;
  category: AchievementCategory;
  achievedOn: string;
  linkedStage?: InternshipStage;
  evidenceUrl?: string;
  author: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
};

export type AchievementListDto = {
  achievements: AchievementDto[];
  canCreate: boolean;
  readOnly: boolean;
};
