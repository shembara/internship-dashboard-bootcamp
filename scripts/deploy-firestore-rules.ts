import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import nextEnvironment from "@next/env";
import { GoogleAuth } from "google-auth-library";

nextEnvironment.loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const databaseId = process.env.FIRESTORE_DATABASE_ID ?? "(default)";

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required to deploy Firestore rules.");
}

if (!credentialsPath) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is required to deploy Firestore rules.");
}

const rulesContent = await readFile(resolve("firestore.rules"), "utf8");
const auth = new GoogleAuth({
  keyFilename: resolve(credentialsPath),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const rulesApiRoot = `https://firebaserules.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`;

type RulesetResponse = { name: string };

try {
  const createResponse = await client.request<RulesetResponse>({
    url: `${rulesApiRoot}/rulesets`,
    method: "POST",
    data: {
      source: {
        files: [{ content: rulesContent, name: "firestore.rules" }],
      },
    },
  });

  const rulesetName = createResponse.data.name;
  const releaseName = `projects/${projectId}/releases/cloud.firestore/${databaseId}`;
  const releaseUrl = `${rulesApiRoot}/releases/${encodeURIComponent(`cloud.firestore/${databaseId}`)}`;

  try {
    await client.request({
      url: releaseUrl,
      method: "PATCH",
      data: { release: { name: releaseName, rulesetName } },
    });
  } catch (patchError) {
    const patchStatus = (patchError as { response?: { status?: number } }).response?.status;
    if (patchStatus !== 404) throw patchError;

    await client.request({
      url: `${rulesApiRoot}/releases`,
      method: "POST",
      data: { name: releaseName, rulesetName },
    });
  }

  console.info(`Released firestore.rules to database "${databaseId}" (${rulesetName}).`);
} catch (error) {
  const status = (error as { response?: { status?: number; data?: unknown } }).response?.status;
  if (status === 403) {
    throw new Error(
      "The service account is authenticated but cannot manage Firebase Rules. Grant it the Firebase Rules Admin role (roles/firebaserules.admin), then rerun this command.",
    );
  }
  throw error;
}
