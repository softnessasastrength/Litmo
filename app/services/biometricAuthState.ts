export const BACKGROUND_REAUTH_MS = 30_000;

export type BiometricStatus =
  | "locked"
  | "checking"
  | "authenticating"
  | "unlocked"
  | "unavailable"
  | "error";

export type BiometricState = {
  status: BiometricStatus;
  message: string;
  privacyShielded: boolean;
};

export type BiometricAction =
  | { type: "CHECK" }
  | { type: "AUTHENTICATE" }
  | { type: "UNLOCK" }
  | { type: "LOCK"; message?: string }
  | { type: "FAIL"; status: "unavailable" | "error"; message: string }
  | { type: "PRIVACY_SHIELD"; enabled: boolean };

export const initialBiometricState: BiometricState = {
  status: "locked",
  message: "Face ID is required to open Litmo.",
  privacyShielded: true,
};

export function biometricReducer(
  state: BiometricState,
  action: BiometricAction,
): BiometricState {
  switch (action.type) {
    case "CHECK":
      return { ...state, status: "checking", privacyShielded: true };
    case "AUTHENTICATE":
      return { ...state, status: "authenticating", privacyShielded: true };
    case "UNLOCK":
      return { status: "unlocked", message: "", privacyShielded: false };
    case "LOCK":
      return {
        status: "locked",
        message: action.message ?? "Face ID is required to open Litmo.",
        privacyShielded: true,
      };
    case "FAIL":
      return {
        status: action.status,
        message: action.message,
        privacyShielded: true,
      };
    case "PRIVACY_SHIELD":
      return { ...state, privacyShielded: action.enabled };
  }
}

export function shouldRequireReauthentication(
  backgroundedAt: number | null,
  resumedAt: number,
) {
  return (
    backgroundedAt !== null &&
    resumedAt - backgroundedAt >= BACKGROUND_REAUTH_MS
  );
}

export function canRevealAfterAuthentication(appState: string) {
  return appState === "active";
}

/**
 * Face ID is mandatory only while a real Supabase session is in play
 * (ADR 0007, amended). Demo mode and pre-account exploration use only
 * fictional fixtures and must remain reachable on Expo Go without Face ID.
 *
 * Statuses that keep the gate off: locked, demo, error, expired, revoked.
 */
export function biometricRequiredForAuthStatus(
  status:
    | "locked"
    | "authenticating"
    | "registering"
    | "onboarding"
    | "authenticated"
    | "expired"
    | "revoked"
    | "error"
    | "demo",
): boolean {
  return (
    status === "authenticated" ||
    status === "onboarding" ||
    status === "authenticating" ||
    status === "registering"
  );
}
