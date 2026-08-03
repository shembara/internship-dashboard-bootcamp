export type AuthenticationErrorCode =
  "UNAUTHENTICATED" | "INVALID_SESSION" | "UNVERIFIED_EMAIL" | "UNSUPPORTED_PROVIDER";

export class AuthenticationError extends Error {
  constructor(
    public readonly code: AuthenticationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}
