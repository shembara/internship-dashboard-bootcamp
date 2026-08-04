import nextEnvironment from "@next/env";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

import { initialInternshipLifecycle } from "../src/lib/internships/types";
import { getCurrentWeek } from "../src/lib/progress-hub/week";
import { stageChecklistTemplates } from "../src/lib/stage-checklists/templates";

nextEnvironment.loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_PROJECT_ID;
const authenticationMode = process.env.FIREBASE_AUTHENTICATION_MODE;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required to seed development data.");
}

if (authenticationMode !== "email-password-development") {
  throw new Error(
    "Seeding is allowed only when FIREBASE_AUTHENTICATION_MODE=email-password-development.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
const auth = getAuth(app);
const firestore = getFirestore(app);
const developmentPassword = "local-only-password";

const personas = [
  {
    id: "manager",
    uid: "development-manager",
    email: "manager@example.com",
    displayName: "Maya Manager",
    roles: ["manager"],
  },
  {
    id: "manager2",
    uid: "development-manager2",
    email: "manager@fluxon.com",
    displayName: "Sasha Manager",
    roles: ["manager"],
  },
  {
    id: "mentor",
    uid: "development-mentor",
    email: "mentor@example.com",
    displayName: "Morgan Mentor",
    roles: ["teammate"],
  },
  {
    id: "mentor2",
    uid: "development-mentor",
    email: "mentor@fluxon.com",
    displayName: "Sasha Mentor",
    roles: ["teammate"],
  },
  {
    id: "intern",
    uid: "development-intern",
    email: "intern@example.com",
    displayName: "Indira Intern",
    roles: ["intern"],
  },
  {
    id: "portfolio-active",
    uid: "development-portfolio-active",
    email: "portfolio-active@example.com",
    displayName: "Avery Active",
    roles: ["intern"],
  },
  {
    id: "portfolio-paused",
    uid: "development-portfolio-paused",
    email: "portfolio-paused@example.com",
    displayName: "Parker Paused",
    roles: ["intern"],
  },
  {
    id: "portfolio-completed",
    uid: "development-portfolio-completed",
    email: "portfolio-completed@example.com",
    displayName: "Casey Completed",
    roles: ["intern"],
  },
  {
    id: "portfolio-cancelled",
    uid: "development-portfolio-cancelled",
    email: "portfolio-cancelled@example.com",
    displayName: "Cameron Cancelled",
    roles: ["intern"],
  },
  {
    id: "portfolio-final-review",
    uid: "development-portfolio-final-review",
    email: "portfolio-final-review@example.com",
    displayName: "Finley Review",
    roles: ["intern"],
  },
] as const;

for (const persona of personas) {
  try {
    await auth.getUser(persona.uid);
    await auth.updateUser(persona.uid, {
      displayName: persona.displayName,
      email: persona.email,
      emailVerified: true,
      password: developmentPassword,
    });
  } catch {
    await auth.createUser({
      uid: persona.uid,
      displayName: persona.displayName,
      email: persona.email,
      emailVerified: true,
      password: developmentPassword,
    });
  }

  await firestore
    .collection("users")
    .doc(`development-${persona.id}`)
    .set(
      {
        active: true,
        displayName: persona.displayName,
        email: persona.email,
        identityState: "linked",
        identities: [{ provider: "firebase", subject: persona.uid }],
        roles: [...persona.roles],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

try {
  await auth.getUser("development-guest");
  await auth.updateUser("development-guest", {
    displayName: "Gina Guest",
    email: "guest@example.com",
    emailVerified: true,
    password: developmentPassword,
  });
} catch {
  await auth.createUser({
    uid: "development-guest",
    displayName: "Gina Guest",
    email: "guest@example.com",
    emailVerified: true,
    password: developmentPassword,
  });
}

console.info("Seeded manager, mentor, intern, and guest development identities.");

const internshipRef = firestore.collection("internships").doc("development-internship");
const teamRef = firestore.collection("teams").doc("development-team");
const startsAt = Timestamp.fromDate(new Date("2026-01-01T00:00:00.000Z"));

await teamRef.set(
  {
    title: "Development Team",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.set(
  {
    internId: "development-intern",
    ...initialInternshipLifecycle,
    startsAt,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.collection("managerAssignments").doc("development-manager").set(
  {
    userId: "development-manager",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef.collection("teamPlacements").doc("development-placement").set(
  {
    teamId: teamRef.id,
    startsAt,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-manager",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-manager",
  },
  { merge: true },
);
await internshipRef
  .collection("teammateAssignments")
  .doc("development-mentor-assignment")
  .set(
    {
      teammateUserId: "development-mentor",
      teamId: teamRef.id,
      responsibilities: ["mentor"],
      startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );

const currentWeek = getCurrentWeek();
const previousWeekStart = new Date(`${currentWeek.startDate}T00:00:00.000Z`);
previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
const previousWeek = getCurrentWeek(previousWeekStart);
const previousWeekStartTimestamp = Timestamp.fromDate(
  new Date(`${previousWeek.startDate}T00:00:00.000Z`),
);
const currentDueDate = Timestamp.fromDate(
  new Date(`${currentWeek.endDate}T00:00:00.000Z`),
);
const overdueDueDate = Timestamp.fromDate(
  new Date(`${previousWeek.endDate}T00:00:00.000Z`),
);

await internshipRef.collection("weeklyReflections").doc(currentWeek.key).set(
  {
    internshipId: internshipRef.id,
    weekKey: currentWeek.key,
    state: "draft",
    accomplishments: "Completed the initial dashboard integration work.",
    learnings: "Learned how the internship lifecycle services enforce access.",
    challenges: "Clarifying the boundaries between operational notes and feedback.",
    nextWeekFocus: "Finish the current onboarding checklist items.",
    supportNeeded: "A short review of the current priorities would help.",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-intern",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-intern",
  },
  { merge: true },
);
await internshipRef.collection("weeklyReflections").doc(previousWeek.key).set(
  {
    internshipId: internshipRef.id,
    weekKey: previousWeek.key,
    state: "submitted",
    accomplishments: "Set up the local project and completed the first walkthrough.",
    learnings: "Learned the team pull request and review workflow.",
    challenges: "Finding the best entry point for unfamiliar code paths.",
    nextWeekFocus: "Take on the first small Jira task.",
    supportNeeded: "Pairing time for the first task breakdown.",
    createdAt: previousWeekStartTimestamp,
    createdBy: "development-intern",
    updatedAt: previousWeekStartTimestamp,
    updatedBy: "development-intern",
    submittedAt: previousWeekStartTimestamp,
    submittedBy: "development-intern",
  },
  { merge: true },
);
await internshipRef.collection("mentorCheckIns").doc(currentWeek.key).set(
  {
    internshipId: internshipRef.id,
    weekKey: currentWeek.key,
    state: "draft",
    progressSummary:
      "The intern is building confidence with the application structure.",
    strengthsObserved: "Thoughtful questions and steady follow-through on setup tasks.",
    areasToImprove: "Practice proposing an implementation approach before coding.",
    supportNeeded: "Keep the first task scope small and review it together.",
    nextWeekFocus: "Complete the first small contribution with a supported review.",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-mentor",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("mentorCheckIns").doc(previousWeek.key).set(
  {
    internshipId: internshipRef.id,
    weekKey: previousWeek.key,
    state: "shared",
    progressSummary:
      "The onboarding walkthrough and environment setup are progressing well.",
    strengthsObserved: "Prepared questions and clear communication.",
    areasToImprove: "Continue building familiarity with the repository structure.",
    supportNeeded: "Schedule a short architecture discussion before the first task.",
    nextWeekFocus: "Choose and plan the first Jira task.",
    createdAt: previousWeekStartTimestamp,
    createdBy: "development-mentor",
    updatedAt: previousWeekStartTimestamp,
    updatedBy: "development-mentor",
    sharedAt: previousWeekStartTimestamp,
    sharedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("oneToOneAgenda").doc("seed-open-topic").set(
  {
    text: "Discuss the first task breakdown and questions for the mentor.",
    resolved: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-intern",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-intern",
  },
  { merge: true },
);
await internshipRef.collection("oneToOneAgenda").doc("seed-resolved-topic").set(
  {
    text: "Confirm access to the development environment.",
    resolved: true,
    createdAt: previousWeekStartTimestamp,
    createdBy: "development-mentor",
    updatedAt: previousWeekStartTimestamp,
    updatedBy: "development-mentor",
    resolvedAt: previousWeekStartTimestamp,
    resolvedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("oneToOneNotes").doc("seed-shared-note").set(
  {
    weekKey: currentWeek.key,
    text: "Agreed to review the proposed approach before implementation starts.",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-mentor",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("privateInternNotes").doc("seed-intern-note").set(
  {
    weekKey: currentWeek.key,
    text: "Remember to bring the repository questions to the next one-to-one.",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-intern",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-intern",
  },
  { merge: true },
);
await internshipRef.collection("mentorPrivateNotes").doc("seed-mentor-note").set(
  {
    weekKey: currentWeek.key,
    text: "Check whether the first task has a suitably small scope before assigning it.",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-mentor",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("actionItems").doc("seed-open-action").set(
  {
    title: "Prepare a proposed implementation approach",
    ownerType: "intern",
    ownerUserId: "development-intern",
    dueDate: currentDueDate,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "development-intern",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "development-intern",
  },
  { merge: true },
);
await internshipRef.collection("actionItems").doc("seed-overdue-action").set(
  {
    title: "Review the project glossary",
    ownerType: "intern",
    ownerUserId: "development-intern",
    dueDate: overdueDueDate,
    status: "open",
    createdAt: previousWeekStartTimestamp,
    createdBy: "development-mentor",
    updatedAt: previousWeekStartTimestamp,
    updatedBy: "development-mentor",
  },
  { merge: true },
);
await internshipRef.collection("actionItems").doc("seed-completed-action").set(
  {
    title: "Join the team communication channels",
    ownerType: "intern",
    ownerUserId: "development-intern",
    dueDate: previousWeekStartTimestamp,
    status: "completed",
    createdAt: previousWeekStartTimestamp,
    createdBy: "development-mentor",
    updatedAt: previousWeekStartTimestamp,
    updatedBy: "development-intern",
    completedAt: previousWeekStartTimestamp,
    completedBy: "development-intern",
  },
  { merge: true },
);

const scenarioInternships = [
  {
    id: "portfolio-active",
    internId: "development-portfolio-active",
    status: "active",
    currentStage: "activeContribution",
    mentor: true,
    readyToComplete: true,
    finalReviewComplete: false,
  },
  {
    id: "portfolio-paused",
    internId: "development-portfolio-paused",
    status: "paused",
    currentStage: "independentWork",
    mentor: true,
    readyToComplete: false,
    finalReviewComplete: false,
  },
  {
    id: "portfolio-completed",
    internId: "development-portfolio-completed",
    status: "completed",
    currentStage: "finalReview",
    mentor: true,
    readyToComplete: false,
    finalReviewComplete: true,
  },
  {
    id: "portfolio-cancelled",
    internId: "development-portfolio-cancelled",
    status: "cancelled",
    currentStage: "firstJiraTasks",
    mentor: false,
    readyToComplete: false,
    finalReviewComplete: false,
  },
  {
    id: "portfolio-final-review",
    internId: "development-portfolio-final-review",
    status: "active",
    currentStage: "finalReview",
    mentor: false,
    readyToComplete: false,
    finalReviewComplete: true,
  },
] as const;

for (const scenario of scenarioInternships) {
  const ref = firestore.collection("internships").doc(`development-${scenario.id}`);
  await ref.set(
    {
      internId: scenario.internId,
      status: scenario.status,
      currentStage: scenario.currentStage,
      startsAt,
      ...(scenario.status === "completed" || scenario.status === "cancelled"
        ? { endsAt: previousWeekStartTimestamp }
        : {}),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );
  await ref.collection("managerAssignments").doc("development-manager").set(
    {
      userId: "development-manager",
      startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );
  await ref.collection("teamPlacements").doc("development-placement").set(
    {
      teamId: teamRef.id,
      startsAt,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );
  if (scenario.mentor) {
    await ref
      .collection("teammateAssignments")
      .doc("development-mentor-assignment")
      .set(
        {
          teammateUserId: "development-mentor",
          teamId: teamRef.id,
          responsibilities: ["mentor"],
          startsAt,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: "development-manager",
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "development-manager",
        },
        { merge: true },
      );
  }
  const template = stageChecklistTemplates.find(
    (candidate) => candidate.stage === scenario.currentStage,
  )!;
  const completeRequired = Boolean(
    scenario.finalReviewComplete || scenario.readyToComplete,
  );
  await ref
    .collection("stageProgress")
    .doc(scenario.currentStage)
    .set(
      {
        stage: scenario.currentStage,
        items: Object.fromEntries(
          template.items.map((item) => [
            item.key,
            { completed: completeRequired && item.type === "required" },
          ]),
        ),
        startedAt: startsAt,
        ...(completeRequired
          ? {
            completedAt: previousWeekStartTimestamp,
            completedBy: "development-manager",
          }
          : {}),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: "development-manager",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "development-manager",
      },
      { merge: true },
    );
  await ref.collection("statusHistory").doc("seed-status-history").set(
    {
      previousStatus: "active",
      newStatus: scenario.status,
      changedAt: previousWeekStartTimestamp,
      changedBy: "development-manager",
    },
    { merge: true },
  );
}

await firestore
  .collection("internships")
  .doc("development-portfolio-active")
  .collection("teammateAssignments")
  .doc("development-historical-teammate-assignment")
  .set(
    {
      teammateUserId: "development-mentor",
      teamId: teamRef.id,
      responsibilities: ["projectManager"],
      startsAt: Timestamp.fromDate(new Date("2025-12-01T00:00:00.000Z")),
      endsAt: Timestamp.fromDate(new Date("2025-12-31T23:59:59.999Z")),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "development-manager",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "development-manager",
    },
    { merge: true },
  );

console.info(
  "Seeded development internships, lifecycle, Progress Hub, and manager portfolio data.",
);
