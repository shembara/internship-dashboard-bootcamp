import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import nextEnvironment from "@next/env";
import { GoogleAuth } from "google-auth-library";

nextEnvironment.loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required to deploy Firestore indexes.");
}

if (!credentialsPath) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS is required to deploy Firestore indexes.",
  );
}

type IndexField = { fieldPath: string; order?: "ASCENDING" | "DESCENDING" };
type IndexDefinition = {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: IndexField[];
};
type FieldOverride = {
  collectionGroup: string;
  fieldPath: string;
  indexes: Array<{
    queryScope: "COLLECTION" | "COLLECTION_GROUP";
    order?: "ASCENDING" | "DESCENDING";
  }>;
};
type IndexConfig = { indexes: IndexDefinition[]; fieldOverrides?: FieldOverride[] };
type ExistingIndex = IndexDefinition & { state?: string };

const config = JSON.parse(
  await readFile(resolve("firestore.indexes.json"), "utf8"),
) as IndexConfig;
const auth = new GoogleAuth({
  keyFilename: resolve(credentialsPath),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const apiRoot = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)`;

function sameIndex(left: IndexDefinition, right: ExistingIndex): boolean {
  return (
    left.collectionGroup === right.collectionGroup &&
    left.queryScope === right.queryScope &&
    left.fields.length === right.fields.length &&
    left.fields.every(
      (field, index) =>
        field.fieldPath === right.fields[index]?.fieldPath &&
        field.order === right.fields[index]?.order,
    )
  );
}

try {
  for (const definition of config.indexes) {
    const collectionGroupPath = `${apiRoot}/collectionGroups/${encodeURIComponent(definition.collectionGroup)}/indexes`;
    const response = await client.request<{ indexes?: ExistingIndex[] }>({
      url: collectionGroupPath,
      method: "GET",
    });
    const existing = response.data.indexes ?? [];

    if (existing.some((index) => sameIndex(definition, index))) {
      console.info(`Index already exists: ${definition.collectionGroup}`);
      continue;
    }

    await client.request({
      url: collectionGroupPath,
      method: "POST",
      data: {
        queryScope: definition.queryScope,
        fields: definition.fields,
      },
    });
    console.info(`Created index: ${definition.collectionGroup}`);
  }

  for (const override of config.fieldOverrides ?? []) {
    const fieldPath = `${apiRoot}/collectionGroups/${encodeURIComponent(override.collectionGroup)}/fields/${encodeURIComponent(override.fieldPath)}`;
    await client.request({
      url: `${fieldPath}?updateMask=indexConfig`,
      method: "PATCH",
      data: {
        indexConfig: {
          indexes: override.indexes.map((index) => ({
            queryScope: index.queryScope,
            fields: [{ fieldPath: override.fieldPath, order: index.order }],
          })),
        },
      },
    });
    console.info(
      `Updated single-field indexes: ${override.collectionGroup}.${override.fieldPath}`,
    );
  }
} catch (error) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 403) {
    throw new Error(
      "The service account is authenticated but cannot manage Firestore indexes. Grant it the Cloud Datastore Index Admin role (roles/datastore.indexAdmin) in this project, then rerun this command.",
    );
  }
  throw error;
}
