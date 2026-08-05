# Fluxon Internship Dashboard

This is an Internship Dashboard application for working with different
internship roles and workflows. You will use it to practise running a web
application locally, signing in as different development personas, and making
changes safely.

Follow the steps in order. The commands below are intended for macOS, Linux,
or a terminal such as Git Bash. Windows notes are included where they matter.

## 1. Prerequisites

Install or have access to:

- Git;
- Node.js 22.13.0 (the version in .nvmrc); the project also accepts Node.js 20.19.0 or newer, or 22.13.0 or newer, according to package.json;
- npm, which is included with Node.js;
- NVM, recommended because it reads .nvmrc;
- Java 21, required by the Firebase Firestore Emulator;
- the Firebase CLI. This repository installs the CLI through the firebase-tools development dependency, so a separate global Firebase CLI installation is not required.

Check the tools you already have:

```bash
git --version
node --version
npm --version
java -version
```

Each command prints the installed version. Use Node.js 22.13.0 and a Java 21
runtime for the smoothest setup.

## 2. Clone the repository

```bash
git clone <repository-url>
cd internship-dashboard-bootcamp
```

Replace <repository-url> with the URL supplied by your teacher or team. The
second command moves into the new project directory.

## 3. Install Node.js

If NVM is installed, run:

```bash
nvm install
nvm use
node --version
```

nvm install reads the exact version from .nvmrc, nvm use selects it for
the current terminal, and node --version should print v22.13.0.

If you do not use NVM, install a supported Node.js version manually and check
it with node --version.

## 4. Install dependencies

```bash
npm install
```

This installs the packages listed in package.json and uses the locked
versions in package-lock.json. It also makes the repository's Firebase CLI
available to the npm scripts.

## 5. Create local environment configuration

```bash
cp .env.example .env.local
```

This copies the template into .env.local. The new file is local
configuration, is ignored by Git, and must never be committed or shared.

For your own Firebase development project, fill in the Firebase Web App values
and project ID in .env.local. The important values look like this:

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

The NEXT_PUBLIC_FIREBASE_* values come from your Firebase Web App
configuration. They are public Firebase configuration, not service-account
secrets. FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID must be the
same value. The two authentication mode values must also be the same.

GOOGLE_APPLICATION_CREDENTIALS is required when the hosted development
project is used by the seed or other server-side Firebase workflow. It points
to a service-account JSON file stored outside this repository. You do not need
that key for the emulator-only commands when they are run with the emulator
variables shown later.

FIRESTORE_DATABASE_ID is optional. Leave it unset (or `(default)`) to use the
project's default Firestore database. Set it to a named database ID (for
example `europe`) to target a different Firestore database in the same
project, such as a region-specific database created to reduce latency.

Leave the SESSION_COOKIE_NAME and SESSION_MAX_AGE_SECONDS values from the
template unchanged unless your teacher tells you otherwise. Do not uncomment
the emulator variables for hosted work.

## 6. One-time hosted Firebase setup

Create your own Firebase development project. Hosted Firebase uses quota and
keeps data after you stop the app, so use it for initial setup, index
verification, and a final sign-in check rather than for everyday experiments.

### 6.1 Create the Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In Project settings, register a **Web app** in that project.
3. Copy the Web App configuration values for apiKey, authDomain, and projectId into .env.local.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password** and save.
5. In **Build → Firestore Database**, create the default database named (default). Choose the development region and Production mode.

The Email/Password provider is the authentication mode used by the development
personas in this repository.

### 6.2 Create the service-account file when hosted access is needed

1. In Firebase Project settings, open **Service accounts**.
2. Choose **Generate new private key** and download the JSON file.
3. Move it outside the repository, for example into a private credentials folder.
4. Set GOOGLE_APPLICATION_CREDENTIALS in .env.local to its absolute path.
5. Make sure the JSON file's project_id is your development project ID.

Treat this JSON file as a password. Never commit it, upload it, or use a key
shared by several people.

### 6.3 Seed hosted development data

Make sure FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, and
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST are unset or commented out. Then run:

```bash
npm run seed:development
```

The script creates the development users and sample data in the hosted project.
It only runs when FIREBASE_AUTHENTICATION_MODE=email-password-development and
requires FIREBASE_PROJECT_ID plus GOOGLE_APPLICATION_CREDENTIALS.

### 6.4 Deploy or verify Firestore indexes

The existing deployment script needs a service account with the minimum
required Google Cloud IAM role **Cloud Datastore Index Admin**:
roles/datastore.indexAdmin.

Grant that role in the development project's Google Cloud IAM settings, then
run:

```bash
npm run deploy:firestore-indexes
```

The command reads FIREBASE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, and
FIRESTORE_DATABASE_ID from .env.local, so it targets whichever database is
currently configured. Index builds can be asynchronous, so wait until Firebase
Console shows them as enabled before testing a page that needs them.

