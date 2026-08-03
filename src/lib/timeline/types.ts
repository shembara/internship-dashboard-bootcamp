export const timelineGroups = ["all", "achievements", "lifecycle", "weeklyProgress", "assignments", "actions", "status"] as const;
export type TimelineGroup = (typeof timelineGroups)[number];
export type TimelineEventDto = { id: string; type: string; occurredAt: string; title: string; description?: string };
export type TimelineDto = { events: TimelineEventDto[]; hasMore: boolean; page: number; group: TimelineGroup };
