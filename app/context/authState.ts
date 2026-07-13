import type { Session, User } from "@supabase/supabase-js";
import type { PublicAppError } from "../services/errors.ts";

/**
 * Client auth machine for Litmo mobile.
 *
 * Status is product routing truth (not Supabase alone):
 * - locked / expired / revoked → public or /entry
 * - authenticating / registering → mid-passkey ceremony
 * - onboarding → session exists; product onboarding incomplete
 * - age_gate → onboarding complete but adult eligibility not confirmed (real only)
 * - authenticated → real adult-eligible session
 * - demo → fictional path; no real account (ADR 0003)
 * - error → restore/auth failure UI
 *
 * CONSENT: Auth status is never touch consent, snapshot seal, or safety certification.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §1.2 · AuthContext · protectedRouteFor
 */
export type AuthState = {
  /**
   * Product session status for routing and UI chrome.
   * Fail-closed defaults: missing session → locked; onboarding incomplete before age.
   * NEVER: Interpret authenticated as “safe to touch” or “Consent Snapshot sealed”.
   */
  status:
    | "locked"
    | "authenticating"
    | "registering"
    | "onboarding"
    | "age_gate"
    | "authenticated"
    | "expired"
    | "revoked"
    | "error"
    | "demo";
  session: Session | null;
  user: User | null;
  error: PublicAppError | null;
};

/**
 * Discrete transitions into AuthState. RESTORED carries onboarding + age flags
 * so status is derived fail-closed: complete onboarding before age before app.
 */
export type AuthAction =
  | {
      type: "RESTORED";
      session: Session | null;
      onboardingComplete?: boolean;
      ageEligible?: boolean;
    }
  | { type: "AUTHENTICATING" }
  | { type: "REGISTERING" }
  | { type: "EXPIRED" }
  | { type: "REVOKED" }
  | { type: "SIGNED_OUT" }
  | { type: "FAILED"; error: PublicAppError }
  | { type: "ENTERED_DEMO_MODE" };

/**
 * WHAT: Initial locked empty state before restore completes.
 * WHY: Fail-closed cold start — no session, no demo, no product until explicit enter/restore.
 * CONSENT: Not a consent surface.
 * EDGE CASES: none — constant.
 * NEVER: Start as authenticated or demo without action.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §1.2
 */
export const initialAuthState: AuthState = {
  status: "locked",
  session: null,
  user: null,
  error: null,
};

/**
 * WHAT: Pure reducer mapping AuthAction → AuthState for routing and chrome.
 * WHY: Single ordered truth for session restore: onboarding complete → age → authenticated.
 * CONSENT: Status transitions never grant touch. Demo clears real session fields.
 * EDGE CASES:
 *   - RESTORED with null session → locked.
 *   - RESTORED with session + !onboardingComplete → onboarding (age ignored until complete).
 *   - RESTORED with onboardingComplete + !ageEligible → age_gate.
 *   - ENTERED_DEMO_MODE → demo with cleared session (no real user mixed in).
 *   - FAILED / EXPIRED / REVOKED → wipe session; keep status for UX.
 * NEVER: age_gate before onboarding complete; demo with a real Session attached;
 *   treat authenticated as Soft Signal or snapshot readiness.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §1.2 · AuthContext restore matrix
 */
export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  if (action.type === "SIGNED_OUT")
    return { ...initialAuthState, status: "locked" };
  if (action.type === "AUTHENTICATING")
    return { ..._state, status: "authenticating", error: null };
  if (action.type === "REGISTERING")
    return { ..._state, status: "registering", error: null };
  if (action.type === "EXPIRED")
    return { ...initialAuthState, status: "expired" };
  if (action.type === "REVOKED")
    return { ...initialAuthState, status: "revoked" };
  if (action.type === "FAILED")
    return { ...initialAuthState, status: "error", error: action.error };
  // Demo: wipe any real session so demo never pretends to be authenticated.
  if (action.type === "ENTERED_DEMO_MODE")
    return { ...initialAuthState, status: "demo" };
  // RESTORED with no session → locked (fail-closed).
  if (!action.session) return { ...initialAuthState, status: "locked" };
  // Order: finish product onboarding, then adult eligibility, then app.
  // Age eligibility is ignored until onboardingComplete — prevents skip of prepare path.
  let status: AuthState["status"] = "onboarding";
  if (action.onboardingComplete) {
    status = action.ageEligible ? "authenticated" : "age_gate";
  }
  return {
    status,
    session: action.session,
    user: action.session.user,
    error: null,
  };
}

/**
 * WHAT: Returns a forced navigation target for the current status + route flags, or null.
 * WHY: Auth layout must not leave real users on wrong surfaces (e.g. home without adult).
 * CONSENT: Routing only — never seals consent or fires Soft Signal.
 * EDGE CASES:
 *   - error → null (full-screen error UI owns recovery).
 *   - demo in auth group → force "/" (welcome), not passkey chrome.
 *   - locked/expired/revoked on non-public → /entry (path choice), not raw sign-in.
 *   - age_gate → always /onboarding/age-gate (even if deep-linked elsewhere).
 *   - authenticating/registering → null (stay put during ceremony).
 *   - authenticated + inAuthGroup → /home.
 * NEVER: Deep-link past age_gate when status is age_gate; auto-enter demo from locked.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §1.2 · §11.4 · AuthContext route effects
 */
export function protectedRouteFor(
  status: AuthState["status"],
  route: { inAuthGroup: boolean; isPublicRoute: boolean },
): "/auth/sign-in" | "/entry" | "/" | "/home" | "/onboarding/age-gate" | null {
  const { inAuthGroup, isPublicRoute } = route;
  if (status === "error") return null;
  // Demo users should not sit in passkey auth screens.
  if (status === "demo") return inAuthGroup ? "/" : null;
  // The welcome screen ("/") and the entry choice screen ("/entry") need no
  // account. A signed-out visitor anywhere else (including one who just
  // exited demo mode, or whose session expired) goes back to "/entry" to
  // choose demo mode or sign-in again, rather than straight past that choice
  // to the sign-in form; sign-in itself remains one explicit tap away.
  if (status === "locked" || status === "expired" || status === "revoked")
    return isPublicRoute ? null : "/entry";
  if (status === "authenticating" || status === "registering") return null;
  // Fail-closed adult gate: any non-age route is replaced to age-gate by callers.
  if (status === "age_gate") return "/onboarding/age-gate";
  if (!inAuthGroup) return null;
  if (status === "authenticated") return "/home";
  // onboarding (or other): leave auth group for product root; onboarding screens free.
  return "/";
}
