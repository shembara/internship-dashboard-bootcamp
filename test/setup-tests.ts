// Global test setup for vitest
// Ensure firestore safety check considers emulator configured so server modules don't block
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:9999";

// Optionally stub GOOGLE_APPLICATION_CREDENTIALS to empty to prevent SDK errors
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "";
