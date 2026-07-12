import type { Session, User } from "@supabase/supabase-js";
import type { PublicAppError } from "../services/errors.ts";
export type AuthState = {
  status:
    | "locked"
    | "authenticating"
    | "registering"
    | "onboarding"
    | "authenticated"
    | "expired"
    | "revoked"
    | "error"
    | "demo";
  session: Session | null;
  user: User | null;
  error: PublicAppError | null;
};
export type AuthAction =
  | { type: "RESTORED"; session: Session | null; onboardingComplete?: boolean }
  | { type: "AUTHENTICATING" }
  | { type: "REGISTERING" }
  | { type: "EXPIRED" }
  | { type: "REVOKED" }
  | { type: "SIGNED_OUT" }
  | { type: "FAILED"; error: PublicAppError }
  | { type: "ENTERED_DEMO_MODE" };
export const initialAuthState: AuthState = {
  status: "locked",
  session: null,
  user: null,
  error: null,
};
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
  if (action.type === "ENTERED_DEMO_MODE")
    return { ...initialAuthState, status: "demo" };
  if (!action.session) return { ...initialAuthState, status: "locked" };
  return {
    status: action.onboardingComplete ? "authenticated" : "onboarding",
    session: action.session,
    user: action.session.user,
    error: null,
  };
}
export function protectedRouteFor(
  status: AuthState["status"],
  route: { inAuthGroup: boolean; isPublicRoute: boolean },
): "/auth/sign-in" | "/entry" | "/" | "/home" | null {
  const { inAuthGroup, isPublicRoute } = route;
  if (status === "error") return null;
  if (status === "demo") return inAuthGroup ? "/" : null;
  // The welcome screen ("/") and the entry choice screen ("/entry") need no
  // account. A signed-out visitor anywhere else (including one who just
  // exited demo mode, or whose session expired) goes back to "/entry" to
  // choose demo mode or sign-in again, rather than straight past that choice
  // to the sign-in form; sign-in itself remains one explicit tap away.
  if (status === "locked" || status === "expired" || status === "revoked")
    return isPublicRoute ? null : "/entry";
  if (status === "authenticating" || status === "registering") return null;
  if (!inAuthGroup) return null;
  return status === "authenticated" ? "/home" : "/";
}
