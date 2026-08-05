import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  BookOpenCheck,
  CalendarCheck,
  CheckSquare,
  Clock3,
  FileClock,
  FileText,
  FolderOpen,
  Handshake,
  History,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  NotebookPen,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

export type SidebarRole = "manager" | "intern" | "teammate";

export type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
};

export type SidebarGroup = {
  label: string;
  icon: LucideIcon;
  items: SidebarLink[];
};

export type RoleSidebarConfig = {
  label: string;
  general: SidebarGroup[];
  workspace?: SidebarGroup[];
};

export const internSidebarConfig: RoleSidebarConfig = {
  label: "Intern workspace",
  general: [
    {
      label: "Overview & Progress",
      icon: LayoutDashboard,
      items: [
        { label: "Weekly overview", href: "/intern#weekly-overview", icon: FileText },
        { label: "Internship timeline", href: "/intern#internship-timeline", icon: Clock3 },
        { label: "Achievements", href: "/intern#achievements", icon: Award },
      ],
    },
    {
      label: "Weekly Reflection",
      icon: NotebookPen,
      items: [
        { label: "My Weekly Reflection", href: "/intern#my-weekly-reflection", icon: NotebookPen },
        { label: "1:1 Preparation", href: "/intern#one-on-one-preparation", icon: CalendarCheck },
      ],
    },
    {
      label: "1:1 & Collaboration",
      icon: Handshake,
      items: [
        { label: "Shared 1:1 Agenda", href: "/intern#shared-one-on-one-agenda", icon: Users },
        { label: "Shared Notes", href: "/intern#shared-notes", icon: FileText },
        { label: "Action Items", href: "/intern#action-items", icon: CheckSquare },
        { label: "Feedback", href: "/intern#feedback", icon: MessageSquareText },
      ],
    },
    {
      label: "Personal Workspace",
      icon: Lock,
      items: [
        { label: "My Private Notes", href: "/intern#my-private-notes", icon: Lock },
        { label: "History", href: "/intern#history", icon: History },
      ],
    },
  ],
};

export const managerSidebarConfig: RoleSidebarConfig = {
  label: "Manager workspace",
  general: [],
  workspace: [
    {
      label: "Overview & Lifecycle",
      icon: FolderOpen,
      items: [
        { label: "Stage checklist", href: "stage-checklist", icon: CheckSquare },
        { label: "Internship status", href: "internship-status", icon: Activity },
      ],
    },
    {
      label: "Progress & Reflection",
      icon: LayoutDashboard,
      items: [
        { label: "Weekly overview", href: "weekly-overview", icon: FileText },
        { label: "Intern reflections", href: "intern-reflections", icon: MessageSquareText },
        { label: "Achievements", href: "achievements", icon: Award },
        { label: "Internship timeline", href: "internship-timeline", icon: Clock3 },
        { label: "History", href: "history", icon: History },
      ],
    },
    {
      label: "1:1 & Collaboration",
      icon: Handshake,
      items: [
        { label: "Shared 1:1 agenda", href: "shared-one-on-one-agenda", icon: Users },
        { label: "Shared notes", href: "shared-notes", icon: FileText },
        { label: "Mentor-private notes", href: "mentor-private-notes", icon: ShieldCheck },
        { label: "Action items", href: "action-items", icon: CheckSquare },
        { label: "Feedback cycles", href: "feedback-cycles", icon: MessageSquareText },
      ],
    },
    {
      label: "Team & Administration",
      icon: Users,
      items: [
        { label: "Assignments", href: "assignments", icon: UserCheck },
        { label: "Manage assignments", href: "managers", icon: Settings },
      ],
    },
  ],
};

export const mentorSidebarConfig: RoleSidebarConfig = {
  label: "Mentor workspace",
  general: [
    {
      label: "Teammate workspace",
      icon: Handshake,
      items: [
        { label: "Internships", href: "/teammate", icon: BookOpenCheck },
      ],
    },
  ],
  workspace: [
    {
      label: "Overview & Lifecycle",
      icon: FolderOpen,
      items: [
        { label: "Internship lifecycle", href: "#internship-lifecycle", icon: Clock3 },
        { label: "Stage checklist", href: "#stage-checklist-heading", icon: CheckSquare },
      ],
    },
    {
      label: "Progress & Reflection",
      icon: LayoutDashboard,
      items: [
        { label: "Weekly overview", href: "#weekly-overview", icon: FileText },
        { label: "Intern reflections", href: "#intern-reflections", icon: MessageSquareText },
        { label: "Achievements", href: "#achievements", icon: Award },
        { label: "Internship timeline", href: "#internship-timeline", icon: Clock3 },
        { label: "History", href: "#history", icon: History },
      ],
    },
    {
      label: "1:1 & Mentorship",
      icon: Handshake,
      items: [
        { label: "Mentor weekly check-in", href: "#mentor-weekly-check-in", icon: ShieldCheck },
        { label: "Shared 1:1 agenda", href: "#shared-one-on-one-agenda", icon: Users },
        { label: "1:1 Preparation", href: "#one-on-one-preparation", icon: CalendarCheck },
        { label: "Action items", href: "#action-items", icon: CheckSquare },
        { label: "Shared notes", href: "#shared-notes", icon: FileText },
        { label: "Mentor-private notes", href: "#mentor-private-notes", icon: Lock },
      ],
    },
    {
      label: "Feedback & Evaluation",
      icon: FileClock,
      items: [
        { label: "Feedback cycles", href: "#feedback", icon: MessageSquareText },
        { label: "Status history", href: "#status-history", icon: History },
      ],
    },
  ],
};

export const sidebarConfigByRole: Partial<Record<SidebarRole, RoleSidebarConfig>> = {
  intern: internSidebarConfig,
  manager: managerSidebarConfig,
  teammate: mentorSidebarConfig,
};

export const sidebarRoles: SidebarRole[] = ["manager", "intern", "teammate"];

export function isSidebarRole(role: string): role is SidebarRole {
  return sidebarRoles.includes(role as SidebarRole);
}
