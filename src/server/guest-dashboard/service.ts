import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  GuestDashboardDto,
  GuestDashboardItem,
} from "@/lib/guest-dashboard/types";
import {
  internshipStages,
  internshipStatuses,
  type InternshipStatus,
} from "@/lib/internships/types";
import { progressHubTimeZone } from "@/lib/progress-hub/week";
import { getStageChecklistTemplate } from "@/lib/stage-checklists/templates";
import { isCurrentManagerAssignment } from "@/server/assignments/domain";
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

function calendarDayDistance(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) /
    86_400_000,
  );
}

function isInternshipStatus(value: unknown): value is InternshipStatus {
  return internshipStatuses.some((status) => status.value === value);
}

type StatusChange = { status: InternshipStatus; changedAt: Timestamp };

function internshipDayCount(
  startsAt: Timestamp,
  currentStatus: InternshipStatus,
  endsAt: Timestamp | undefined,
  changes: StatusChange[],
) {
  let activeSince = dateInApplicationTimeZone(startsAt);
  let active = true;
  let count = 0;

  function countActiveDays(through: string, inclusive: boolean) {
    count += Math.max(0, calendarDayDistance(activeSince, through) + Number(inclusive));
  }

  for (const change of changes.sort(
    (a, b) => a.changedAt.toMillis() - b.changedAt.toMillis(),
  )) {
    if (change.changedAt.toMillis() < startsAt.toMillis()) continue;
    const changedOn = dateInApplicationTimeZone(change.changedAt);

    if (active && change.status === "paused") {
      countActiveDays(changedOn, false);
      active = false;
    } else if (!active && change.status === "active") {
      activeSince = changedOn;
      active = true;
    } else if (
      active &&
      (change.status === "completed" || change.status === "cancelled")
    ) {
      const finalDate =
        change.status === "completed" && endsAt
          ? dateInApplicationTimeZone(endsAt)
          : changedOn;
      countActiveDays(finalDate, true);
      active = false;
    } else if (
      !active &&
      (change.status === "completed" || change.status === "cancelled")
    ) {
      active = false;
    }
  }

  if (active) {
    const finalDate =
      currentStatus === "completed" && endsAt
        ? dateInApplicationTimeZone(endsAt)
        : currentStatus === "cancelled"
          ? activeSince
          : dateInApplicationTimeZone(Timestamp.now());
    countActiveDays(finalDate, currentStatus !== "paused");
  }

  return Math.max(1, count);
}

