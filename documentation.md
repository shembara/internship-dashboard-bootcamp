# Fluxon Internship Dashboard — Project Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Environment Configuration](#5-environment-configuration)
6. [Authentication](#6-authentication)
7. [Authorization](#7-authorization)
8. [Domain Model](#8-domain-model)
   - 8.1 [Application Users](#81-application-users)
   - 8.2 [Internships (Lifecycle: Status & Stage)](#82-internships-lifecycle-status--stage)
   - 8.3 [Stage Checklists & Skills](#83-stage-checklists--skills)
   - 8.4 [Assignments (Managers, Teammates, Team Placements)](#84-assignments-managers-teammates-team-placements)
   - 8.5 [Progress Hub (Weekly Reflections & Check-ins)](#85-progress-hub-weekly-reflections--check-ins)
   - 8.6 [Achievements](#86-achievements)
   - 8.7 [Manager Portfolio](#87-manager-portfolio)
   - 8.8 [Timeline](#88-timeline)
   - 8.9 [Guest Dashboard](#89-guest-dashboard)
   - 8.10 [Reports (PDF)](#810-reports-pdf)
9. [Firestore Data Model](#9-firestore-data-model)
10. [Firestore Security Rules](#10-firestore-security-rules)
11. [Server Layer Reference](#11-server-layer-reference)
12. [HTTP API Reference](#12-http-api-reference)
13. [Frontend Application Structure](#13-frontend-application-structure)
14. [UI Components & Design System](#14-ui-components--design-system)
15. [Sidebar & Navigation](#15-sidebar--navigation)
16. [Testing Strategy](#16-testing-strategy)
17. [Scripts](#17-scripts)
18. [Local Development Setup](#18-local-development-setup)
19. [Firebase Emulator Workflow](#19-firebase-emulator-workflow)
20. [Build, Validation & CI](#20-build-validation--ci)
21. [Deployment (Firebase App Hosting)](#21-deployment-firebase-app-hosting)
22. [Security Considerations](#22-security-considerations)
23. [Coding Conventions (AGENTS.md)](#23-coding-conventions-agentsmd)
24. [Troubleshooting](#24-troubleshooting)
25. [Glossary](#25-glossary)

---

## 1. Overview

The **Fluxon Internship Dashboard** (package name `fluxon-internship-dashboard`) is a
Next.js web application used to run and track a company internship program end to
end. It is built as a bootcamp/training reference project: a realistic, full-stack
Next.js + Firebase application that demonstrates authentication, role-based
authorization, server-only data access, Firestore modeling, and a componentized
React UI.

The application supports four kinds of participants, referred to throughout the
codebase as **roles**:

| Role       | Description                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `manager`  | Runs the internship program: creates internships, assigns mentors/managers, tracks a portfolio of interns, changes internship status. |
| `teammate` | A mentor, project manager, or team lead attached to one or more internships. Referred to in the UI as "Mentor workspace". |
| `intern`   | The person doing the internship. Tracks their own checklist, weekly reflection, achievements, and 1:1 collaboration with their mentor/manager. |
| `guest`    | A signed-in user without a specific role-based account — sees a simplified, read-mostly dashboard. |

A single Firebase-authenticated user (`AuthenticatedUser`) is mapped to an
**application user** record (`AppUser`) stored in Firestore, which carries an
array of `roles`. A user can hold more than one role at a time (for example, a
person can be both a `manager` and a `teammate`).

Core capabilities:

- Internship lifecycle tracking through 5 stages (Onboarding → First Jira tasks →
  Workflow → Independent work → Wrap-up) and 4 statuses (active, paused,
  completed, cancelled).
- Stage checklists with required/recommended tasks, skill-point scoring, and a
  review workflow between intern/mentor/manager.
- A weekly "Progress Hub" containing intern reflections, mentor check-ins, a
  shared 1:1 agenda, shared and private notes, and action items.
- Achievements (a running record of the intern's accomplishments).
- A manager "portfolio" view across all internships with computed attention
  signals (e.g., "Reflection missing", "Overdue actions") and search/sort/filter.
- Manager and teammate (mentor) assignment management, including team
  placements and per-teammate responsibilities (mentor / project manager /
  team lead).
- A downloadable PDF intern report (built with `@react-pdf/renderer`).
- A read-only timeline view aggregating internship events.
- A guest dashboard for casual/unauthenticated-but-signed-in visibility.

---

## 2. Technology Stack

| Concern                | Choice                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| Framework               | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| UI library               | React 19.2                                                             |
| Language                 | TypeScript 5.9 (strict mode)                                          |
| Styling                  | Tailwind CSS v4 + `class-variance-authority` + `tailwind-merge`       |
| Component primitives     | `shadcn` (style: `base-nova`), `@base-ui/react`, `lucide-react` icons |
| Backend/data             | Firebase (Firestore + Firebase Authentication)                        |
| Server-side Firebase SDK | `firebase-admin`                                                       |
| Client-side Firebase SDK | `firebase` (modular JS SDK)                                            |
| Validation               | `zod` (schemas for all inputs, DTOs, and Firestore documents)         |
| PDF generation            | `@react-pdf/renderer`                                                  |
| Unit/integration testing | `vitest` + `@testing-library/react` + `jsdom`                          |
| E2E testing               | `@playwright/test`                                                     |
| Linting/formatting        | ESLint 9 (`eslint-config-next`), Prettier 3                            |
| Package manager            | npm (lockfile committed)                                               |
| Hosting                   | Firebase App Hosting                                                   |
| Local backend emulation    | Firebase Emulator Suite (Auth + Firestore)                             |

Minimum Node.js version: `^20.19.0 || >=22.13.0` (the repository pins `22.13.0`
in `.nvmrc`).

---

## 3. High-Level Architecture

The application follows a **layered, feature-oriented** architecture, formalized
in `AGENTS.md` (see [Section 23](#23-coding-conventions-agentsmd)). Each
"feature" (achievements, assignments, progress-hub, stage-checklists, etc.) has
code split across four layers:

```
┌───────────────────────────────────────────────────────────────────┐
│ src/app/**                                                        │
│   Next.js App Router: pages, layouts, and route handlers (API).   │
│   Thin — resolves auth/authorization, calls server services,      │
│   passes DTOs to feature components.                              │
└───────────────────────────────────────────────────────────────────┘
                 │ uses                              │ uses
                 ▼                                    ▼
┌────────────────────────────────┐   ┌──────────────────────────────────┐
│ src/features/{feature}/        │   │ src/server/{feature}/            │
│   Client & server React        │   │   Server-only domain logic,      │
│   components: forms, cards,    │   │   Firestore reads/writes, Zod    │
│   dashboards. Consume DTOs     │   │   validation, HTTP helpers.      │
│   from src/lib.                │   │   Never imported by the client.  │
└────────────────────────────────┘   └──────────────────────────────────┘
                 │ types from                          │ types from
                 ▼                                      ▼
┌───────────────────────────────────────────────────────────────────┐
│ src/lib/{feature}/                                                 │
│   Browser-safe shared DTOs, constants (labels+values together),   │
│   pure helper functions (date/week math, formatting, theming).    │
└───────────────────────────────────────────────────────────────────┘
```

Key architectural principles observed in the code:

- **Server-only boundary.** Every module that touches Firestore or
  `firebase-admin` begins with `import "server-only";`, which makes Next.js
  fail the build if such a module is ever imported into client-bundled code.
  Firestore is *never* accessed directly from the browser — Firestore
  Security Rules deny all direct client reads/writes (see
  [Section 10](#10-firestore-security-rules)), and Firestore integration
  tests explicitly assert that a client SDK read is rejected with
  `permission-denied`.
- **DTOs, not raw documents.** Server services shape Firestore documents into
  typed Data Transfer Objects (defined in `src/lib/{feature}/types.ts`) before
  handing data to React components. Components never see Firestore-specific
  types (`Timestamp`, etc.) — everything crossing the server/client boundary is
  a plain JSON-serializable DTO with ISO date strings.
- **Capability flags on DTOs.** Instead of components re-deriving permission
  logic, DTOs embed booleans such as `canEdit`, `canArchive`, `canComplete`,
  `readOnly`, computed once on the server based on the viewer's role and the
  entity's state.
- **Zod everywhere.** Input parsing (API request bodies), Firestore document
  parsing, and environment-variable parsing all go through Zod schemas, so
  invalid data fails fast with a typed error.
- **React Server Components by default.** Route `page.tsx` files are async
  Server Components that call `require*Page()` auth guards and server
  services directly (no client-side data fetching / no REST round trip for
  the initial render). Interactive pieces (forms, buttons that mutate data)
  are separate `"use client"` components in `src/features/**` that call the
  route handlers in `src/app/api/**`.
- **Transactions for multi-document invariants.** Mutations that must keep
  several Firestore documents consistent (e.g., closing a teammate assignment
  while validating manager access) run inside `adminFirestore.runTransaction`.

---

## 4. Directory Structure

```
internship-dashboard-bootcamp/
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
├── e2e/                             # Playwright end-to-end specs
│   └── sign-in.spec.ts
├── scripts/
│   ├── deploy-firestore-indexes.ts # Deploys firestore.indexes.json via Admin SDK/CLI
│   ├── deploy-firestore-rules.ts   # Deploys firestore.rules
│   └── seed-development.ts         # Creates dev Auth users + Firestore sample data
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (authenticated)/        # Route group requiring a signed-in session
│   │   │   ├── forbidden/          # 403-style page shown on authorization failure
│   │   │   ├── guest/              # Guest dashboard route
│   │   │   ├── intern/             # Intern workspace route
│   │   │   ├── manager/            # Manager workspace routes (portfolio, detail, people)
│   │   │   ├── teammate/           # Teammate/mentor workspace routes
│   │   │   └── layout.tsx          # Shared authenticated shell (sidebar + header)
│   │   ├── access-disabled/        # Shown when an AppUser record is deactivated
│   │   ├── api/                    # Route Handlers (REST-ish JSON API + PDF routes)
│   │   │   ├── auth/               # session + sign-out
│   │   │   ├── internships/        # achievements, progress-hub, report, stage-checklist
│   │   │   └── manager/            # internship admin endpoints, team-options, users
│   │   ├── sign-in/                # Public sign-in page
│   │   ├── globals.css             # Tailwind v4 theme tokens + base styles
│   │   ├── layout.tsx              # Root HTML layout
│   │   └── page.tsx                # `/` — redirects by role
│   ├── components/
│   │   ├── shared/                 # AppShell, Sidebar, WorkspacePlaceholder, etc.
│   │   └── ui/                     # Design-system primitives (Button, Modal, Menu, …)
│   ├── config/
│   │   └── sidebar.config.ts       # Per-role sidebar navigation definitions
│   ├── features/                   # Feature-scoped React components (client + server)
│   │   ├── achievements/
│   │   ├── assignments/
│   │   ├── auth/
│   │   ├── guest-dashboard/
│   │   ├── internships/
│   │   ├── manager-portfolio/
│   │   ├── progress-hub/
│   │   ├── stage-checklists/
│   │   └── timeline/
│   ├── lib/                        # Browser-safe shared types, constants, pure helpers
│   │   ├── achievements/ assignments/ env/ firebase/ guest-dashboard/
│   │   ├── internships/ manager-portfolio/ manager-workspace/ progress-hub/
│   │   ├── skills/ stage-checklists/ timeline/ workspace/
│   │   ├── teammate-responsibilities.ts
│   │   └── utils.ts
│   └── server/                     # Server-only domain logic and Firestore access
│       ├── achievements/ assignments/ auth/ authorization/ firebase/
│       ├── guest-dashboard/ internships/ manager-portfolio/ progress-hub/
│       ├── reports/ repositories/ stage-checklists/ timeline/ users/
├── test/
│   ├── firestore.integration.test.ts
│   └── server-only.ts              # vitest alias stub for the `server-only` package
├── AGENTS.md                       # Repository conventions for contributors/AI agents
├── apphosting.yaml                 # Firebase App Hosting runtime + env configuration
├── components.json                 # shadcn/ui configuration
├── eslint.config.mjs
├── firebase.json                   # Firebase CLI project configuration (emulators, rules)
├── firestore.indexes.json          # Firestore composite/field-override index definitions
├── firestore.rules                 # Firestore Security Rules (deny-all; server-only access)
├── next.config.ts                  # Next.js config (headers, Firebase Auth proxy rewrite)
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── README.md                       # Full local setup + emulator + troubleshooting guide
├── skills-lock.json                # Locked "agent skills" used for Firebase workflows
├── tsconfig.json
├── vitest.config.ts                # Unit-test config (excludes *.integration.test.ts, e2e)
└── vitest.integration.config.ts    # Integration-test config (Firestore/Auth emulator only)
```

---

## 5. Environment Configuration

All environment variables are parsed and validated through Zod schemas in
`src/lib/env/client.ts` (browser-safe, `NEXT_PUBLIC_*` variables only) and
`src/lib/env/server.ts` (server-only, marked with `import "server-only"`).
Both throw descriptive errors on misconfiguration rather than silently falling
back to unsafe defaults.

### 5.1 Client environment (`getClientEnvironment`)

| Variable                                | Required | Notes |
| ------------------------------------------ | -------- | ------- |
| `NEXT_PUBLIC_AUTHENTICATION_MODE`          | No (defaults to `google`) | `"google"` or `"email-password-development"`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Conditionally | Must be supplied together with the other two `NEXT_PUBLIC_FIREBASE_*` values, or omitted entirely to rely on Firebase App Hosting's automatic web-app configuration. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Conditionally | Same rule as above. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Conditionally | Same rule as above; must match the server's project ID. |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST`  | No | e.g. `127.0.0.1:9099`; only for local emulator use. Throws if set with `NODE_ENV=production`. |

Validation rules enforced in code:

- If **any** of the three `NEXT_PUBLIC_FIREBASE_*` values is set, **all
  three** must be set (`"Firebase web configuration is incomplete..."`).
- `email-password-development` mode is rejected outright when
  `NODE_ENV=production` (`"Email/password development authentication is
  unavailable in production."`).
- The Firebase Auth Emulator host variable is rejected in production
  (`"Firebase Auth Emulator is unavailable in production."`).

### 5.2 Server environment (`getServerEnvironment`)

| Variable                          | Required | Notes |
| ------------------------------------ | -------- | ------- |
| `APP_ORIGIN`                        | Recommended | The exact origin (scheme+host) that legitimately serves the app. Used to validate the `Origin` header on session/mutation requests. Defaults to `http://localhost:3000` outside production. |
| `FIREBASE_AUTHENTICATION_MODE`      | No | Must match `NEXT_PUBLIC_AUTHENTICATION_MODE` when both are set. |
| `FIREBASE_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT` | Required in production | At least one is required in production; falls back to `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, then to `"fluxon-internships-development"` in non-production. |
| `FIRESTORE_DATABASE_ID`             | No | Defaults to `"(default)"`. Set to a named database (e.g. `europe`) to target a non-default Firestore database. |
| `SESSION_COOKIE_NAME`               | No | Defaults to `__session`. |
| `SESSION_MAX_AGE_SECONDS`           | No | Defaults to `432000` (5 days). Must be between 300 and 1,209,600 seconds. |
| `GOOGLE_APPLICATION_CREDENTIALS`    | Situational | Absolute path to a service-account JSON file; required for the seed script and index-deploy script when targeting hosted Firebase. Not required for the Next.js app itself, which uses Application Default Credentials. |

Validation rules enforced in code:

- Production requires a server project ID (`FIREBASE_PROJECT_ID` or
  `GOOGLE_CLOUD_PROJECT`) — this is checked at `next build` time because
  Next.js evaluates page data collection during the build.
- `email-password-development` mode is rejected in production.
- If both authentication-mode variables are set, they must be equal
  (`"Client and server authentication modes must match."`).
- If both project-ID variables are set, they must be equal
  (`"Client and server Firebase project IDs must match."`).

### 5.3 `.env.local` template (development)

```dotenv
APP_ORIGIN=http://localhost:3000
NEXT_PUBLIC_AUTHENTICATION_MODE=email-password-development
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-app-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

FIREBASE_AUTHENTICATION_MODE=email-password-development
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/outside-the-repository/development-service-account.json
```

`.env.local` is git-ignored and must never be committed. `FIRESTORE_DATABASE_ID`
is optional and left unset for the default database.

### 5.4 Production values (`apphosting.yaml`)

Firebase App Hosting injects the following at build and/or runtime for the
deployed environment (values redacted where sensitive, taken from the
committed `apphosting.yaml`):

- `APP_ORIGIN` — the exact serving origin; must be kept in sync with the real
  domain or `POST /api/auth/session` will reject every request as an invalid
  origin.
- `NEXT_PUBLIC_AUTHENTICATION_MODE` / `FIREBASE_AUTHENTICATION_MODE` — both
  `"google"` in production (email/password development mode is unavailable).
- `FIREBASE_PROJECT_ID` / `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — the production
  Firebase project ID.
- `FIRESTORE_DATABASE_ID` — set to `"europe"` (a named, non-default Firestore
  database) for the production deployment.
- `NEXT_PUBLIC_FIREBASE_API_KEY` / `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` — pinned
  explicitly (rather than relying on App Hosting's automatic web-app config)
  so that `authDomain` equals the app's own origin. This lets
  `signInWithRedirect` avoid needing third-party storage access to
  `*.firebaseapp.com`, which modern browsers block by default. `next.config.ts`
  proxies `/__/auth/*` to `*.firebaseapp.com` so Firebase's redirect-auth
  helper still works behind the app's own domain.

---

## 6. Authentication

Authentication is handled by **Firebase Authentication**, with two supported
sign-in modes selected by `NEXT_PUBLIC_AUTHENTICATION_MODE` /
`FIREBASE_AUTHENTICATION_MODE`:

- **`google`** — Google sign-in via `signInWithRedirect`/popup. Used in
  production.
- **`email-password-development`** — Email/password sign-in for local
  development personas (Manager, Mentor, Intern, Guest). Rejected outright if
  `NODE_ENV=production`.

### 6.1 Client-side Firebase Auth (`src/lib/firebase/client.ts`)

`getFirebaseClientAuth()` lazily creates a singleton `Auth` instance using
`initializeAuth` (not the default `getAuth()`), specifically configured with:

- `browserLocalPersistence` — plain `localStorage`-backed persistence, chosen
  deliberately over the SDK's default IndexedDB persistence because IndexedDB
  transactions can be interrupted by the page navigating to/from the identity
  provider, dropping the pending redirect-sign-in result (a known
  firebase-js-sdk issue). The code comments this decision explicitly.
- `browserPopupRedirectResolver` — must be supplied explicitly because
  `initializeAuth()` (unlike `getAuth()`) does not include it by default;
  without it, `signInWithRedirect`/`getRedirectResult` throw
  `auth/argument-error`.
- If `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` is set, the client connects to
  the local Auth Emulator via `connectAuthEmulator`.

### 6.2 Sign-in UI (`src/features/auth/SignInCard.tsx`)

Renders the sign-in card on `/sign-in`. In `email-password-development` mode
it lists the local development personas (Manager, Mentor, Intern, Guest) with
the development password supplied automatically, so testers do not need to
type credentials. In `google` mode it renders a "Sign in with Google" action
that triggers `signInWithRedirect`.

### 6.3 Establishing an application session

1. The client authenticates with Firebase Auth (Google redirect or
   email/password) and obtains a Firebase **ID token**.
2. The client calls `POST /api/auth/session` with `{ idToken }`.
3. The route handler (`src/app/api/auth/session/route.ts`):
   - Rejects the request with `403` if `hasValidRequestOrigin(request)` is
     false (the `Origin` header must exactly match `APP_ORIGIN`).
   - Validates the request body (`idToken: z.string().min(1)`).
   - Calls `createFirebaseSessionCookie(idToken)`.
   - Sets the resulting cookie via `setFirebaseSessionCookie`.
4. `createFirebaseSessionCookie` (`src/server/auth/firebase-session-provider.ts`):
   - Verifies the ID token with `adminAuth.verifyIdToken(idToken, true)`
     (`true` = check for revocation).
   - Calls `assertRecentAuthentication(decodedToken.auth_time)`, which
     **requires the sign-in to have happened within the last 5 minutes**
     (`src/server/auth/session-validation.ts`), preventing stale/replayed ID
     tokens from minting a long-lived session cookie.
   - Calls `validateIdentityClaims(decodedToken, allowDevelopmentPassword)`
     (see below) to reject unverified/unsupported identities before minting
     the cookie.
   - Calls `adminAuth.createSessionCookie(idToken, { expiresIn:
     sessionMaxAgeSeconds * 1000 })` to mint a Firebase session cookie.
5. The cookie is stored as an `httpOnly`, `sameSite=lax` cookie
   (`secure` in production), named by `SESSION_COOKIE_NAME` (default
   `__session`), with `maxAge` = `SESSION_MAX_AGE_SECONDS` (default 5 days).

### 6.4 Identity-claim validation (`validateIdentityClaims`)

Applied both when minting a session cookie and every time a session cookie is
read back. A decoded token/claims object is only accepted as an
`AuthenticatedUser` if:

- `email` is present.
- `email_verified` is `true` (otherwise throws `UNVERIFIED_EMAIL`).
- The Firebase sign-in provider (`firebase.sign_in_provider`) is
  `"google.com"`, or — only when `allowDevelopmentPassword` is true (i.e. the
  server is running in `email-password-development` mode) — `"password"`.
  Any other/missing provider throws `UNSUPPORTED_PROVIDER`.

This means: in production (`google` mode), a session cookie minted from an
email/password sign-in is never valid, even if somehow present, because the
provider check excludes `"password"` unless development mode is active. This
double-checks the mode restriction independently of the environment-variable
guard.

### 6.5 Reading the session (server-side)

`getOptionalFirebaseSessionUser()` reads the session cookie from
`next/headers`, calls `adminAuth.verifySessionCookie(cookie, checkRevoked)`
(`checkRevoked` is only `true` in production, to avoid an extra HTTPS round
trip on every page load in development), and converts the decoded token into
an `AuthenticatedUser` via the same `validateIdentityClaims` check. Any
failure (missing cookie, invalid/expired/revoked cookie, failed claim
validation) resolves to `undefined` rather than throwing, so callers use
`requireAuthenticatedUser()` (in `src/server/auth/require-user.ts`) to turn an
absent session into a thrown `AuthenticationError("UNAUTHENTICATED", ...)`.

### 6.6 Sign-out

`POST /api/auth/sign-out` validates the request origin, then calls
`clearFirebaseSessionCookie()`, which overwrites the session cookie with an
empty value and `maxAge: 0`.

### 6.7 Origin validation (CSRF-style protection)

`src/server/auth/origin.ts` exports:

- `isAllowedRequestOrigin(origin, allowedOrigin)` — compares `new
  URL(origin).origin` against `new URL(allowedOrigin).origin` for an *exact*
  match (scheme + host + port). Rejects `null`/empty/unparseable origins, and
  rejects scheme or subdomain mismatches (e.g. `http://` vs `https://`, or
  `dashboard.example.com.attacker.example`).
- `hasValidRequestOrigin(request)` — reads `APP_ORIGIN` from the server
  environment and checks the incoming request's `Origin` header against it.
  Returns `false` (denying the request) if `APP_ORIGIN` is not configured.

Every mutating API route (`POST`/`PATCH`/`DELETE` handlers) calls
`hasValidRequestOrigin` before doing any other work, returning `403` on
failure. This is the application's primary CSRF defense for cookie-based
sessions, since the session cookie alone would otherwise be sent
cross-origin automatically by the browser.

### 6.8 Authentication error type

`src/server/auth/errors.ts` defines `AuthenticationError` with codes
`UNAUTHENTICATED | INVALID_SESSION | UNVERIFIED_EMAIL | UNSUPPORTED_PROVIDER`.
API routes convert this into an HTTP `401` response; page components let it
propagate (there is no session in a Server Component render, so an
unauthenticated visitor is typically redirected by Next.js middleware/layout
logic to `/sign-in`, handled at the layout/page level).

---

## 7. Authorization

Authorization is a **separate layer** from authentication: being signed in
with Firebase only proves *who* the visitor is; the `AuthorizationContext`
determines *what* they are allowed to do inside the application.

### 7.1 Application users (`AppUser`)

Stored in the Firestore `users` collection and validated with
`appUserSchema` (`src/server/users/app-user.ts`):

```ts
export const applicationRoles = ["manager", "intern", "teammate", "guest"] as const;

appUserSchema = {
  email: string (valid email),
  displayName: string (min length 1),
  active: boolean,
  roles: ApplicationRole[] (min length 1),
  identityState: "pending" | "linked",
  identities: { provider: string, subject: string }[] (default []),
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

An `AppUser` can be **provisioned in advance** ("pending") before the person
ever signs in — a manager creates the record with an email address and role(s)
via `POST /api/manager/users`. `identityState` starts as `"pending"` with an
empty `identities` array.

### 7.2 Linking a Firebase identity to an `AppUser`

`src/server/repositories/app-users.ts` exposes:

- `findAppUserByEmail(email)` — looks up by normalized (`trim().toLowerCase()`)
  email using a Firestore `where("email", "==", ...)` query.
- `findAppUserByFirebaseUid(uid)` — looks up by an `array-contains` query on
  `identities` for `{ provider: "firebase", subject: uid }`.
- `linkPendingAppUser(uid, email)` — if a user record exists for that email
  and is still `"pending"`, this atomically flips `identityState` to
  `"linked"` and appends the Firebase identity via
  `FieldValue.arrayUnion(...)`. This is how a manager-provisioned "pending"
  record becomes tied to a real Firebase account the first time that person
  signs in with the matching email.

### 7.3 Resolving the `AuthorizationContext`

`getAuthorizationContext(user: AuthenticatedUser)` in
`src/server/authorization/context.ts` (memoized per-request with React's
`cache()`) resolves one of three states:

```ts
type AuthorizationContext =
  | { access: "notInvited"; user }                                  // no AppUser record found
  | { access: "disabled";    user; userId; appUser }                // AppUser.active === false
  | { access: "appUser";     user; userId; appUser }                // active AppUser record
```

Resolution logic: look up the `AppUser` by Firebase UID; if none is found,
attempt to link a pending record by email (`linkPendingAppUser`); if still
none, the visitor is `"notInvited"`. If found but `active: false`, the
visitor is `"disabled"`. Otherwise `"appUser"`.

### 7.4 Assertions & role checks

`src/server/authorization/assertions.ts`:

- `assertAppUser(context)` — throws `AuthorizationError("DISABLED", ...)` for
  a disabled account, or `AuthorizationError("APP_USER_REQUIRED", ...)` for a
  not-invited visitor; otherwise narrows and returns the `"appUser"` context.
- `assertRole(context, role)` — calls `assertAppUser` first, then throws
  `AuthorizationError("ROLE_REQUIRED", ..., role)` unless
  `appUser.roles.includes(role)`. **Roles are checked explicitly** — having
  the `teammate` role does not implicitly grant `manager` access, even though
  a person can hold both roles simultaneously.

`src/server/authorization/require-role.ts` composes authentication and
authorization for server code:

- `requireAppUser(user)` → `getAuthorizationContext` + `assertAppUser`.
- `requireRole(user, role)` → `getAuthorizationContext` + `assertRole`.

### 7.5 Page-level guards (`src/server/assignments/page-auth.ts`)

Server Component pages call one of:

- `requireManagerPage()`
- `requireTeammatePage()`
- `requireInternPage()`

Each calls `requireRole(await requireAuthenticatedUser(), <role>)` and, on any
`AuthorizationError`, calls Next.js `redirect("/forbidden")`. Any other error
(e.g. an `AuthenticationError` from `requireAuthenticatedUser` when there is
no session at all) is re-thrown to be handled by Next.js's default
unauthenticated/error handling further up the tree. The `/forbidden` route
(`src/app/(authenticated)/forbidden/page.tsx`) renders a plain "you don't have
access" page; `/access-disabled` is the analogous page for a **disabled**
`AppUser` record.

### 7.6 API-route guards (`src/server/assignments/http.ts`,
`src/server/progress-hub/http.ts`, `src/server/stage-checklists/http.ts`)

Each feature exposes small composed helpers used at the top of its route
handlers, generally following this pattern:

```ts
export async function requireManagerContext() {
  return requireRole(await requireAuthenticatedUser(), "manager");
}

export async function requireManagerMutationContext(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    throw new AuthorizationError("INVALID_REQUEST_ORIGIN", "Invalid request origin.");
  }
  return requireManagerContext();
}
```

i.e., *mutation* endpoints additionally validate the request `Origin` before
resolving role authorization. A shared `assignmentErrorResponse(error)`
helper converts thrown errors into the correct HTTP status:

| Error type              | HTTP status |
| -------------------------- | ------------ |
| `z.ZodError`               | 400 (first issue's message) |
| `AuthorizationError`       | 403 |
| `AuthenticationError`      | 401 |
| Any other `Error`/unknown  | 400 (message or generic fallback) |

### 7.7 Resource-level (per-internship) access control

Role membership alone is not sufficient for internship-scoped actions — a
manager must specifically be **assigned to that internship**, and a mentor
must be **currently placed on that internship's team** (or otherwise
assigned). This is enforced at the data layer, not just the route layer:

- `src/server/assignments/manager-access.ts`:
  - `assertManagerAccessSnapshots(internshipSnap, userSnap, assignmentSnap,
    managerId)` validates, from already-fetched Firestore snapshots, that:
    the internship, user, and manager-assignment documents all exist; the
    `AppUser` is `active` and has the `manager` role; the assignment's
    `userId` matches; and the assignment `isCurrentManagerAssignment` (i.e.
    unended or not yet past its `endsAt`). Any failure throws
    `AuthorizationError("ROLE_REQUIRED", "You do not manage this
    internship.", "manager")`.
  - `readManagerMutationAccess(transaction, internshipRef, managerId)` reads
    the three documents inside a Firestore transaction and applies the same
    check, used by mutation services that need transactional consistency
    (read-then-write in one atomic operation).
- Analogous checks exist for teammate/mentor access to a given internship
  inside `src/server/assignments/service.ts` (e.g.
  `getTeammateInternshipDetail`) and are re-used by `progress-hub`,
  `stage-checklists`, and `achievements` services to resolve each viewer's
  specific capabilities (see `resolveProgressHubAccess`,
  `resolveChecklistAccess`, etc. below).

### 7.8 Authorization error type

`src/server/authorization/errors.ts` defines `AuthorizationError` with codes:
`APP_USER_REQUIRED | ROLE_REQUIRED | DISABLED | INVALID_REQUEST_ORIGIN`, and
an optional `requiredRole` for `ROLE_REQUIRED` errors.

---

## 8. Domain Model

### 8.1 Application Users

See [Section 7.1](#71-application-users). Roles: `manager`, `intern`,
`teammate`, `guest`. A user may hold multiple roles. `identityState` tracks
whether the record is still waiting for its first sign-in (`"pending"`) or has
been linked to a Firebase identity (`"linked"`).

### 8.2 Internships (Lifecycle: Status & Stage)

Defined in `src/lib/internships/types.ts` and validated server-side in
`src/server/internships/domain.ts`.

**Status** (`internshipStatuses`):

| Value       | Label     |
| ----------- | --------- |
| `active`    | Active    |
| `paused`    | Paused    |
| `completed` | Completed |
| `cancelled` | Cancelled |

**Stage** (`internshipStages`) — an ordered progression:

| Order | Value                | Label               |
| ----- | --------------------- | -------------------- |
| 1     | `onboarding`           | Onboarding            |
| 2     | `firstJiraTasks`       | First Jira tasks      |
| 3     | `activeContribution`   | Workflow              |
| 4     | `independentWork`      | Independent work      |
| 5     | `finalReview`          | Wrap-up               |

`initialInternshipLifecycle` = `{ status: "active", currentStage:
"onboarding" }` — every new internship starts here.

**Persisted document shape** (`persistedInternshipDocumentSchema`, Firestore
collection `internships`):

```ts
{
  internId: string,       // the intern's AppUser document ID
  status: InternshipStatus | "archived", // "archived" is a legacy value
  currentStage: InternshipStage,          // defaults to "onboarding"
  startsAt: Timestamp,
  endsAt?: Timestamp,                      // expected/actual end date
  createdAt: Timestamp,
  createdBy: string,                       // creator's AppUser ID
  updatedAt: Timestamp,
  updatedBy: string,
}
```

`parseInternshipDocument` maps the **legacy** `"archived"` status value to the
current `"completed"` status via `legacyInternshipStatusMappings`, so older
data remains readable without a migration.

### 8.3 Stage Checklists & Skills

Each of the 5 stages has a **template** of checklist items
(`src/lib/stage-checklists/templates.ts`), each item carrying:

```ts
type StageChecklistItemTemplate = {
  key: string;                             // stable, unique per stage
  label: string;
  type: "required" | "recommended";
  skills: readonly InternshipSkill[];      // which skill(s) this item credits
  weight: number;                          // skill points awarded on completion
  allowedCompletionActors: ChecklistCompletionActor[]; // who may mark it done
};
```

`ChecklistCompletionActor` = `"intern" | "mentor" | "manager"` — controls who
is allowed to mark a specific item complete (some items — e.g. a mentor's
final-outcome recommendation — can only be completed by a mentor, not the
intern).

**Skills** (`src/lib/skills/types.ts`) — an 8-dimension skill model, each with
a maximum point value:

| Skill                    | Max points |
| --------------------------- | ----------- |
| Technical                    | 40 |
| Product Understanding        | 30 |
| Communication                | 30 |
| Collaboration                | 25 |
| Ownership                     | 30 |
| Planning                      | 25 |
| Code Quality                  | 35 |
| Leadership                    | 20 |

`calculateSkillProgress(items)` (`src/lib/skills/progress.ts`) sums the
`weight` of every **completed** item that credits each skill, then computes a
`percentage = round(completedPoints / maxPoints * 100)`, clamped to
`[0, 100]`. `exceedsSkillPointTargets(items)` flags configurations whose raw
completed points exceed the configured maximum for any skill (used as a
template sanity check / guard against mis-weighted custom tasks).
`customTaskPointLimits = { min: 1, max: 5 }` bounds the point weight a
manager/mentor can assign when adding an ad-hoc ("custom") checklist task.

**Runtime checklist DTO** (`StageChecklistDto`,
`src/lib/stage-checklists/types.ts`) adds live status to each template item
(`status: "todo" | "inProgress" | "done"`, `completed`, `completedAt`,
`completedBy`) plus viewer capability flags (`canComplete`, `canDelete`) and
stage-level rollups: `requiredCompletedCount` / `requiredTotalCount`,
`readyToComplete` (all required items done), `isStageCompleted`,
`canCompleteStage`, `canAddTasks`, `reviewStatus: "active" | "underReview" |
"completed"`, and per-skill `skillProgress`.

**Server logic** (`src/server/stage-checklists/service.ts`) implements:

- `canCompleteChecklistItem(...)` — checks the viewer's role against the
  item's `allowedCompletionActors` and current internship/checklist state.
- `resolveChecklistAccess(...)` — derives the full capability set for a given
  viewer (manager/mentor/intern) and internship.
- `getStageChecklist(...)` — reads and assembles the `StageChecklistDto` for
  the current stage.
- `updateChecklistItem(...)` — toggles an item's completion; awards/removes
  skill points.
- `reviewChecklistItem(...)` — supports a review workflow (e.g., an intern
  marks an item "ready for review", a mentor/manager approves it).
- `createChecklistItem(...)` / `deleteChecklistItem(...)` — manage custom
  (non-template) tasks, bounded by `customTaskPointLimits`.
- `completeStage(...)` — advances `currentStage` once all required items are
  done (mirrors `areRequiredChecklistItemsComplete` in
  `src/server/manager-portfolio/service.ts`, which is also used to compute the
  `stageReadyToComplete` attention signal on the manager portfolio).
- `createInitialStageProgress(stage, actorId)` — seeds a fresh checklist
  progress document when an internship is created or advances to a new stage.

All mutation input is validated with dedicated Zod schemas:
`checklistItemMutationSchema`, `checklistItemReviewSchema`,
`createChecklistItemSchema`, `deleteChecklistItemSchema`,
`stageAdvancementSchema`, `stageSelectionSchema`, `stageProgressSchema`.

### 8.4 Assignments (Managers, Teammates, Team Placements)

`src/server/assignments/domain.ts` defines the shared, date-ranged assignment
model used by three Firestore sub-collections under each internship document:

- **`managerAssignments`** — which manager(s) oversee this internship, and
  when (`{ userId, startsAt?, endsAt? }`). Assignments without a `startsAt`
  are treated as legacy data, effective immediately
  (`isCurrentManagerAssignment`).
- **`teammateAssignments`** — which teammate (mentor/PM/team-lead) is
  attached, to which team, with which responsibilities, and for what date
  range (`{ teammateUserId, teamId, responsibilities: string[], startsAt,
  endsAt? }`).
- **`teamPlacements`** — which team the intern is placed on and for what date
  range (`{ teamId, startsAt, endsAt? }`).

Shared date-range helpers (all pure functions operating on Firestore
`Timestamp`s):

- `assertValidRange({ startsAt, endsAt })` — throws if `endsAt < startsAt`.
- `rangesOverlap(a, b)` / `containsRange(container, candidate)` — interval
  math used to prevent overlapping/duplicate assignments.
- `isCurrent(range, now)` — whether `now` falls inside `[startsAt, endsAt]`.
- `isOngoingOrScheduled(range, now)` — true if not yet ended.
- `assignmentStatus(range, now)` → `"current" | "scheduled" | "ended"` —
  drives the status labels shown in the manager UI for placements/assignments.

**Teammate responsibilities** (`src/lib/teammate-responsibilities.ts`):
`mentor`, `projectManager` (label "Project manager"), `teamLead` (label "Team
lead"). A teammate assignment can carry more than one responsibility at once
(e.g., a person can be both the mentor and the team lead).

**Service functions** (`src/server/assignments/service.ts`, ~900 lines) —
covers the full CRUD surface consumed by the manager UI and by intern/teammate
page loads:

| Function | Purpose |
| ---------- | --------- |
| `listManagedInternships(managerId)` | Internships a manager currently oversees. |
| `listTeammateInternships(teammateId)` | Internships a teammate/mentor is attached to. |
| `getCurrentInternshipForIntern(internId)` | The intern's own current internship (used to render `/intern`). |
| `listEligibleUsers(role)` / `listAvailableInterns()` | Options for assignment dropdowns (managers/teammates to assign; interns without an active internship). |
| `getManagedInternshipDetail(managerId, internshipId)` | Full manager-facing detail DTO for one internship (assignments, placements, history, eligible users, capabilities). |
| `getTeammateInternshipDetail(teammateId, internshipId)` | Equivalent detail view scoped to a teammate/mentor. |
| `searchTeams(query)` | Autocomplete search over the `teams` collection. |
| `createInternship(input)` | Creates a new internship document + initial lifecycle + initial checklist progress, validated by `createInternshipInputSchema`. |
| `addTeamPlacement(input)` | Places the intern on a team, validated by `createPlacementInputSchema`; checks for overlapping placements via `rangesOverlap`. |
| `addTeammateAssignment(input)` | Attaches a teammate with responsibilities, validated by `createTeammateAssignmentInputSchema`. |
| `updateTeammateResponsibilities(input)` | Edits an existing assignment's `responsibilities`, validated by `updateResponsibilitiesInputSchema`/`responsibilitySchema`. |
| `closeTeammateAssignment(...)` | Sets `endsAt` on an active teammate assignment (ends it early). |

`teamInputSchema` is a `z.union` allowing either selection of an existing team
(`teamId`) or inline creation of a new team (`title`) in the same form
submission — used by `CreateInternshipForm` / `TeamPlacementForm`.

### 8.5 Progress Hub (Weekly Reflections & Check-ins)

The Progress Hub is the internship's recurring, week-scoped collaboration
surface. Weeks are computed deterministically using **ISO 8601 week numbers**
in a fixed application time zone.

**Week math** (`src/lib/progress-hub/week.ts`):

- `progressHubTimeZone = "Europe/Uzhgorod"` — all "current week" calculations
  use this fixed zone (via `Intl.DateTimeFormat`) regardless of server or
  client locale, so every participant sees the same week boundaries.
- `WeekPeriod = { key: "YYYY-Www", startDate, endDate, label, state: "current" | "past" | "future" }`.
  Week keys follow the ISO week-numbering algorithm (Thursday-anchored,
  matching `date-fns`/ISO 8601 conventions), implemented from scratch with
  `Date.UTC` arithmetic (`isoWeekStart`, `isoWeekKey`, `startForWeekKey`).
- `getCurrentWeek(now)` / `getWeekPeriod(key, now)` compute a `WeekPeriod`
  and classify it relative to "now" as current/past/future.
- `assertWritableWeek(key, now)` throws `"Future weeks are not available
  yet."` if the requested week has not started — future-dated reflections and
  check-ins cannot be created.

**Entities**, each keyed by `weekKey` where applicable
(`src/lib/progress-hub/types.ts`):

| Entity | State machine | Notes |
| -------- | -------------- | ------- |
| `WeeklyReflectionDto` | `draft → submitted` | Written by the intern: accomplishments, learnings, challenges, next-week focus, support needed. |
| `MentorCheckInDto` | `draft → shared` | Written by the mentor: progress summary, strengths observed, areas to improve, support needed, next-week focus. Only visible to the intern once `shared`. |
| `AgendaItemDto` | open → `resolved` | Shared 1:1 agenda items, any authorized participant can add/resolve. |
| `NoteDto` | n/a | Free-text notes; either **shared** (visible to intern + mentor + manager) or **private** (`privateInternNotes` / `privateMentorNotes` — visible only to their author's role). |
| `ActionItemDto` | `open → completed` | Has an `ownerType: "intern" \| "mentor" \| "manager"`, `ownerUserId`, `dueDate`, and a derived `overdue` flag. |

**Summary rollup** (`ProgressHubSummaryDto`) — used both inside the full
Progress Hub view and embedded in the Manager Portfolio list:
`reflectionState`, `mentorCheckInState`, `openActionItems`,
`overdueActionItems`, `nextDueAction`, `unresolvedAgendaItems`,
`latestSharedCheckInAt`, plus `currentStage`/`checklistCompleted`/
`checklistTotal` for a compact "where are they right now" snapshot.

**Viewer-specific DTOs** — the shape of data returned depends on who is
asking (`InternProgressHubDto | MentorProgressHubDto | ManagerProgressHubDto`,
discriminated by `viewer`). For example, only the `intern` DTO includes
`reflectionHistory`/`privateInternNotes`; only mentor/manager DTOs include
`privateMentorNotes`. Every DTO carries a `ProgressHubCapabilities` object
(`canSaveReflection`, `canSaveCheckIn`, `canCreateAgendaItem`,
`canCreateSharedNote`, `canCreatePrivateInternNote`,
`canCreatePrivateMentorNote`, `canCreateActionItem`) so the UI never has to
re-derive permission logic client-side.

**Server service** (`src/server/progress-hub/service.ts`, largest service
file in the codebase):

- `resolveProgressHubAccess(...)` — the central function that determines, for
  a given viewer + internship, which capabilities apply and which data
  subsets are visible.
- `getInternProgressHub`, `getMentorProgressHub`, `getManagerProgressHub` —
  the three top-level DTO builders, called from the corresponding page
  routes.
- `saveReflection`, `saveMentorCheckIn` — validated by
  `reflectionMutationSchema`/`checkInMutationSchema`; enforce state
  transitions via `assertReflectionTransition`/`assertCheckInTransition`
  (e.g., cannot "un-submit" a submitted reflection back to draft through this
  path; a shared check-in becomes read-only for further silent edits).
- `mutateAgenda` (re-exported as `saveAgendaItem`) — create/resolve agenda
  items, validated by `agendaMutationSchema`.
- `saveSharedNote`, `savePrivateInternNote`, `savePrivateMentorNote` — all
  backed by one `noteMutationSchema` but writing to different sub-collections
  based on visibility.
- `saveActionItem` / `setActionItemStatus` — validated by
  `actionItemMutationSchema` / `actionItemStatusSchema`.
- `getManagerProgressSummary(...)` — a lighter-weight summary fetch used when
  building the Manager Portfolio list (avoids loading full reflection/agenda
  history for every row).
- `currentWeekForKey(key)` — helper reused across mutation handlers to
  resolve/validate the week being written to.

`src/server/progress-hub/http.ts` exposes
`requireProgressHubMutationContext(request)`, the origin + role guard shared
by every Progress Hub mutation route.

### 8.6 Achievements

A lightweight, append-mostly log of intern accomplishments
(`src/lib/achievements/types.ts`):

**Categories** (`achievementCategories`): Delivery, Learning, Collaboration,
Ownership, Communication, Milestone.

**`AchievementDto`**: `title`, optional `description`, `category`,
`achievedOn` (date string), optional `linkedStage` (ties the achievement to a
specific internship stage), optional `evidenceUrl`, `author`
(`{ id, displayName }`), `createdAt`/`updatedAt`, optional `archivedAt`, and
capability flags `canEdit` / `canArchive` / `canRestore`.

**Server validation** (`src/server/achievements/service.ts`,
`achievementInputSchema`):

- `title`: 1–160 characters (non-empty, length-capped).
- `category`: must be one of `achievementCategories`.
- `achievedOn`: must be an ISO date string (`YYYY-MM-DD`), not an arbitrary
  date format.
- `evidenceUrl`: if provided, must be a valid `http(s)` URL (explicitly
  rejects schemes like `javascript:` to prevent stored-XSS-style link
  injection).

**Service functions**: `listAchievements(...)`, `createAchievement(...)`,
`updateAchievement(...)`, `archiveAchievement(...)` (soft-delete via
`archivedAt`) — with a matching `restore` route to un-archive
(`src/app/api/internships/[internshipId]/achievements/[achievementId]/restore/route.ts`).

### 8.7 Manager Portfolio

The Manager Portfolio is the manager's single-page overview of every
internship they oversee, with computed **attention signals** that surface
what needs action.

**Attention signals** (`managerAttentionSignals`,
`src/lib/manager-portfolio/types.ts`) — each signal has a `value` key, a
display `label`, a `severity` (`warning | neutral | critical | positive`),
and a documented `rule` describing exactly when it fires:

| Key | Severity | Rule |
| ----- | --------- | ------ |
| `reflectionMissing` | warning | Current-week reflection not created/submitted. |
| `mentorCheckInMissing` | warning | Current-week mentor check-in not created. |
| `mentorCheckInDraft` | neutral | Check-in exists but not shared. |
| `overdueActions` | critical | One or more open action items are past their due date. |
| `stageReadyToComplete` | positive | Every required checklist item in the current stage is done. |
| `internshipPaused` | neutral | Status is `paused`. |
| `finalReviewCompletedAwaitingDecision` | warning | `finalReview` stage complete but status not yet `completed`/`cancelled`. |
| `noCurrentMentor` | warning | No current teammate assignment has the `mentor` responsibility. |
| `endingSoon` | neutral | Expected end date is within 14 calendar days. |

`src/server/manager-portfolio/domain.ts` implements the pure computation
logic:

- `attentionSignal(key, details)` — looks up a signal's static metadata and
  merges in dynamic `count`/`date` details.
- `portfolioMetrics(items)` — aggregates the full portfolio list into
  `ManagerPortfolioMetricsDto`: totals by status, totals by stage, and
  counts of internships missing reflections, missing/draft check-ins, with
  overdue actions, and stages ready to complete.
- `filterAndSortPortfolio(items, query)` — applies free-text search (by
  intern display name), and optional `status`/`stage`/`attention`/`mentorId`
  filters, then sorts by `internName | startsAt | currentStage |
  latestActivity | overdueActions` in `asc`/`desc` direction, with a stable
  tiebreaker on `id`.

**`src/server/manager-portfolio/service.ts`** (largest single service by line
count) builds on top of this:

- `managerPortfolioQuerySchema` / `normalizeManagerPortfolioQuery(input)` —
  parses and defaults the incoming query-string parameters (search, filters,
  sort, direction, page, pageSize) from `GET
  /api/manager/internships?...` (implemented directly in
  `route.ts` — see [API reference](#12-http-api-reference)) — actually, the
  manager-portfolio *list* is rendered server-side by the
  `/manager/internships` **page** rather than a dedicated GET API route; the
  page calls `getManagerPortfolio` directly as a Server Component.
- `statusCommandSchema`, `managerAssignmentInputSchema`,
  `expectedEndDateInputSchema`, `removeManagerAssignmentInputSchema` — input
  schemas for the mutation endpoints under
  `/api/manager/internships/[internshipId]/...`.
- `areRequiredChecklistItemsComplete(items, progressByKey)` — pure helper
  (covered by a dedicated unit test) checking that every checklist item typed
  `"required"` — including custom, manager/mentor-added required tasks, not
  just template items — is marked completed; used to gate stage completion
  and to compute the `stageReadyToComplete` signal.
- `deriveAttentionSignals(...)` — assembles the full `ManagerAttentionSignal[]`
  for one internship by evaluating every rule above against its current
  checklist/progress-hub/status/placement state.
- `getManagerPortfolio(managerId, query)` — the main list query: loads every
  internship the manager oversees, joins in checklist + progress-hub summary
  data, computes attention signals + metrics, applies
  `filterAndSortPortfolio`, and paginates the result into
  `ManagerPortfolioDto` (`items`, `metrics`, `total`, `page`, `pageSize`,
  `totalPages`, `mentorOptions`, echoed `query`).
- `getManagerPortfolioDetail(managerId, internshipId)` — the single-internship
  detail view (`ManagerPortfolioDetailDto`): full checklist, full progress
  hub, manager-assignment history, status-change history, team placements,
  teammate assignments, eligible managers/teammates for new assignments, and
  a `capabilities` object (`canManage`, `canEditExpectedEnd`,
  `canManageManagers`, `canManagePlacements`, `canManageTeammates`,
  `canChangeStatus`, `canTransitionStatus`).
- `transitionInternshipStatus(...)` — changes `status` (e.g. active → paused,
  active → completed), recording a `ManagerStatusHistoryDto` entry
  (`previousStatus`, `newStatus`, `changedAt`, `changedBy`, optional
  `reason`).
- `updateExpectedEndDate(...)` — updates `endsAt`.
- `addManagerAssignment(...)` / `removeManagerAssignment(...)` — manage which
  manager(s) oversee an internship (a manager can add a co-manager or remove
  themselves/another, subject to `canManageManagers`).

### 8.8 Timeline

`src/lib/timeline/types.ts` defines a generic, filterable event feed:
`timelineGroups = ["all", "achievements", "lifecycle", "weeklyProgress",
"assignments", "actions", "status"]`. `TimelineEventDto = { id, type,
occurredAt, title, description? }`. `getInternshipTimeline(...)`
(`src/server/timeline/service.ts`) aggregates and paginates events across
these categories (achievement creation, stage transitions, reflection/check-in
submissions, assignment changes, action-item completion, status changes) into
a single, groupable, paged `TimelineDto`. Rendered by
`InternshipTimeline.tsx` and reused across the intern, mentor, and manager
workspaces ("Internship timeline" / "History" sidebar entries).

### 8.9 Guest Dashboard

For signed-in users without a role-specific `AppUser` record match relevant
enough to see a full workspace (or explicitly assigned the `guest` role), the
Guest Dashboard (`src/server/guest-dashboard/service.ts`,
`getGuestDashboard()`) returns a simplified, read-only, cross-internship view:
`GuestDashboardDto = { items: GuestDashboardItem[], metrics }`. Each
`GuestDashboardItem` includes the intern's name, status, current stage,
`dayOfInternship` (computed from `startsAt`), optional project/mentor/manager
labels, required-checklist completion counts, a small `timeline` slice,
optional latest shared mentor feedback, and a short list of achievements.
`metrics` totals items by `total | active | paused | completed`.

### 8.10 Reports (PDF)

`GET /api/internships/[internshipId]/report` (also aliased at
`/api/manager/internships/[internshipId]/report`, which simply re-exports the
same `GET` handler) streams a generated PDF intern report.

- `src/server/reports/intern-report.ts` — `getInternReportData(internshipId,
  userId)` gathers everything needed for the report (internship lifecycle,
  checklist/skill progress, achievements, reflections, etc.) into a single
  `InternReportData` object (`Awaited<ReturnType<typeof
  getInternReportData>>`).
- `src/server/reports/components/InternReportDocument.tsx` —
  `InternReportDocument({ data })` is a `@react-pdf/renderer` **document**
  component (not standard HTML/DOM JSX — it renders to `<Document>`,
  `<Page>`, `<View>`, `<Text>` primitives from `@react-pdf/renderer`) that
  lays out the PDF: cover/summary section, stage checklist & skill-progress
  breakdown, achievements list, and reflection history.
- The route handler renders the document to a PDF buffer/stream and returns
  it with `Content-Type: application/pdf`, so opening the URL in a browser
  downloads/displays a generated report — used by managers, mentors, and
  interns to export a snapshot of internship progress.

---

## 9. Firestore Data Model

All collections live at the top level except assignment sub-collections,
which are nested under each internship document. Field names below reflect
the Zod schemas described in [Section 8](#8-domain-model).

```
users/{userId}
  email, displayName, active, roles[], identityState,
  identities[{provider, subject}], createdAt, updatedAt

teams/{teamId}
  title, ... (looked up via searchTeams / teamInputSchema)

internships/{internshipId}
  internId, status, currentStage, startsAt, endsAt?,
  createdAt, createdBy, updatedAt, updatedBy

  managerAssignments/{managerUserId}
    userId, startsAt?, endsAt?

  teammateAssignments/{assignmentId}
    teammateUserId, teamId, responsibilities[], startsAt, endsAt?

  teamPlacements/{placementId}
    teamId, startsAt, endsAt?

  statusHistory/{entryId}
    previousStatus, newStatus, changedAt, changedBy, reason?

  stageChecklist/... (progress documents per stage/item — created via
    createInitialStageProgress / updated via updateChecklistItem etc.)

  achievements/{achievementId}
    title, description?, category, achievedOn, linkedStage?, evidenceUrl?,
    author, createdAt, updatedAt, archivedAt?

  progressHub/{weekKey}/... (reflections, mentor check-ins, agenda items,
    shared/private notes, action items — keyed by ISO week)
```

Composite/field-override indexes (`firestore.indexes.json`) are defined for
efficient collection-group queries used when resolving "which internships
does this manager/teammate currently touch" across the entire database:

- `managerAssignments.userId` — collection-scope ascending & descending, plus
  collection-group ascending.
- `teammateAssignments.teammateUserId` — same shape.

These support `listManagedInternships` / `listTeammateInternships`, which
almost certainly run **collection-group queries** across every internship's
`managerAssignments`/`teammateAssignments` sub-collection to find the ones
belonging to a specific user, rather than scanning every internship
document.

---

## 10. Firestore Security Rules

`firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**All direct client access to Firestore is denied**, unconditionally, for
every collection and document. This is intentional and central to the
application's security model: the browser never talks to Firestore directly.
All reads and writes go through Next.js Route Handlers / Server Components
using the **Firebase Admin SDK** (`adminFirestore`,
`src/server/firebase/admin.ts`), which bypasses Security Rules entirely
(Admin SDK access is governed by IAM / service-account permissions, not
Firestore Rules). Authorization is therefore enforced entirely in the
TypeScript server layer (Sections 6 and 7), and the deny-all rule exists as a
defense-in-depth backstop in case a client ever attempted a direct SDK call.
This is explicitly verified by an integration test
(`test/firestore.integration.test.ts`) which asserts that a client-SDK
`getDoc` call is rejected with `permission-denied`.

Rules are deployed independently of app code via
`npm run deploy:firestore-rules` (`scripts/deploy-firestore-rules.ts`), which
does **not** require the Firebase CLI to be logged in (it uses
`GOOGLE_APPLICATION_CREDENTIALS`), applied identically across both the
`(default)` and `europe` databases configured in `firebase.json`.

---

## 11. Server Layer Reference

`src/server/firebase/admin.ts` initializes the singleton Admin SDK app:

```ts
assertSafeFirestoreEnvironment();          // throws if emulator hosts are set in production
const environment = getServerEnvironment();

const adminApp = getApps().length ? getApp() : initializeApp({
  credential: applicationDefault(),
  projectId: environment.projectId,
});

export const adminAuth = getAuth(adminApp);
export const adminFirestore = shouldBlockFirestoreForUnitTests()
  ? blockedFirestore()   // Proxy that throws on any property access
  : getFirestore(adminApp, environment.firestoreDatabaseId);
```

Two safety mechanisms worth calling out explicitly:

1. **Emulator-in-production guard**
   (`src/server/firebase/firestore-safety.ts`,
   `assertSafeFirestoreEnvironment`) — throws
   `"Firebase Emulator hosts must not be configured in production."` if
   `FIRESTORE_EMULATOR_HOST` or `FIREBASE_AUTH_EMULATOR_HOST` is set while
   `NODE_ENV=production`, preventing an accidental emulator-pointed
   production deployment.
2. **Unit-test Firestore block**
   (`shouldBlockFirestoreForUnitTests`) — when running under `NODE_ENV=test`
   *without* an explicit `FIRESTORE_EMULATOR_HOST`, `adminFirestore` is
   replaced with a `Proxy` whose every property access throws
   `"Firestore access is disabled during unit tests. Mock the
   Firebase-dependent service or run the test through the Firestore
   Emulator."` — this makes accidental hosted-Firestore access from a unit
   test fail loudly and immediately instead of silently hitting a real
   database. Integration tests opt back in by starting the emulator and
   setting `FIRESTORE_EMULATOR_HOST` (see `npm run test:integration`).

`src/server/firebase/read-diagnostics.ts` provides an opt-in
(`FIRESTORE_READ_DIAGNOSTICS=1`, development-only) counter that logs how many
times each named "read path" has been invoked — a lightweight tool for
spotting N+1 Firestore reads during development, wired up via
`recordFirestoreReadPath(path)` calls sprinkled through hot paths (e.g.
authorization context resolution).

### Server module map

| Directory | Responsibility |
| ----------- | ----------------- |
| `server/achievements` | Achievement CRUD + validation (`service.ts`). |
| `server/assignments` | Shared date-range domain logic (`domain.ts`), manager/teammate/intern assignment CRUD (`service.ts`), per-internship manager access checks (`manager-access.ts`), API guard helpers (`http.ts`), page guard helpers (`page-auth.ts`). |
| `server/auth` | Firebase session cookie lifecycle, identity-claim validation, origin validation, `AuthenticationError`. |
| `server/authorization` | `AuthorizationContext` resolution, role assertions, `require*` composition helpers, `AuthorizationError`. |
| `server/firebase` | Admin SDK bootstrap, emulator/unit-test safety guards, read diagnostics. |
| `server/guest-dashboard` | Guest-facing cross-internship summary service. |
| `server/internships` | Core internship document schema/parsing (`domain.ts`), repository helpers (`repository.ts`). |
| `server/manager-portfolio` | Attention-signal/metrics/sort-filter pure logic (`domain.ts`) and the full portfolio + detail + mutation service (`service.ts`). |
| `server/progress-hub` | Weekly reflections/check-ins/agenda/notes/action-items service + API guard helper. |
| `server/reports` | PDF report data assembly (`intern-report.ts`) and the `@react-pdf/renderer` document layout (`components/InternReportDocument.tsx`). |
| `server/repositories` | Low-level Firestore access shared across features — currently `app-users.ts` (find/link `AppUser` records). |
| `server/stage-checklists` | Checklist read/update/review/create/delete/complete-stage service + API guard helpers. |
| `server/timeline` | Cross-category event aggregation service. |
| `server/users` | `AppUser`/`ApplicationRole` schema definitions. |

---

## 12. HTTP API Reference

All routes are Next.js Route Handlers under `src/app/api/`. Unless noted,
**mutating routes (`POST`/`PATCH`/`DELETE`) require**: (1) a valid session
cookie, (2) a matching `Origin` header (`hasValidRequestOrigin`), and (3) the
appropriate role via `requireRole`/`requireManagerContext`/equivalents.
Request bodies are Zod-validated; failures return `400` with the first
validation issue's message. Authentication/authorization failures return
`401`/`403` respectively, generally through the shared
`assignmentErrorResponse` (or an equivalent per-feature error mapper).

### 12.1 Auth

| Method | Path | Purpose |
| -------- | ------ | --------- |
| `POST` | `/api/auth/session` | Exchange a Firebase ID token (`{ idToken }`) for an application session cookie. Requires valid origin; auth_time must be ≤5 minutes old. |
| `POST` | `/api/auth/sign-out` | Clears the session cookie. Requires valid origin. |

### 12.2 Internship-scoped (any authorized participant: intern / mentor / manager, depending on the resource)

Base path: `/api/internships/[internshipId]/...`

| Method | Path | Purpose |
| -------- | ------ | --------- |
| `POST`   | `/achievements` | Create an achievement. |
| `PATCH`  | `/achievements/[achievementId]` | Edit an achievement. |
| `POST`   | `/achievements/[achievementId]/archive` | Archive (soft-delete) an achievement. |
| `POST`   | `/achievements/[achievementId]/restore` | Restore a previously archived achievement. |
| `GET`    | `/report` | Stream a generated PDF intern report. |
| `GET`    | `/stage-checklist` | Read the current stage checklist DTO. |
| `PATCH`  | `/stage-checklist/items` | Toggle an item's completion. |
| `PATCH`  | `/stage-checklist/items/review` | Submit/apply a review decision on an item. |
| `POST`   | `/stage-checklist/tasks` | Create a custom checklist task. |
| `DELETE` | `/stage-checklist/tasks` | Delete a custom checklist task. |
| `POST`   | `/stage-checklist/complete` | Complete the current stage (requires all required items done). |
| `POST`   | `/progress-hub/reflection` | Save/submit the intern's weekly reflection. |
| `POST`   | `/progress-hub/check-in` | Save/share the mentor's weekly check-in. |
| `POST`   | `/progress-hub/agenda` | Add/resolve a shared 1:1 agenda item. |
| `POST`   | `/progress-hub/notes/[scope]` | Add a note; `scope` selects shared vs. private-intern vs. private-mentor. |
| `POST`   | `/progress-hub/action-items` | Create an action item. |
| `PATCH`  | `/progress-hub/action-items` | Update an action item's status (open/completed). |

### 12.3 Manager administration

Base path: `/api/manager/...` — all require the `manager` role, and mutating
routes require managing the specific internship in question
(`readManagerMutationAccess`/`assertManagerAccessSnapshots`).

| Method | Path | Purpose |
| -------- | ------ | --------- |
| `POST`   | `/internships` | Create a new internship. |
| `GET`    | `/team-options` | Autocomplete search over teams (`searchTeams`). |
| `POST`   | `/users` | Provision a new (possibly `"pending"`) `AppUser` record. |
| `PATCH`  | `/internships/[internshipId]/expected-end-date` | Update the expected/actual end date. |
| `POST`   | `/internships/[internshipId]/manager-assignments` | Add a manager assignment. |
| `DELETE` | `/internships/[internshipId]/manager-assignments/[managerUserId]` | Remove a manager assignment. |
| `POST`   | `/internships/[internshipId]/status` | Transition internship status (with history recording). |
| `POST`   | `/internships/[internshipId]/team-placements` | Place the intern on a team. |
| `POST`   | `/internships/[internshipId]/teammate-assignments` | Add a teammate (mentor/PM/lead) assignment. |
| `PATCH`  | `/internships/[internshipId]/teammate-assignments/[assignmentId]` | Edit a teammate assignment's responsibilities. |
| `POST`   | `/internships/[internshipId]/teammate-assignments/[assignmentId]/close` | End a teammate assignment early. |
| `GET`    | `/internships/[internshipId]/report` | (Alias) Streams the same PDF report as the internship-scoped route. |

Notes on specific routes:

- `POST /api/manager/internships` and the manager-detail action routes are
  additionally covered by dedicated route-level tests
  (`src/app/api/manager/internships/route.test.ts`).
- The manager portfolio **list** itself (search/filter/sort/paginate) is not
  a JSON API endpoint — it's rendered server-side by the
  `/manager/internships` page (`page.tsx`), which reads `searchParams`,
  calls `normalizeManagerPortfolioQuery` + `getManagerPortfolio` directly in
  the Server Component, and passes the resulting `ManagerPortfolioDto` into
  the `<ManagerPortfolio>` client component as a prop.

### 12.4 Response conventions

- Success responses are plain JSON (`NextResponse.json(...)`), typically
  either `{ ok: true }` for fire-and-forget mutations or the updated/created
  DTO.
- Error responses are `{ error: string }` with the appropriate HTTP status
  (`400` validation, `401` unauthenticated, `403` unauthorized/invalid
  origin).
- The report endpoints return binary PDF content
  (`Content-Type: application/pdf`), not JSON.

---

## 13. Frontend Application Structure

### 13.1 Route map

| Path | Access | Renders |
| ------ | -------- | --------- |
| `/` | Any authenticated user | Redirects based on the user's role(s) (`src/app/page.tsx`). |
| `/sign-in` | Public | `SignInCard` — persona list (dev mode) or Google sign-in button. |
| `/access-disabled` | Authenticated but `AppUser.active === false` | Explains the account is disabled. |
| `/forbidden` | Any authorization failure | Generic "you don't have access" page. |
| `/guest` | `(authenticated)` layout | Guest Dashboard. |
| `/intern` | `requireInternPage()` | Full intern workspace (single scrolling page with anchor-linked sidebar sections: weekly overview, timeline, achievements, reflection, agenda, notes, action items, feedback, private notes, history). |
| `/manager` | `requireManagerPage()` | Manager landing (redirects/links into `/manager/internships`, `/manager/people`). |
| `/manager/internships` | `requireManagerPage()` | Manager Portfolio list (search/filter/sort/paginate). |
| `/manager/internships/[internshipId]` | `requireManagerPage()` + manager-access check | Redirects/wraps into the sectioned detail view. |
| `/manager/internships/[internshipId]/[section]` | Same | Sectioned manager workspace for one internship (lifecycle, status, weekly overview, reflections, achievements, timeline, history, shared agenda, shared notes, mentor-private notes, action items, feedback cycles, assignments, managers). |
| `/manager/people` | `requireManagerPage()` | People/user provisioning admin view. |
| `/teammate` | `requireTeammatePage()` | Mentor workspace landing — list of internships the teammate is attached to. |
| `/teammate/internships/[internshipId]` | Same | Redirects/wraps into sectioned view. |
| `/teammate/internships/[internshipId]/[section]` | Same | Sectioned mentor workspace mirroring the manager's, minus admin-only sections. |

### 13.2 Layout composition

- `src/app/layout.tsx` — root HTML document, global fonts/metadata.
- `src/app/(authenticated)/layout.tsx` — shared shell for every
  authenticated route: resolves the current user/role, renders `AppShell`
  (header + optional `Sidebar`, decided by `shouldShowSidebar`/
  `getSidebarRoleForPath` from `src/config/sidebar.config.ts`).
- `src/components/shared/AppShell.tsx`, `AppShellHeader.tsx`,
  `AppShellBody.tsx` — the chrome: top header (branding, sign-out), and body
  area that conditionally reserves space for the sidebar.
- `src/components/shared/Sidebar.tsx` — renders the role-specific
  `RoleSidebarConfig` (grouped links with icons), highlighting the active
  section.
- `src/components/shared/WorkspacePlaceholder.tsx` — a reusable "nothing to
  show yet" / empty-state block used across feature dashboards.

### 13.3 Section-based single-page workspaces

Manager and teammate internship detail views use a **catch-all `[section]`
route segment** rather than one route per tab — `/manager/internships/[id]/
[section]` and `/teammate/internships/[id]/[section]` — so the sidebar can
deep-link directly into a specific section (`internship-lifecycle`,
`weekly-overview`, `shared-one-on-one-agenda`, `managers`, etc.) while the
page itself fetches the full detail DTO once and renders the requested
section's component. The intern workspace instead renders everything on one
page and uses in-page anchor links (`/intern#achievements`) since interns
only ever see their own, single internship.

### 13.4 Feature components (`src/features/`)

| Feature dir | Key components |
| ------------- | ---------------- |
| `achievements` | `Achievements` — list + create/edit/archive/restore UI. |
| `assignments` | `AssignmentActions`, `TeammateAssignmentActions`, `CloseAssignmentButton`, `CreateInternshipDialog`/`CreateInternshipForm`, `EditResponsibilitiesForm`, `ProvisionUserForm`, `TeammateAssignmentForm`, `TeamPlacementForm`. |
| `auth` | `SignInCard`, `SignOutButton`. |
| `guest-dashboard` | `GuestDashboard`. |
| `internships` | `InternshipLifecycle` — visual stage/status progression widget. |
| `manager-portfolio` | `ManagerPortfolio` (the searchable/sortable list), `ManagerStatusActions`, `ManagerAssignmentActions`, `ExpectedEndDateAction`, `ManagerWorkspaceShell` (aliased as `WorkspaceShell`). |
| `progress-hub` | `ProgressHub` — the large, multi-section weekly-collaboration component (reflection, check-in, agenda, notes, action items), parameterized by `ProgressHubSection`. |
| `stage-checklists` | `StageChecklist` — renders required/recommended items, skill-progress bars, review controls. |
| `timeline` | `InternshipTimeline` — grouped/paginated event feed. |

Each feature typically has a colocated `*.test.tsx` file using
`@testing-library/react` + `vitest` + `jsdom`.

---

## 14. UI Components & Design System

- **`components.json`** configures `shadcn/ui` with style `base-nova`, base
  color `neutral`, CSS variables enabled, and path aliases
  (`@/components`, `@/lib`, `@/components/ui`, `@/hooks`). Icons come from
  `lucide-react`.
- **`src/components/ui/`** — reusable, domain-agnostic primitives:
  - `Button.tsx` — exports `Button` + `buttonVariants` (a
    `class-variance-authority` variant map — sizes/intents).
  - `Modal.tsx` — a controlled modal/dialog wrapper (used by
    `CreateInternshipDialog` and other form flows); per `AGENTS.md`, any form
    rendered in a modal must close the modal on successful submission.
  - `Menu.tsx` — a generic dropdown/menu component (`MenuItem` type).
  - `Breadcrumbs.tsx` — `BreadcrumbItem`/`Breadcrumbs` for page-path
    navigation aids inside manager/mentor sectioned views.
- **Styling** — Tailwind CSS v4 configured via `postcss.config.mjs`
  (`@tailwindcss/postcss` plugin) and theme tokens declared directly in
  `src/app/globals.css` (Tailwind v4's CSS-first configuration — no separate
  `tailwind.config.js`).
- **Two visual themes coexist**:
  1. A light, "brand" themed surface (uses CSS variables like
     `--brand`, `--brand-soft`, `--brand-strong`) for most of the app.
  2. A **dark "manager/mentor workspace" theme**
     (`src/lib/manager-workspace/theme.ts`, `managerTheme` +
     `workspaceStyles("dark")`) — a GitHub-dark-inspired palette
     (`#0d1117`/`#161b22` backgrounds, emerald accent) applied specifically
     inside the manager/mentor sectioned internship workspaces and the
     `/manager/people`, `/guest`, `/intern`, `/teammate`, `/forbidden` routes.
     `isDarkWorkspacePath(pathname)` (`src/lib/workspace/paths.ts`) is the
     single source of truth for which routes render in the dark theme.
     `workspaceStyles(variant)` returns a full set of Tailwind class strings
     (cards, inputs, buttons, badges, progress bars, lifecycle-stage
     indicators, status pills, etc.) so feature components stay
     theme-agnostic and simply call `workspaceStyles("dark")` or
     `workspaceStyles()` (light/default) based on context.
- `src/lib/utils.ts` — `cn(...)` (the standard `clsx` + `tailwind-merge`
  className combinator) and `formatDate(value)` (formats an ISO date/time
  string as `MM/DD/YYYY` in the fixed `progressHubTimeZone`, so displayed
  dates are consistent regardless of viewer locale).

---

## 15. Sidebar & Navigation

`src/config/sidebar.config.ts` defines one `RoleSidebarConfig` per sidebar
role (`manager | intern | teammate` — note `guest` has no sidebar config, the
Guest Dashboard is a single page):

- **`internSidebarConfig`** — a flat `general` group list of anchor links
  into the single `/intern` page (Overview & Progress, Weekly Reflection, 1:1
  & Collaboration, Personal Workspace).
- **`managerSidebarConfig`** — an empty `general` array and a `workspace`
  group list of **relative** hrefs (`internship-lifecycle`,
  `weekly-overview`, ...) that resolve against the current
  `/manager/internships/[internshipId]/` base — i.e., these are section keys
  for the `[section]` catch-all route, grouped into Overview & Lifecycle,
  Progress & Reflection, 1:1 & Collaboration, and Team & Administration
  (Assignments, Manage assignments).
- **`mentorSidebarConfig`** — a `general` entry linking back to `/teammate`
  (the internship list) plus a `workspace` group list mirroring the manager's
  sections minus admin-only items, with an added Feedback & Evaluation group
  (Feedback cycles, Status history).

Helper functions:

- `isSidebarRole(role)` — type guard.
- `getSidebarRoleForPath(pathname, roles)` — decides which role's sidebar
  (if any) applies to the current route, cross-referenced against the
  visitor's actual roles (e.g. a manager viewing `/teammate/...` — if they
  also hold the `teammate` role — gets the mentor sidebar, not the manager
  one, because it matches on path prefix first).
- `shouldShowSidebar(pathname, roles)` — `true` iff
  `getSidebarRoleForPath` returns non-null; drives whether `AppShell`
  reserves sidebar layout space at all (e.g., `/manager` itself and
  `/manager/people` do not get the manager per-internship sidebar; only
  `/manager/internships/[id]/...` does, per the regex
  `/^\/manager\/internships\/[^/]+/`).

---

## 16. Testing Strategy

Four distinct test layers, each with its own config and npm script:

### 16.1 Unit tests (`npm test` / `npm run test:watch`)

- Runner: Vitest, config `vitest.config.ts`.
- Environment: `node` (not `jsdom` by default at the config level; individual
  React-component tests presumably set `// @vitest-environment jsdom` or rely
  on `@testing-library/react` + `jsdom` devDependency per-file, since
  `jsdom` is listed as a devDependency and component tests like
  `SignInCard.test.tsx`, `Achievements.test.tsx`, `GuestDashboard.test.tsx`,
  `ProgressHub.test.tsx`, `StageChecklist.test.tsx` render real React trees.)
- **Excludes**: `**/*.integration.test.ts` and `e2e/**`.
- Path alias: `@` → `src`; `server-only` is aliased to a no-op stub
  (`test/server-only.ts`, which just does `export {};`) so server-only
  modules can be imported and unit-tested without triggering Next.js's
  client/server boundary enforcement (which only applies inside the actual
  Next.js bundler, not Vitest).
- Firestore is **blocked** during unit tests unless
  `FIRESTORE_EMULATOR_HOST` is explicitly set (see
  [Section 11](#11-server-layer-reference)) — services that need Firestore
  are tested either through pure-logic exports (domain functions, Zod
  schemas) or mocked, not through a live database.
- The `test` script explicitly unsets `GOOGLE_APPLICATION_CREDENTIALS`
  (`env -u GOOGLE_APPLICATION_CREDENTIALS vitest run`) so unit tests can
  never accidentally use a hosted service account.
- Coverage tooling available via `@vitest/coverage-v8` devDependency (not
  wired into a dedicated script by default, invocable with `vitest run
  --coverage`).

Representative unit-test coverage across the codebase (non-exhaustive, based
on colocated `*.test.ts(x)` files): environment parsing (client/server),
origin validation, session-claim validation, role authorization, Firestore
safety guards, week/date math, skill-progress calculation, checklist
templates (structural invariants + exact content assertions per stage),
achievement input validation, assignment domain math (ranges/overlaps),
manager-portfolio required-item completion logic, progress-hub service
schemas, stage-checklist service, `formatDate`, and multiple feature
components (`Achievements`, `GuestDashboard`, `InternshipLifecycle`,
`ProgressHub`, `SignInCard`, `StageChecklist`) plus a couple of API route
tests (`api/auth/session/route.test.ts`,
`api/manager/internships/route.test.ts`,
`app/(authenticated)/manager/internships/[internshipId]/page.test.tsx`,
`app/(authenticated)/intern/page.test.tsx`).

### 16.2 Integration tests (`npm run test:integration`)

- Runner: Vitest, config `vitest.integration.config.ts` (`include:
  ["**/*.integration.test.ts"]`, `testTimeout: 20_000`).
- The npm script wraps the run in `firebase emulators:exec --project
  demo-fluxon-internships-test --only auth,firestore "vitest run --config
  vitest.integration.config.ts"` with hard-coded emulator-friendly
  environment variables (`FIREBASE_PROJECT_ID`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, both authentication-mode variables set
  to `email-password-development`, a dummy `NEXT_PUBLIC_FIREBASE_API_KEY`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost`, and
  `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`). The Firebase CLI
  starts and stops fresh, isolated Auth/Firestore emulator instances around
  the test run automatically — no manually-started Terminal 1 is required,
  and this **must never** be pointed at a hosted project.
- Example: `test/firestore.integration.test.ts` — verifies (a) the server
  repository (`findAppUserByFirebaseUid`) can read a seeded document through
  the Admin SDK, and (b) a **client-side** Firestore SDK read of the same
  document is rejected with `permission-denied`, proving the deny-all
  Security Rules are actually enforced against a real (emulated) backend.

### 16.3 End-to-end tests (`npm run test:e2e`)

- Runner: Playwright, config `playwright.config.ts`.
- `testDir: "./e2e"` — currently contains `sign-in.spec.ts`.
- `webServer` config runs `npm run dev -- --hostname localhost` automatically
  (reused if already running outside CI) and waits on
  `http://localhost:3000/sign-in`.
- The npm script chains `npm run seed:development && playwright test` — so
  e2e tests assume the Emulator Suite is already running (per the README's
  three-terminal workflow) and depend on the seeded development personas.
- Single project configured: Desktop Chrome (`chromium`).
- CI-only settings: `forbidOnly` when `CI` is set, 2 retries in CI, HTML
  reporter, trace capture `"on-first-retry"`.

### 16.4 Static checks

- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`), extending
  `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets, with
  build artifacts (`.next`, `out`, `build`, `coverage`, `next-env.d.ts`)
  globally ignored.
- `npm run typecheck` — `tsc --noEmit` against `tsconfig.json` (`strict:
  true`, `target: ES2017`, `moduleResolution: "bundler"`, path alias `@/*` →
  `./src/*`).
- `npm run format` / `npm run format:check` — Prettier 3
  (`.prettierrc.json`/`.prettierignore`).

### 16.5 Combined validation

`npm run validate` = `lint && typecheck && test && build`, i.e. the full
non-integration, non-e2e gate — this is exactly what CI runs (see
[Section 20](#20-build-validation--ci)).

---

## 17. Scripts

All scripts live in `scripts/` and are written in TypeScript, executed with
`tsx`.

### 17.1 `scripts/seed-development.ts` (`npm run seed:development` /
`npm run seed:emulator`)

- Loads `.env.local` via `@next/env`'s `loadEnvConfig`.
- **Hard guard**: requires `FIREBASE_PROJECT_ID` to be set and
  `FIREBASE_AUTHENTICATION_MODE === "email-password-development"` — refuses
  to run against a `google`-mode (production-shaped) configuration, to avoid
  ever seeding development-only fake accounts into a production project.
- Initializes the Admin SDK app (`applicationDefault()` credentials) and
  `firebase-admin/auth` + `firebase-admin/firestore` clients, honoring
  `FIRESTORE_DATABASE_ID`.
- Creates/updates a fixed set of **development personas** (each with a
  well-known email, a fixed local-only password
  `"local-only-password"`, and `roles`), including:
  - `manager@example.com` / `manager@fluxon.com` — two `manager` personas.
  - `mentor@example.com` / `mentor@fluxon.com` — two `teammate` personas.
  - `intern@example.com` / `intern@fluxon.com` — two `intern` personas.
  - A set of **portfolio demo interns** specifically crafted to exercise
    every Manager Portfolio state: `portfolio-active`, `portfolio-paused`,
    `portfolio-completed`, `portfolio-cancelled`, `portfolio-final-review` —
    giving reviewers/testers a ready-made portfolio spanning every status and
    the "final review awaiting decision" attention signal without manual
    setup.
  - A `guest` persona.
- Uses `getCurrentWeek()` and `stageChecklistTemplates` (imported directly
  from `src/lib`, keeping the seed data structurally consistent with the
  live application's own template/week logic rather than hard-coding
  duplicate values) to seed realistic in-progress checklist/progress-hub
  data for at least one persona.
- Writes corresponding Firestore documents (`users`, `internships`, and
  their sub-collections) using `FieldValue`/`Timestamp` from
  `firebase-admin/firestore`.

### 17.2 `scripts/deploy-firestore-indexes.ts` (`npm run
deploy:firestore-indexes`)

- Reads `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, and
  `FIRESTORE_DATABASE_ID` from the environment and deploys
  `firestore.indexes.json` to the targeted database. Requires the
  service account to hold `roles/datastore.indexAdmin` in the target Google
  Cloud project. Index builds are asynchronous — Firebase Console must show
  them as "enabled" before dependent queries will succeed.

### 17.3 `scripts/deploy-firestore-rules.ts` (`npm run
deploy:firestore-rules`)

- Deploys `firestore.rules` to the target project/database(s) using the
  service account credentials directly (does not require an interactive
  `firebase login`).

---

## 18. Local Development Setup

Condensed from `README.md` (see the file itself for the complete,
step-by-step version with Windows-specific notes):

1. **Prerequisites**: Git, Node.js `22.13.0` (or `>=20.19.0`/`>=22.13.0` per
   `package.json`), npm, NVM (recommended), Java 21 (for the Firestore
   Emulator), and the Firebase CLI (installed automatically as a
   `devDependency` via `firebase-tools` — no separate global install
   needed).
2. **Clone** the repository and `cd` into it.
3. **Install Node.js**: `nvm install && nvm use` (reads `.nvmrc`).
4. **Install dependencies**: `npm install`.
5. **Create `.env.local`**: `cp .env.example .env.local`, then fill in your
   own Firebase Web App config (see [Section 5.3](#53-envlocal-template-development)).
6. **One-time hosted Firebase setup** (used for initial configuration, index
   verification, and a final smoke test — not for daily development):
   - Create a Firebase project; register a Web App; copy `apiKey`,
     `authDomain`, `projectId` into `.env.local`.
   - Enable the **Email/Password** sign-in provider.
   - Create the default Firestore database (Production mode, a development
     region).
   - Generate a service-account key (Project settings → Service accounts →
     Generate new private key), store it **outside the repository**, and
     point `GOOGLE_APPLICATION_CREDENTIALS` at its absolute path. Treat this
     file like a password — never commit, upload, or share it.
   - Run `npm run seed:development` to create hosted development users/data.
   - Grant the service account `roles/datastore.indexAdmin` and run `npm run
     deploy:firestore-indexes`; also run `npm run deploy:firestore-rules`.
   - Start `npm run dev` and confirm sign-in works at
     `http://localhost:3000/sign-in`.
7. **Install Java 21** for the Firestore Emulator (`brew install openjdk@21`
   on macOS; a JDK 21 package on Windows/Linux).
8. **Daily development**: use the Firebase Emulator Suite (see
   [Section 19](#19-firebase-emulator-workflow)) instead of hosted Firebase —
   it doesn't consume quota, works when hosted quota is exhausted, and can be
   reset/reseeded freely.
9. **Run project checks**: `npm run format:check`, `npm run lint`, `npm run
   typecheck`, `npm test`, `npm run test:integration`, `npm run test:e2e`,
   `npm run build && npm run start`, or the combined `npm run validate`.
10. **Firebase/credential safety** reminders: never commit `.env.local` or a
    service-account key; never use a shared real service-account key; always
    confirm whether a command targets hosted Firebase or the emulator before
    seeding; unit tests must never touch hosted Firestore; if emulator
    development unexpectedly connects to hosted Firebase, stop immediately
    (Ctrl+C) and re-check every emulator environment variable before
    restarting.
11. **Stop/restart**: Ctrl+C in each terminal; emulator data is ephemeral and
    disappears on stop — restart the emulator and rerun the seed script to
    get sample data back.

---

## 19. Firebase Emulator Workflow

The recommended day-to-day workflow uses **three terminals**:

| Terminal | Command (representative) | Purpose |
| ---------- | --------------------------- | --------- |
| 1 | `npm run emulators` (`firebase emulators:start --only auth,firestore`) | Starts persistent local Auth (port `9099`) + Firestore (port `8080`) emulators, plus the Emulator UI (port `4000`). Keep this running. |
| 2 | `npm run seed:emulator` | Seeds the running emulators with development users/data (wraps the seed script in `firebase emulators:exec` against project `demo-fluxon-internships-test`). |
| 3 | `npm run dev` (with emulator env vars set: `FIREBASE_PROJECT_ID=demo-fluxon-internships-test`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-fluxon-internships-test`, both auth-mode vars set to `email-password-development`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`) | Runs the Next.js dev server pointed at the local emulators. |

**Both project IDs across every terminal must match exactly**
(`demo-fluxon-internships-test`); a mismatch typically presents as sign-in
appearing to succeed while `POST /api/auth/session` returns `401
Unauthorized`.

**Development personas** available on the sign-in page in this mode:

| Persona | Use it to test |
| --------- | ----------------- |
| Manager | manager pages and manager actions |
| Mentor  | mentor/teammate views |
| Intern  | intern workflows |
| Guest   | signed-in access without a role-specific account |

**Emulator UI** (Terminal 1 running): `http://127.0.0.1:4000/auth` (local
Auth users), `http://127.0.0.1:4000/firestore` (local Firestore documents).

**Emulator Suite vs. hosted Firebase** — use the emulator for daily feature
development, local/integration testing, safe data experiments, and whenever
hosted quota is exhausted; reserve hosted Firebase for initial project
configuration, verifying that indexes actually build in a real environment,
and a final sign-in smoke test before considering a change complete.

---

## 20. Build, Validation & CI

### 20.1 Build & run

```bash
npm run build   # NEXT_PUBLIC_AUTHENTICATION_MODE=google FIREBASE_AUTHENTICATION_MODE=google next build
npm run start   # same env vars; next start
```

Both scripts pin the authentication mode to `google` explicitly, so a
production build/start can never accidentally ship with the
development-password sign-in flow enabled, regardless of what's in the local
shell's environment.

### 20.2 `npm run validate`

Runs `lint && typecheck && test && build` — the standard "is this change
safe to merge" gate a contributor should run locally before opening a PR.

### 20.3 Continuous Integration (`.github/workflows/ci.yml`)

Triggers: every pull request, and every push to `main`.

Job `validate` (Ubuntu, 20-minute timeout):

1. Checkout (`actions/checkout@v4`).
2. Set up Node.js `22.13.0` with npm caching (`actions/setup-node@v4`).
3. `npm ci` (clean, lockfile-exact install).
4. `npm run lint`.
5. `npm run typecheck`.
6. `npm test` (unit tests only — no emulator involved in CI).
7. `npm run build`, with `FIREBASE_PROJECT_ID` and
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID` both set to a placeholder
   (`ci-build-project`) purely so `getServerEnvironment()`'s production
   validation passes during Next.js's page-data collection step — the CI
   build never actually connects to any Firebase project.

Notably, CI does **not** run `test:integration` or `test:e2e` — those require
a running Firebase Emulator Suite and are intended to be run locally
(the integration script does spin its own emulators via `firebase
emulators:exec`, so it *could* be added to CI, but as configured it is a
developer-run check).

---

## 21. Deployment (Firebase App Hosting)

The application is deployed via **Firebase App Hosting**
(`apphosting.yaml`, backend ID `internship-dashboard`, configured in
`firebase.json` under `"apphosting"`).

**Runtime configuration** (`runConfig`): `minInstances: 0` (scales to zero),
`maxInstances: 3`, `concurrency: 80` requests per instance, `cpu: 1`,
`memoryMiB: 512`.

**Environment variables** injected by App Hosting (see
[Section 5.4](#54-production-values-apphostingyaml) for the full table) —
key points:

- `APP_ORIGIN` must always equal the domain actually serving the app, or
  session creation breaks; the file contains an inline comment reminding
  whoever edits it to switch to the custom domain (`internhub.pp.ua`) and
  redeploy once that domain mapping is live, and to re-register its
  `/__/auth/handler` redirect URI with Firebase Auth at the same time.
- `FIRESTORE_DATABASE_ID=europe` — production data lives in a named,
  region-specific Firestore database, not the default one.
- Firebase Web App config (`NEXT_PUBLIC_FIREBASE_API_KEY`,
  `..._AUTH_DOMAIN`, `..._PROJECT_ID`) is pinned explicitly rather than
  relying on App Hosting's automatic injection, specifically so
  `authDomain` matches the app's own serving origin — this, combined with
  the `/__/auth/*` rewrite in `next.config.ts`, avoids the third-party
  storage restrictions modern browsers place on `*.firebaseapp.com` during
  `signInWithRedirect`.
- App Hosting's `ignore` list excludes `node_modules`, `.git`,
  `firebase-debug*.log`, and `functions` from the deployment bundle.

**`firebase.json`** also configures the emulator ports used locally (`auth:
9099`, `firestore: 8080`, `ui: 4000`, `singleProjectMode: false`) and applies
the same `firestore.rules`/`firestore.indexes.json` pair to both the
`(default)` and `europe` databases, so rules/indexes stay identical across
databases even though production traffic only uses `europe`.

**Security headers** — `next.config.ts` sets `Referrer-Policy:
strict-origin-when-cross-origin`, a locked-down `Permissions-Policy` (camera,
microphone, and geolocation all disabled), `X-Content-Type-Options: nosniff`,
and `X-Frame-Options: DENY` on every route except `/__/auth/*` (which is
excluded so Firebase Auth's proxied redirect-helper iframe isn't blocked by
the app's own frame-denial policy). `poweredByHeader: false` removes the
`X-Powered-By: Next.js` response header.

---

## 22. Security Considerations

A summary of the defense-in-depth measures observed throughout the codebase:

1. **No direct client Firestore access** — `firestore.rules` denies
   everything; all data access goes through server-only Admin SDK code,
   verified by an integration test.
2. **Strict origin checking on mutations** — every state-changing request
   (`POST`/`PATCH`/`DELETE`) validates the `Origin` header against a
   server-configured `APP_ORIGIN` before doing any other work, mitigating
   CSRF against the `httpOnly` session cookie.
3. **`httpOnly`, `sameSite=lax`, `secure`-in-production session cookie** —
   not readable by client JavaScript, not sent on top-level cross-site
   navigations that would enable classic CSRF, and only sent over HTTPS in
   production.
4. **Short-lived proof of authentication before minting a long session** —
   `assertRecentAuthentication` requires the underlying Firebase sign-in to
   have happened within 5 minutes before it will be exchanged for a (much
   longer, default 5-day) application session cookie.
5. **Explicit identity-provider allowlisting** — only `google.com` (always)
   and `password` (only in `email-password-development` mode, which is
   itself unavailable in production) are accepted sign-in providers;
   verified email is mandatory.
6. **Environment-variable cross-checks** prevent classes of misconfiguration
   at boot/build time rather than at request time: mismatched client/server
   project IDs, mismatched authentication modes, emulator hosts configured
   in production, and missing production project IDs all throw immediately.
7. **Server-only module boundary** (`import "server-only"`) prevents
   Firebase Admin credentials and Firestore access code from ever being
   bundled into client JavaScript, enforced by Next.js at build time.
8. **Role AND resource-level authorization** — holding the `manager` role is
   necessary but not sufficient to mutate a given internship; the specific
   manager-assignment document must exist, be current, and belong to the
   requesting user, checked transactionally where multiple documents must
   stay consistent.
9. **Input validation everywhere** — every API request body, and every
   Firestore document read back out, is parsed through a Zod schema, so
   malformed or unexpected data is rejected rather than silently coerced.
10. **URL scheme allowlisting for user-supplied links** — achievement
    `evidenceUrl` values must be `http`/`https`, preventing
    `javascript:`-scheme stored-link attacks.
11. **Locked-down HTTP security headers and disabled browser permissions**
    (camera/microphone/geolocation) at the framework level.
12. **Secrets hygiene** — `.env.local` and service-account JSON files are
    git-ignored and repeatedly called out in the README as never to be
    committed, uploaded, or shared; the seed script explicitly refuses to
    run outside `email-password-development` mode so it can't accidentally
    write fake accounts into a `google`-mode (production) project.

---

## 23. Coding Conventions (AGENTS.md)

The repository's `AGENTS.md` documents conventions that apply to both human
contributors and AI coding agents working in this codebase:

- **Implementation plans** — store any implementation plan documents in a
  root-level `plans/` directory, named `{FEATURE}.IMPLEMENTATION_PLAN.md`
  using an uppercase, concise feature name (e.g.
  `INTERNSHIPS.IMPLEMENTATION_PLAN.md`).
- **Domain labels** — when a domain value needs a user-facing label (e.g.
  teammate responsibilities, achievement categories, internship
  statuses/stages), define the value and its label together in **one**
  exported constant (the `{ value, label }[]` array pattern used throughout
  `src/lib/**/types.ts`), and derive types, validation, and UI select-options
  from that single source rather than maintaining parallel lists.
- **Feature DTOs** — define shared server-to-client data-transfer types in a
  feature-scoped shared module (`src/lib/{feature}/types.ts`). Both server
  queries and client components must consume those DTOs instead of
  redeclaring equivalent local interfaces.
- **Feature organization** — group feature-specific code by feature within
  each application layer:
  - UI components and form logic → `src/features/{feature}/`
  - server domain logic, services, feature HTTP helpers → `src/server/{feature}/`
  - shared DTOs and other browser-safe feature contracts → `src/lib/{feature}/`
  - feature tests live next to the code they cover.

  Code only belongs in a cross-cutting shared location when it's genuinely
  used by multiple features. Reusable, domain-agnostic UI primitives (e.g.
  dialogs/modal wrappers) belong in `src/components/ui/`, not inside a
  feature directory.
- **Component file naming** — name React component files after their
  exported component using PascalCase (e.g. `Modal.tsx`, `Button.tsx`) for
  both shared and feature components; retain the framework-required Next.js
  filenames (`page.tsx`, `layout.tsx`) where the App Router requires them.
- **Forms** — use controlled inputs for interactive form fields (state held
  in React state and submitted from that state) rather than relying on
  `defaultValue`, `defaultChecked`, or `FormData` as the source of truth.
  When a form is rendered inside a modal, the modal must close automatically
  after a successful submission.

---

## 24. Troubleshooting

Consolidated from the README's troubleshooting section:

| Symptom | Likely cause / fix |
| --------- | --------------------- |
| Wrong Node.js version | Run `nvm install && nvm use` again, or manually install a supported version and re-check with `node --version`. |
| `npm install` fails | Confirm you're in the repo root with a supported Node.js version; retry; check for network/proxy/registry issues. |
| `.env.local` is missing | `cp .env.example .env.local`, fill in Firebase values, restart the app. |
| Java cannot be found | Install Java 21, run `java -version`, follow any PATH instructions from your package manager, open a new terminal. |
| Firebase Authentication is not enabled | In Firebase Console → Authentication → Sign-in method, enable Email/Password and save; rerun the seed command if already seeded. |
| Firebase CLI says no project is active | `.firebaserc` doesn't store a hosted project ID by default; start emulators with `npm run emulators -- --project demo-fluxon-internships-test`. |
| Firestore database is missing | Create the default `(default)` database in Firebase Console, then reseed (hosted or emulator). |
| Hosted seed can't find service-account credentials | Ensure `GOOGLE_APPLICATION_CREDENTIALS` is an absolute path to an existing file outside the repo, that `FIREBASE_PROJECT_ID` matches the key's `project_id`, and that no emulator variables are set. |
| Index deployment reports insufficient permission | Grant the service account `roles/datastore.indexAdmin` in the project's IAM settings, then rerun `npm run deploy:firestore-indexes`. |
| A persona sign-in returns `400 Bad Request` | The local user may not exist in the currently-running emulator; rerun the Terminal 2 seed command with matching emulator hosts/project ID and try again. |
| `POST /api/auth/session` returns `401 Unauthorized` | Browser and app must use the same project ID and authentication mode; for emulator work both should be `demo-fluxon-internships-test` / `email-password-development`; restart Terminal 3 after fixing. |
| Emulator project ID mismatch | Use `demo-fluxon-internships-test` consistently in `FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and in the seed command; don't mix a different ID into only one terminal. |
| App unexpectedly connects to hosted Firebase | Stop the app; check `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` in the Next.js terminal; set them correctly; confirm both project IDs; restart before seeding again. |
| A port is already in use | Ctrl+C the old process, or find/close whatever is using port `3000`, `4000`, `8080`, or `9099`; retry. |
| Emulator data disappeared | Expected after stopping the emulators — restart Terminal 1 and rerun the Terminal 2 seed command. |
| A Firestore index is missing | Hosted: set the hosted project/service-account, run `npm run deploy:firestore-indexes`, wait for "enabled" in Firebase Console. Local: make sure the emulators started with the repo's configuration; restart if needed. |

---

## 25. Glossary

| Term | Meaning |
| ------ | --------- |
| **AppUser** | The Firestore-backed application identity/profile record (`users/{id}`), distinct from the raw Firebase Authentication identity. |
| **AuthenticatedUser** | The minimal identity derived directly from a verified Firebase session (`uid`, `email`, `displayName`, `emailVerified`) — proof of *who*, not *what they can do*. |
| **AuthorizationContext** | The resolved combination of an `AuthenticatedUser` and their `AppUser` record's state (`notInvited` / `disabled` / `appUser`) — the basis for all `assertRole`/`requireRole` checks. |
| **DTO** | Data Transfer Object — a plain, JSON-serializable, browser-safe type (defined under `src/lib/{feature}/types.ts`) representing exactly what a server service returns to a client component. |
| **Internship lifecycle** | The combination of `status` (active/paused/completed/cancelled) and `currentStage` (onboarding → ... → finalReview) that together describe where an internship stands. |
| **Attention signal** | A computed, rule-based flag (e.g. "Overdue actions") surfaced on the Manager Portfolio to highlight internships needing manager attention. |
| **Progress Hub** | The week-scoped collaboration surface: reflections, mentor check-ins, shared agenda, notes, and action items. |
| **Week key** | An ISO-8601 week identifier (`YYYY-Www`) computed in the fixed `Europe/Uzhgorod` application time zone, used to key all Progress Hub weekly entities. |
| **Stage checklist** | The set of required/recommended tasks (template + custom) an intern must/should complete within the current internship stage, each worth skill points toward the 8-dimension skill model. |
| **Persona** | One of the fixed development sign-in identities (Manager, Mentor, Intern, Guest) created by the seed script for local/email-password-development testing. |
| **Manager mutation context** | The combined origin-validation + `manager`-role authorization check required before any manager-initiated write operation. |
| **Dark workspace theme** | The GitHub-dark-inspired visual theme (`managerTheme`/`workspaceStyles("dark")`) applied to manager/mentor per-internship sections and several other routes, as determined by `isDarkWorkspacePath`. |

---

*This document was generated from a full read-through of the
`internship-dashboard-bootcamp` source tree (application code, configuration,
tests, and the project README/AGENTS.md), and reflects the codebase as
provided at the time of writing. If the source changes, regenerate or update
this document accordingly.*
