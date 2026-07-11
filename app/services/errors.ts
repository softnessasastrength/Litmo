export type PublicErrorCode =
  | "auth_invalid_credentials"
  | "auth_email_in_use"
  | "auth_session_expired"
  | "network_unavailable"
  | "request_timeout"
  | "permission_denied"
  | "validation_failed"
  | "unexpected_error";

export class PublicAppError extends Error {
  readonly code: PublicErrorCode;
  readonly retryable: boolean;
  constructor(code: PublicErrorCode, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "PublicAppError";
  }
}

export function mapExternalError(error: unknown): PublicAppError {
  if (error instanceof PublicAppError) return error;
  const candidate = error as {
    message?: string;
    status?: number;
    code?: string;
  };
  const message = candidate?.message?.toLowerCase() ?? "";
  if (message.includes("invalid login credentials"))
    return new PublicAppError(
      "auth_invalid_credentials",
      "That email and password did not match. You can try again.",
    );
  if (
    message.includes("already registered") ||
    message.includes("already been registered")
  )
    return new PublicAppError(
      "auth_email_in_use",
      "An account already uses that email. Try signing in instead.",
    );
  if (candidate?.status === 401 || message.includes("jwt expired"))
    return new PublicAppError(
      "auth_session_expired",
      "Your session ended. Please sign in again.",
    );
  if (candidate?.status === 403 || candidate?.code === "42501")
    return new PublicAppError(
      "permission_denied",
      "This information is private or unavailable.",
    );
  if (message.includes("network") || message.includes("fetch"))
    return new PublicAppError(
      "network_unavailable",
      "Litmo could not reach the local service. Check your connection and try again.",
      true,
    );
  return new PublicAppError(
    "unexpected_error",
    "Something unexpected happened. Your choices were not changed.",
    true,
  );
}
