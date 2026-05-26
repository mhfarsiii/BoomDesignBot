export class AuthConfigError extends Error {
  override readonly name = "AuthConfigError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
