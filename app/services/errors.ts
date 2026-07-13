export type PublicErrorCode =
  | "auth_invalid_credentials"
  | "auth_email_in_use"
  | "auth_session_expired"
  | "auth_cancelled"
  | "auth_request_in_progress"
  | "auth_passkey_unavailable"
  | "auth_rate_limited"
  | "auth_revoked"
  | "auth_recovery_required"
  | "auth_device_required"
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
      "Passkey was cancelled. Nothing was changed. You can try again when ready.",
      true,
    );
  if (candidate?.code === "ERR_PASSKEY_REQUEST_IN_PROGRESS")
    return new PublicAppError(
      "auth_request_in_progress",
      "An authentication request is already in progress. Finish or cancel Face ID first.",
    );
  if (
    candidate?.code === "ERR_PASSKEY_UNAVAILABLE" ||
    (message.includes("passkey") && message.includes("unavailable")) ||
    message.includes("expo go cannot complete webauthn") ||
    message.includes("litmopasskeys")
  )
    return new PublicAppError(
      "auth_passkey_unavailable",
      "Passkeys need an iOS development build (not Expo Go), with iCloud Keychain and a device passcode. Demo mode still works without an account.",
    );
  if (
    message.includes("associated domain") ||
    message.includes("relying party") ||
    message.includes("rp id")
  )
    return new PublicAppError(
      "auth_passkey_unavailable",
      "Passkey domain setup is incomplete for this build. Use a paid-team development build with Associated Domains, or demo mode.",
    );
  if (
    message.includes("too often") ||
    message.includes("rate limit") ||
    candidate?.code === "P0001"
  )
    return new PublicAppError(
      "auth_rate_limited",
      "You're doing that too often — try again later.",
      true,
    );
  if (
    message.includes("registered device is required") ||
    message.includes("sign in with a passkey on this phone")
  )
    return new PublicAppError(
      "auth_device_required",
      "Confirm consent only from a passkey-registered device on this phone. Sign in with your passkey, then try again.",
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
  if (candidate?.code === "55000")
    return new PublicAppError(
      "validation_failed",
      "That action isn't available for this session right now.",
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