export async function getGuestDashboard(): Promise<GuestDashboardDto> {
  const internships = await adminFirestore.collection("internships").get();
  if (internships.empty) {
    return {
      items: [],
      metrics: { total: 0, active: 0, paused: 0, completed: 0 },
    };
  }

  // 1. Batch fetch all intern user documents at once
  const internIds = [
    ...new Set(
      internships.docs
        .map((d) => (d.data().internId as string) ?? "")
        .filter(Boolean),
    ),
  ];
  const internDocs = internIds.length
    ? await adminFirestore.getAll(
      ...internIds.map((id) => adminFirestore.collection("users").doc(id)),
    )
    : [];
  const internNames = new Map(
    internDocs.map((doc) => [
      doc.id,
      (doc.data()?.displayName as string) ?? "Unknown intern",
    ]),
  );

  type DraftItem = {
    item: GuestDashboardItem;
    teamId?: string;
    mentorUserId?: string;
    managerUserId?: string;
  };

  // 2. Fetch lightweight dashboard summary subcollections per internship in parallel
  const draftItems: DraftItem[] = await Promise.all(
    internships.docs.map(async (document) => {
      const internshipData = document.data();
      const internship = parseInternshipDocument(internshipData);
      const ref = document.ref;

      const [
        placements,
        teammates,
        managers,
        stage,
        stageProgress,
        checkIns,
        achievements,
        history,
      ] = await Promise.all([
        ref.collection("teamPlacements").get(),
        ref.collection("teammateAssignments").get(),
        ref.collection("managerAssignments").get(),
        ref.collection("stageProgress").doc(internship.currentStage).get(),
        ref.collection("stageProgress").limit(internshipStages.length).get(),
        // Defer heavy check-in history: fetch only the single latest shared feedback for dashboard summary
        ref
          .collection("mentorCheckIns")
          .orderBy("weekKey", "desc")
          .limit(1)
          .get(),
        // Defer complete 100-item history: fetch only top 10 recent achievements for top-level timeline context
        ref.collection("achievements").orderBy("achievedOn", "desc").limit(10).get(),
        ref.collection("statusHistory").orderBy("changedAt", "desc").get(),
      ]);

      const mentorIds = teammates.docs
        .map((entry) => entry.data())
        .filter((entry) => current(entry) && entry.responsibilities?.includes("mentor"))
        .map((entry) => entry.teammateUserId as string);

      const managerIds = managers.docs
        .map((entry) => entry.data())
        .filter((entry) => isCurrentManagerAssignment(entry))
        .map((entry) => entry.userId as string);

      const placement = placements.docs.map((entry) => entry.data()).find(current);

      const template = getStageChecklistTemplate(internship.currentStage);
      const required = template.items.filter((item) => item.type === "required");
      const completed = required.filter(
        (item) => stage.data()?.items?.[item.key]?.completed,
      ).length;

      const feedback = checkIns.docs[0]?.data();

      const statusChanges = history.docs.flatMap((entry) => {
        const data = entry.data();
        return data.changedAt instanceof Timestamp && isInternshipStatus(data.newStatus)
          ? [{ status: data.newStatus, changedAt: data.changedAt }]
          : [];
      });

      const startedAt =
        internshipData.createdAt instanceof Timestamp
          ? internshipData.createdAt
          : internship.startsAt;

      const dayOfInternship = internshipDayCount(
        startedAt,
        internship.status,
        internship.endsAt,
        statusChanges,
      );

      const timeline = [
        ...(() => {
          const occurredAt = iso(internshipData.createdAt);
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
      );

      const parsedAchievements = achievements.docs.flatMap((entry) => {
        const data = entry.data();
        return data.archivedAt
          ? []
          : [
            {
              id: entry.id,
              title: data.title as string,
              category: data.category as string,
              achievedOn: data.achievedOn as string,
            },
          ];
      });

      return {
        teamId: placement?.teamId as string | undefined,
        mentorUserId: mentorIds[0],
        managerUserId: managerIds[0],
        item: {
          id: document.id,
          internName: internNames.get(internship.internId) ?? "Unknown intern",
          status: internship.status,
          currentStage: internship.currentStage,
          startsAt: startedAt.toDate().toISOString(),
          dayOfInternship,
          requiredCompletedCount: completed,
          requiredTotalCount: required.length,
          timeline,
          mentorFeedback: feedback
            ? {
              progressSummary: feedback.progressSummary,
              strengthsObserved: feedback.strengthsObserved,
              sharedAt: iso(feedback.sharedAt),
            }
            : undefined,
          achievements: parsedAchievements,
        },
      };
    }),
  );

  // 3. Batch fetch team titles and staff names
  const teamIds = [
    ...new Set(
      draftItems.map((i) => i.teamId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const staffIds = [
    ...new Set(
      draftItems
        .flatMap((i) => [i.mentorUserId, i.managerUserId])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [teamDocs, staffDocs] = await Promise.all([
    teamIds.length
      ? adminFirestore.getAll(
        ...teamIds.map((id) => adminFirestore.collection("teams").doc(id)),
      )
      : [],
    staffIds.length
      ? adminFirestore.getAll(
        ...staffIds.map((id) => adminFirestore.collection("users").doc(id)),
      )
      : [],
  ]);

  const teamNames = new Map(
    teamDocs.map((doc) => [doc.id, (doc.data()?.title as string) ?? "Unknown team"]),
  );
  const staffNames = new Map(
    staffDocs.map((doc) => [
      doc.id,
      (doc.data()?.displayName as string) ?? "Unknown user",
    ]),
  );

  // 4. Resolve project, mentor, and manager names onto items
  const items: GuestDashboardItem[] = draftItems.map(
    ({ item, teamId, mentorUserId, managerUserId }) => ({
      ...item,
      project: teamId ? teamNames.get(teamId) : undefined,
      mentor: mentorUserId ? staffNames.get(mentorUserId) : undefined,
      manager: managerUserId ? staffNames.get(managerUserId) : undefined,
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
