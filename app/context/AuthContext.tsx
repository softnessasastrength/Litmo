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
import { ageGateService } from "../services/ageGateService";
import { profileRepository } from "../services/profileRepository";
import { environmentError, supabase } from "../services/supabase";
import { authService } from "../services/authService";
import { deviceRegistrationService } from "../services/deviceRegistrationService";
import { sensitiveDataService } from "../services/sensitiveDataService";
import { emergencyStopService } from "../services/emergencyStopService";
import { sessionCompleteService } from "../services/sessionCompleteService";
import { sessionWrapupService } from "../services/sessionWrapupService";
import { authReducer, initialAuthState, protectedRouteFor } from "./authState";
type AuthValue = ReturnType<typeof authReducer> & {
  requestAccountCode(email: string, displayName: string): Promise<void>;
  confirmAccountAndCreatePasskey(email: string, code: string): Promise<void>;
  signInWithPasskey(): Promise<void>;
  /** Development seed accounts only (runtimeConfig.allowDemo). */
  signInWithPassword(email: string, password: string): Promise<void>;
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
      await emergencyStopService.reconcile();
      await sessionCompleteService.reconcile();
      await sessionWrapupService.reconcile();
      const profile = await profileRepository.getOwnProfile(session.user.id);
      const onboardingComplete = Boolean(profile.onboardingCompletedAt);
      let ageEligible = false;
      if (onboardingComplete) {
        try {
          ageEligible = (await ageGateService.getEligibility(session.user.id))
            .isAdult;
        } catch {
          ageEligible = false;
        }
      }
      dispatch({
        type: "RESTORED",
        session,
        onboardingComplete,
        ageEligible,
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
    // Missing Supabase URL/key must not trap the app on a hard error screen:
    // the phone-visible demo path (ADR 0003) needs welcome → entry → demo
    // with no Docker. Real sign-in still fails closed when env is absent.
    if (environmentError) {
      dispatch({ type: "RESTORED", session: null });
      return;
    }
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
    // Stay on age-gate without replace loop once already there.
    const routeParts = segments as readonly string[];
    if (
      state.status === "age_gate" &&
      routeParts[0] === "onboarding" &&
      routeParts[1] === "age-gate"
    ) {
      return;
    }
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
      async signInWithPassword(email, password) {
        dispatch({ type: "AUTHENTICATING" });
        ceremonyInProgress.current = true;
        try {
          const session = await authService.signInWithPassword(email, password);
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
