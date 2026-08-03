import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminFirestore } from "@/server/firebase/admin";
import type { AchievementListDto } from "@/lib/achievements/types";
import { internshipStages } from "@/lib/internships/types";
import type { TimelineDto, TimelineEventDto } from "@/lib/timeline/types";
import { recordFirestoreReadPath } from "@/server/firebase/read-diagnostics";

export async function getInternshipTimeline(
  internshipId: string,
  achievements: AchievementListDto,
  page = 1,
): Promise<TimelineDto> {
  recordFirestoreReadPath("timeline.load");
  const ref = adminFirestore.collection("internships").doc(internshipId);
  const [internship, statuses, progress] = await Promise.all([
    ref.get(),
    ref.collection("statusHistory").orderBy("changedAt", "desc").limit(50).get(),
    ref.collection("stageProgress").limit(internshipStages.length).get(),
  ]);
  const events: TimelineEventDto[] = [];
  if (internship.exists) {
    const data = internship.data()!;
    if (data.createdAt instanceof Timestamp)
      events.push({
        id: "internship:created",
        type: "internshipCreated",
        occurredAt: data.createdAt.toDate().toISOString(),
        title: "Internship created",
      });
  }
  achievements.achievements.forEach((achievement) =>
    events.push({
      id: `achievement:${achievement.id}`,
      type: "achievementAdded",
      occurredAt: `${achievement.achievedOn}T00:00:00.000Z`,
      title: achievement.title,
      description: achievement.category,
    }),
  );
  statuses.docs.forEach((document) => {
    const data = document.data();
    if (data.changedAt instanceof Timestamp && typeof data.newStatus === "string")
      events.push({
        id: `status:${document.id}`,
        type: `internship${data.newStatus[0].toUpperCase()}${data.newStatus.slice(1)}`,
        occurredAt: data.changedAt.toDate().toISOString(),
        title: `Internship ${data.newStatus}`,
      });
  });
  progress.docs.forEach((document) => {
    const data = document.data();
    if (data.completedAt instanceof Timestamp)
      events.push({
        id: `stage:${document.id}`,
        type: "stageCompleted",
        occurredAt: data.completedAt.toDate().toISOString(),
        title: `${document.id} stage completed`,
      });
  });
  const sorted = events.sort(
    (a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id),
  );
  const size = 25;
  const start = (Math.max(1, page) - 1) * size;
  return {
    events: sorted.slice(start, start + size),
    hasMore: start + size < sorted.length,
    page: Math.max(1, page),
    group: "all",
  };
}
