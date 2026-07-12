export type PublicErrorCode =
  | "auth_invalid_credentials"
  | "auth_email_in_use"
  | "auth_session_expired"
  | "auth_cancelled"
  | "auth_request_in_progress"
  | "auth_passkey_unavailable"
  | "auth_revoked"
  | "auth_recovery_required"
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
  if (candidate?.code === "ERR_PASSKEY_CANCELLED")
    return new PublicAppError(
      "auth_cancelled",
      "Passkey sign-in was cancelled. Nothing was changed.",
      true,
    );
  if (candidate?.code === "ERR_PASSKEY_REQUEST_IN_PROGRESS")
    return new PublicAppError(
      "auth_request_in_progress",
      "An authentication request is already in progress.",
    );
  if (
    candidate?.code === "ERR_PASSKEY_UNAVAILABLE" ||
    (message.includes("passkey") && message.includes("unavailable"))
  )
    return new PublicAppError(
      "auth_passkey_unavailable",
      "Passkeys are unavailable. Check that iCloud Keychain and a device passcode are enabled.",
    );
  if (message.includes("invalid login credentials"))
    return new PublicAppError(
      "auth_invalid_credentials",
      "Apple could not verify that credential. You can try again.",
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
