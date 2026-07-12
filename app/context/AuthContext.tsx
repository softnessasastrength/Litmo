import type { Session } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { mapExternalError, type PublicAppError } from "../services/errors";
import { profileRepository } from "../services/profileRepository";
import { environmentError, supabase } from "../services/supabase";
import { authService } from "../services/authService";
import { deviceRegistrationService } from "../services/deviceRegistrationService";
import { sensitiveDataService } from "../services/sensitiveDataService";
import { authReducer, initialAuthState, protectedRouteFor } from "./authState";
type AuthValue = ReturnType<typeof authReducer> & {
  requestAccountCode(email: string, displayName: string): Promise<void>;
  confirmAccountAndCreatePasskey(email: string, code: string): Promise<void>;
  signInWithPasskey(): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
  enterDemoMode(): void;
};
const Context = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const router = useRouter();
  const segments = useSegments();
  const ceremonyInProgress = useRef(false);
  const restore = async (session: Session | null) => {
    if (!session) return dispatch({ type: "RESTORED", session: null });
    try {
      await deviceRegistrationService.verify();
      const profile = await profileRepository.getOwnProfile(session.user.id);
      dispatch({
        type: "RESTORED",
        session,
        onboardingComplete: Boolean(profile.onboardingCompletedAt),
      });
    } catch (error) {
      const mapped = mapExternalError(error);
      if (mapped.code === "auth_session_expired") {
        await supabase.auth.signOut();
        dispatch({ type: "EXPIRED" });
      } else if (mapped.code === "auth_revoked") {
        await supabase.auth.signOut();
        dispatch({ type: "REVOKED" });
      } else dispatch({ type: "FAILED", error: mapped });
    }
  };
  useEffect(() => {
    if (environmentError)
      return dispatch({
        type: "FAILED",
        error: mapExternalError(new Error(environmentError)),
      });
    supabase.auth
      .getSession()
      .then(({ data, error }) =>
        error
          ? dispatch({ type: "FAILED", error: mapExternalError(error) })
          : restore(data.session),
      );
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ceremonyInProgress.current) return;
      void restore(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const inAuth = segments[0] === "auth";
    // "/" (segments is empty) and "/entry" need no account: they are where a
    // signed-out visitor chooses demo mode or sign-in.
    const isPublicRoute =
      inAuth ||
      (segments as readonly string[]).length === 0 ||
      segments[0] === "entry";
    const destination = protectedRouteFor(state.status, {
      inAuthGroup: inAuth,
      isPublicRoute,
    });
    if (destination) router.replace(destination);
  }, [router, segments, state.status]);
  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      async requestAccountCode(email, displayName) {
        await authService.requestAccountCode(email, displayName);
      },
      async confirmAccountAndCreatePasskey(email, code) {
        dispatch({ type: "AUTHENTICATING" });
        ceremonyInProgress.current = true;
        try {
          await authService.confirmAccountCode(email, code);
          dispatch({ type: "REGISTERING" });
          await authService.registerPasskey();
          await deviceRegistrationService.register();
          await restore((await supabase.auth.getSession()).data.session);
        } catch (error) {
          await supabase.auth.signOut();
          dispatch({ type: "FAILED", error: mapExternalError(error) });
          throw error;
        } finally {
          ceremonyInProgress.current = false;
        }
      },
      async signInWithPasskey() {
        dispatch({ type: "AUTHENTICATING" });
        ceremonyInProgress.current = true;
        try {
          const session = await authService.signInWithPasskey();
          await deviceRegistrationService.register();
          await restore(session);
        } catch (error) {
          await supabase.auth.signOut();
          dispatch({ type: "FAILED", error: mapExternalError(error) });
          throw error;
        } finally {
          ceremonyInProgress.current = false;
        }
      },
      async signOut() {
        sensitiveDataService.lock();
        if (state.status === "demo") return dispatch({ type: "SIGNED_OUT" });
        await authService.signOut();
        dispatch({ type: "SIGNED_OUT" });
      },
      async refreshProfile() {
        await restore(state.session);
      },
      enterDemoMode() {
        dispatch({ type: "ENTERED_DEMO_MODE" });
      },
    }),
    [state],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
