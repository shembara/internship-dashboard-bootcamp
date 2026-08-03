import "server-only";

const calls = new Map<string, number>();

export function recordFirestoreReadPath(path: string) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FIRESTORE_READ_DIAGNOSTICS !== "1"
  ) {
    return;
  }

  const count = (calls.get(path) ?? 0) + 1;
  calls.set(path, count);
  console.info("[firestore-read]", {
    path,
    count,
    emulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST),
  });
}
