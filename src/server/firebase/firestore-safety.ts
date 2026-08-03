import "server-only";

const unitTestAccessMessage =
  "Firestore access is disabled during unit tests. Mock the Firebase-dependent service or run the test through the Firestore Emulator.";

export function shouldBlockFirestoreForUnitTests(environment = process.env) {
  return environment.NODE_ENV === "test" && !environment.FIRESTORE_EMULATOR_HOST;
}

export function assertSafeFirestoreEnvironment(environment = process.env) {
  if (
    environment.NODE_ENV === "production" &&
    (environment.FIRESTORE_EMULATOR_HOST || environment.FIREBASE_AUTH_EMULATOR_HOST)
  ) {
    throw new Error("Firebase Emulator hosts must not be configured in production.");
  }
}

export function throwForBlockedFirestoreAccess(): never {
  throw new Error(unitTestAccessMessage);
}
