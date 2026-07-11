import type { Session, User } from "@supabase/supabase-js";
import type { PublicAppError } from "../services/errors.ts";
export type AuthState = {
  status: "loading" | "signed_out" | "onboarding" | "ready" | "error" | "demo";
  session: Session | null;
  user: User | null;
  error: PublicAppError | null;
};
export type AuthAction =
  | { type: "RESTORED"; session: Session | null; onboardingComplete?: boolean }
  | { type: "SIGNED_OUT" }
  | { type: "FAILED"; error: PublicAppError }
  | { type: "ENTERED_DEMO_MODE" };
export const initialAuthState: AuthState = {
  status: "loading",
  session: null,
  user: null,
  error: null,
};
export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  if (action.type === "SIGNED_OUT")
    return { ...initialAuthState, status: "signed_out" };
  if (action.type === "FAILED")
    return { ...initialAuthState, status: "error", error: action.error };
  if (action.type === "ENTERED_DEMO_MODE")
    return { ...initialAuthState, status: "demo" };
  if (!action.session) return { ...initialAuthState, status: "signed_out" };
  return {
    status: action.onboardingComplete ? "ready" : "onboarding",
    session: action.session,
    user: action.session.user,
    error: null,
  };
}
export function protectedRouteFor(
  status: AuthState["status"],
  route: { inAuthGroup: boolean; isPublicRoute: boolean },
): "/auth/sign-in" | "/entry" | "/" | "/match/discover" | null {
  const { inAuthGroup, isPublicRoute } = route;
  if (status === "loading" || status === "error") return null;
  if (status === "demo") return inAuthGroup ? "/" : null;
  // The welcome screen ("/") and the entry choice screen ("/entry") need no
  // account. A signed-out visitor anywhere else (including one who just
  // exited demo mode, or whose session expired) goes back to "/entry" to
  // choose demo mode or sign-in again, rather than straight past that choice
  // to the sign-in form; sign-in itself remains one explicit tap away.
  if (status === "signed_out") return isPublicRoute ? null : "/entry";
  if (!inAuthGroup) return null;
  return status === "ready" ? "/match/discover" : "/";
}
