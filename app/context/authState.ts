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
  inAuthGroup: boolean,
): "/auth/sign-in" | "/" | "/match/discover" | null {
  if (status === "loading" || status === "error") return null;
  if (status === "demo") return inAuthGroup ? "/" : null;
  if (status === "signed_out") return inAuthGroup ? null : "/auth/sign-in";
  if (!inAuthGroup) return null;
  return status === "ready" ? "/match/discover" : "/";
}
