import "server-only";

import {
  createInitialInternshipLifecycle,
  parseInternshipDocument as parseDocument,
  type InternshipDocument,
} from "@/server/internships/domain";

export function parseInternshipDocument(data: unknown): InternshipDocument {
  return parseDocument(data);
}

export function serializeNewInternshipLifecycle() {
  return createInitialInternshipLifecycle();
}
