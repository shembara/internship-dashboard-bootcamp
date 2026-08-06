// Global test setup for vitest
// Ensure firestore safety check considers emulator configured so server modules don't block
if (typeof process.env.NODE_ENV === "undefined") {
  (process.env as any).NODE_ENV = "test";
}
if (typeof process.env.FIRESTORE_EMULATOR_HOST === "undefined") {
  (process.env as any).FIRESTORE_EMULATOR_HOST = "127.0.0.1:9999";
}

// Optionally stub GOOGLE_APPLICATION_CREDENTIALS to empty to prevent SDK errors
if (typeof process.env.GOOGLE_APPLICATION_CREDENTIALS === "undefined") {
  (process.env as any).GOOGLE_APPLICATION_CREDENTIALS = "";
}
