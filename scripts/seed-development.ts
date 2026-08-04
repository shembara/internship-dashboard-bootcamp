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
    email: "manager@fluxon.com",
    displayName: "Maya Manager",
    roles: ["manager"],
  },
  {
    id: "mentor",
    uid: "development-mentor",
    email: "mentor@fluxon.com",
    displayName: "Morgan Mentor",
    roles: ["teammate"],
  },
  {
    id: "intern",
    uid: "development-intern",
    email: "intern@ucu.edu.ua",
    displayName: "Indira Intern",
    roles: ["intern"],
  },
  {
    id: "portfolio-active",
    uid: "development-portfolio-active",
    email: "portfolio-active@ucu.edu.ua",
    displayName: "Avery Active",
    roles: ["intern"],
  },
  {
    id: "portfolio-paused",
    uid: "development-portfolio-paused",
    email: "portfolio-paused@ucu.edu.ua",
    displayName: "Parker Paused",
    roles: ["intern"],
  },
  {
    id: "portfolio-completed",
    uid: "development-portfolio-completed",
    email: "portfolio-completed@ucu.edu.ua",
    displayName: "Casey Completed",
    roles: ["intern"],
  },
  {
    id: "portfolio-cancelled",
    uid: "development-portfolio-cancelled",
    email: "portfolio-cancelled@ucu.edu.ua",
    displayName: "Cameron Cancelled",
    roles: ["intern"],
  },
  {
    id: "portfolio-final-review",
    uid: "development-portfolio-final-review",
    email: "portfolio-final-review@ucu.edu.ua",
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
    email: "guest@ucu.edu.ua",
    emailVerified: true,
    password: developmentPassword,
  });
} catch {
  await auth.createUser({
    uid: "development-guest",
    displayName: "Gina Guest",
    email: "guest@ucu.edu.ua",
    emailVerified: true,
    password: developmentPassword,
  });
}

console.info("Seeded manager, mentor, intern, and guest development identities with updated domains.");

// Далі залишається без змін решта коду створення стажувань, тижневих рефлексій та чекінів...
