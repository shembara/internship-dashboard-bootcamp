import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "server-only",
        replacement: path.resolve(projectRoot, "test/server-only.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(projectRoot, "src"),
      },
    ],
  },
  test: {
    environment: "node",
    env: {
      GOOGLE_APPLICATION_CREDENTIALS: "",
    },
    exclude: ["**/*.integration.test.ts", "e2e/**", "node_modules/**"],
  },
});