Security rules can be deployed the same way, without needing the Firebase CLI
to be logged in:

```bash
npm run deploy:firestore-rules
```

### 6.5 Start and verify hosted sign-in

With the emulator variables still unset, run:

```bash
npm run dev
```

This starts the Next.js development server. Open
[http://localhost:3000/sign-in](http://localhost:3000/sign-in), choose a local
persona, and confirm that the application opens after sign-in. The sign-in
screen supplies the development password automatically.

## 7. Install Java for the Firestore Emulator

The Firestore Emulator requires Java. Java 21 is the version used for this
repository's emulator setup.

On macOS with Homebrew:

```bash
brew install openjdk@21
java -version
```

The first command installs Java 21 and the second confirms that the terminal
can find it. If Homebrew prints an additional PATH or JDK registration command,
follow that instruction and run java -version again.

On Windows or Linux, install a JDK 21 distribution using the operating
system's package manager or the JDK provider's installer, then verify it with
java -version. If the command is not found, add the JDK's bin directory to
your PATH and open a new terminal.

## 8. Recommended daily workflow: Firebase Emulator Suite

Use the Firebase Emulator Suite for normal feature development because it does
not consume hosted Firestore quota, works when hosted quota is exhausted, lets
you test the local roles, and can be safely reset and reseeded. Emulator data
and hosted data are separate. You still need your own hosted Firebase project
for the one-time setup above, index verification, and final smoke test.

The following workflow uses three terminal windows. Keep Terminal 1 running.

### Terminal 1 — start the Firebase emulators

```bash
npm run emulators
```

This runs the repository's Firebase CLI script. The expected endpoints are:

- Authentication: 127.0.0.1:9099
- Firestore: 127.0.0.1:8080
- Emulator UI: [http://127.0.0.1:4000](http://127.0.0.1:4000)

### Terminal 2 — seed emulator users and sample data

The emulator starts empty. In a second terminal, run:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIREBASE_PROJECT_ID=demo-fluxon-internships-test \
FIREBASE_AUTHENTICATION_MODE=email-password-development \
npm run seed:development
```

The variables point the seed script at local Firestore and Auth. The project ID
is the current ID used by this repository's emulator scripts. The command
creates manager, mentor, intern, and guest personas plus sample development
data.

There is also a one-command alternative:

```bash
npm run seed:emulator
```

This starts temporary Auth and Firestore emulators, seeds them, and stops them
when it finishes. Use it instead of the Terminal 1 + Terminal 2 combination
when you only need a short-lived seeded emulator; do not run both seed methods
at the same time.

### Terminal 3 — start Next.js against the emulators

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIREBASE_PROJECT_ID=demo-fluxon-internships-test \
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-fluxon-internships-test \
FIREBASE_AUTHENTICATION_MODE=email-password-development \
NEXT_PUBLIC_AUTHENTICATION_MODE=email-password-development \
NEXT_PUBLIC_FIREBASE_API_KEY=emulator-api-key \
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost \
npm run dev
```

These variables make the browser and the app use the local Auth and Firestore
emulators. Open [http://localhost:3000](http://localhost:3000) when Next.js
reports that it is ready.

### Project-ID alignment

The Auth Emulator issues tokens for the project ID used by the emulator
commands: demo-fluxon-internships-test. The browser and app must use the same
project ID. Keep these two variables equal:

```dotenv
FIREBASE_PROJECT_ID=demo-fluxon-internships-test
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-fluxon-internships-test
```

If they do not match, sign-in may appear to work but
POST /api/auth/session can return 401 Unauthorized. Restart Terminal 3
after changing either value.

### Development personas

The sign-in page provides these local personas:

| Persona | Use it to test                                   |
| ------- | ------------------------------------------------ |
| Manager | manager pages and manager actions                |
| Mentor  | mentor or teammate views                         |
| Intern  | intern workflows                                 |
| Guest   | signed-in access without a role-specific account |

Choose a persona on the sign-in page. The seed and sign-in screen use the local
development password automatically; these accounts are for development only.

### Emulator UI

Open these pages while Terminal 1 is running:

- [http://127.0.0.1:4000/auth](http://127.0.0.1:4000/auth) shows local Auth users.
- [http://127.0.0.1:4000/firestore](http://127.0.0.1:4000/firestore) shows local Firestore documents.

### Emulator Suite versus hosted Firebase

| Emulator Suite               | Hosted Firebase                          |
| ---------------------------- | ---------------------------------------- |
| Daily feature development    | Initial Firebase configuration           |
| Local testing                | Hosted index verification                |
| Safe data experiments        | Final smoke test                         |
| Work when quota is exhausted | Real Firebase configuration verification |
| Integration tests            | Behavior not reproduced by the emulator  |

Always check which environment the current terminal variables target before
seeding.

## 9. Run project checks

Run these from the repository root:

```bash
npm run format:check
```

Checks that files follow the repository's Prettier formatting rules. It does
not change files.

```bash
npm run lint
```

Checks the project with ESLint.

```bash
npm run typecheck
```

Checks TypeScript types without emitting compiled files.

```bash
npm test
```

Runs the unit tests. The script removes GOOGLE_APPLICATION_CREDENTIALS so
unit tests do not use a hosted service account. No Emulator Suite is required.

```bash
npm run test:integration
```

Runs integration tests inside fresh temporary Auth and Firestore emulators.
The script starts and stops those emulators itself; no separate Terminal 1 is
required, and it must not use a hosted project.

```bash
npm run test:e2e
```

Runs the Playwright browser smoke tests after seeding development data. Use it
only with the Emulator Suite and the emulator variables from Terminal 3; it
must not seed a hosted project accidentally.

```bash
npm run build
npm run start
```

build creates the production build. After it succeeds, start serves that
build locally. Do not use development email/password mode for a production
deployment.

```bash
npm run validate
```

Runs the repository's combined lint, type-check, unit-test, and build checks.

## 10. Firebase and credential safety

- Never commit .env.local.
- Never commit, upload, or share a service-account JSON file.
- Do not use a shared real service-account key.
- Check whether a command targets hosted Firebase or the Emulator Suite before seeding.
- Unit tests must not connect to hosted Firestore.
- Integration tests that require Firestore should use the emulator.
- If emulator development unexpectedly connects to hosted Firebase, stop immediately with Ctrl + C, check all emulator variables, and restart only after the target is clear.

## 11. Stop and restart

Press Ctrl + C in each running terminal to stop the app and emulators.

Emulator data may disappear when the emulators stop. If users or sample data
are missing after a restart, start Terminal 1 again and rerun the Terminal 2
seed command.

## 12. Troubleshooting

### The Node.js version is wrong

Run nvm install and nvm use again. If NVM is not installed, install a
supported Node.js version and confirm it with node --version.

### npm install fails

Confirm that you are in the repository root and that Node.js is supported. Run
npm --version, then try npm install again. If npm reports a network or
proxy error, fix the network connection or npm registry settings first.

### .env.local is missing

Run cp .env.example .env.local, then fill in the values for your Firebase
project. Restart the app after changing environment variables.

### Java cannot be found

Install Java 21, run java -version, and follow any PATH instructions printed
by your package manager. Open a new terminal after changing PATH.

### Firebase Authentication is not enabled

In Firebase Console, open **Authentication → Sign-in method**, enable
**Email/Password**, and save. Rerun the seed command if the hosted project was
already seeded.

### Firebase CLI says that no project is active

The repository does not store a hosted project ID in `.firebaserc`. Start the
emulators with the same local project ID used by the seed scripts:

```bash
npm run emulators -- --project demo-fluxon-internships-test
```

Then use the Terminal 2 and Terminal 3 commands from this README.

### The Firestore database is missing

In Firebase Console, open **Firestore Database** and create the default
(default) database. Then rerun the hosted seed command or restart the
emulators and reseed locally.

### Hosted seed cannot find service-account credentials

Check that GOOGLE_APPLICATION_CREDENTIALS is an absolute path to an existing
JSON file outside the repository. Check that FIREBASE_PROJECT_ID matches the
JSON file's project_id, and remove emulator variables for hosted seeding.

### Index deployment reports insufficient permission

Grant the service account roles/datastore.indexAdmin in the Google Cloud IAM
settings for the same Firebase project, then rerun
npm run deploy:firestore-indexes.

### A persona sign-in returns 400 Bad Request

The local user may not exist in the emulator you started. Rerun the Terminal 2
seed command with the same emulator hosts and project ID, refresh the sign-in
page, and choose the persona again.

### POST /api/auth/session returns 401 Unauthorized

Check that the browser and app use the same project ID and authentication mode.
For emulator work, set both project IDs to
demo-fluxon-internships-test, set both modes to
email-password-development, and restart Terminal 3 before signing in again.

### The emulator project ID does not match

Use the current repository value demo-fluxon-internships-test in
FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID. Also use the
matching seed command. Do not mix a different project ID into only one
terminal.

### The app unexpectedly connects to hosted Firebase

Stop the app. Check FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST,
and NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST in the terminal that starts
Next.js. Set all three as shown in Terminal 3, confirm both project IDs, and
restart. Do not seed until the target is correct.

### A port is already in use

Stop the old process with Ctrl + C, or identify and close the process using
port 3000, 4000, 8080, or 9099. Then start the needed command again.

### Emulator data disappeared

This is expected after stopping the emulators. Start Terminal 1 and rerun the
Terminal 2 seed command.

### A Firestore index is missing

For hosted Firebase, set the hosted project ID and service-account path, run
npm run deploy:firestore-indexes, and wait for Firebase Console to report the
index as enabled. For local work, make sure you started the emulators with the
repository configuration and restart them if needed.
