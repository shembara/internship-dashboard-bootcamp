import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  GuestDashboardDto,
  GuestDashboardItem,
} from "@/lib/guest-dashboard/types";
import { internshipStages } from "@/lib/internships/types";
import { progressHubTimeZone } from "@/lib/progress-hub/week";
import { getStageChecklistTemplate } from "@/lib/stage-checklists/templates";
import { adminFirestore } from "@/server/firebase/admin";
import { parseInternshipDocument } from "@/server/internships/repository";

function iso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

function current(value: { startsAt?: Timestamp; endsAt?: Timestamp }) {
  const now = Date.now();
  return Boolean(
    value.startsAt &&
    value.startsAt.toMillis() <= now &&
    (!value.endsAt || value.endsAt.toMillis() > now),
  );
}

function dateInApplicationTimeZone(value: Timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value.toDate());
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day", string>;
  return `${values.year}-${values.month}-${values.day}`;
}

function inclusiveCalendarDayCount(startsAt: Timestamp, endsAt: Timestamp) {
  return Math.max(
    1,
    Math.round(
      (Date.parse(`${dateInApplicationTimeZone(endsAt)}T00:00:00.000Z`) -
        Date.parse(`${dateInApplicationTimeZone(startsAt)}T00:00:00.000Z`)) /
        86_400_000,
    ) + 1,
  );
}

export async function getGuestDashboard(): Promise<GuestDashboardDto> {
  const internships = await adminFirestore.collection("internships").get();
  const items = await Promise.all(
    internships.docs.map(async (document): Promise<GuestDashboardItem> => {
      const internship = parseInternshipDocument(document.data());
      const ref = document.ref;
      const [
        intern,
        placements,
        teammates,
        managers,
        stage,
        stageProgress,
        checkIns,
        achievements,
        history,
      ] = await Promise.all([
        adminFirestore.collection("users").doc(internship.internId).get(),
        ref.collection("teamPlacements").get(),
        ref.collection("teammateAssignments").get(),
        ref.collection("managerAssignments").get(),
        ref.collection("stageProgress").doc(internship.currentStage).get(),
        ref.collection("stageProgress").limit(internshipStages.length).get(),
        ref.collection("mentorCheckIns").orderBy("weekKey", "desc").limit(16).get(),
        ref.collection("achievements").orderBy("achievedOn", "desc").limit(100).get(),
        ref.collection("statusHistory").orderBy("changedAt", "desc").limit(50).get(),
      ]);
      const mentorIds = teammates.docs
        .map((entry) => entry.data())
        .filter((entry) => current(entry) && entry.responsibilities?.includes("mentor"))
        .map((entry) => entry.teammateUserId as string);
      const managerIds = managers.docs
        .map((entry) => entry.data())
        .filter(current)
        .map((entry) => entry.userId as string);
      const users = await adminFirestore.getAll(
        ...[...new Set([...mentorIds, ...managerIds])].map((id) =>
          adminFirestore.collection("users").doc(id),
        ),
      );
      const names = new Map(
        users.map((user) => [user.id, user.data()?.displayName as string | undefined]),
      );
      const placement = placements.docs.map((entry) => entry.data()).find(current);
      const team = placement
        ? await adminFirestore.collection("teams").doc(placement.teamId).get()
        : undefined;
      const template = getStageChecklistTemplate(internship.currentStage);
      const required = template.items.filter((item) => item.type === "required");
      const completed = required.filter(
        (item) => stage.data()?.items?.[item.key]?.completed,
      ).length;
      const feedback = checkIns.docs
        .map((entry) => entry.data())
        .find((entry) => entry.state === "shared");
      const dayOfInternshipDate =
        internship.status === "completed" && internship.endsAt
          ? internship.endsAt
          : Timestamp.now();
      return {
        id: document.id,
        internName:
          (intern.data()?.displayName as string | undefined) ?? "Unknown intern",
        status: internship.status,
        currentStage: internship.currentStage,
        startsAt: internship.startsAt.toDate().toISOString(),
        dayOfInternship: inclusiveCalendarDayCount(
          internship.startsAt,
          dayOfInternshipDate,
        ),
        dayOfInternshipDate: dayOfInternshipDate.toDate().toISOString(),
        project: team?.data()?.title as string | undefined,
        mentors: mentorIds.map((id) => names.get(id) ?? "Unknown mentor"),
        managers: managerIds.map((id) => names.get(id) ?? "Unknown manager"),
        requiredCompletedCount: completed,
        requiredTotalCount: required.length,
        timeline: [
          ...(() => {
            const occurredAt = iso(document.data().createdAt);
            return occurredAt
              ? [{ id: "internship:created", occurredAt, title: "Internship created" }]
              : [];
          })(),
          ...history.docs.flatMap((entry) => {
            const data = entry.data();
            const occurredAt = iso(data.changedAt);
            return occurredAt && typeof data.newStatus === "string"
              ? [
                  {
                    id: `status:${entry.id}`,
                    occurredAt,
                    title: `Internship ${data.newStatus}`,
                  },
                ]
              : [];
          }),
          ...stageProgress.docs.flatMap((entry) => {
            const data = entry.data();
            const occurredAt = iso(data.completedAt);
            return occurredAt
              ? [
                  {
                    id: `stage:${entry.id}`,
                    occurredAt,
                    title: `${entry.id} stage completed`,
                  },
                ]
              : [];
          }),
          ...achievements.docs.flatMap((entry) => {
            const data = entry.data();
            return !data.archivedAt &&
              typeof data.title === "string" &&
              typeof data.achievedOn === "string"
              ? [
                  {
                    id: `achievement:${entry.id}`,
                    occurredAt: `${data.achievedOn}T00:00:00.000Z`,
                    title: data.title,
                    ...(typeof data.category === "string"
                      ? { description: data.category }
                      : {}),
                  },
                ]
              : [];
          }),
        ].sort(
          (a, b) =>
            b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id),
        ),
        mentorFeedback: feedback
          ? {
              progressSummary: feedback.progressSummary,
              strengthsObserved: feedback.strengthsObserved,
              sharedAt: iso(feedback.sharedAt),
            }
          : undefined,
        achievements: achievements.docs.flatMap((entry) => {
          const data = entry.data();
          return data.archivedAt
            ? []
            : [
                {
                  id: entry.id,
                  title: data.title,
                  category: data.category,
                  achievedOn: data.achievedOn,
                },
              ];
        }),
      };
    }),
  );
  return {
    items: items.sort((a, b) => a.internName.localeCompare(b.internName)),
    metrics: {
      total: items.length,
      active: items.filter((item) => item.status === "active").length,
      paused: items.filter((item) => item.status === "paused").length,
      completed: items.filter((item) => item.status === "completed").length,
    },
  };
}
