/**
 * Auth context — session restore, passkey/password sign-in, demo mode, route gates.
 *
 * WHAT: Provides auth state + ceremony methods and redirects via protectedRouteFor.
 * WHY: Single source for account vs demo vs age_gate so screens do not reimplement policy.
 * CONSENT: Auth is identity/session plumbing, not touch consent. Demo never seals real consent.
 * EDGE CASES:
 *   - environmentError → signed-out restore (phone-visible demo without Docker)
 *   - age eligibility read fails → ageEligible false (fail closed)
 *   - ceremonyInProgress suppresses onAuthStateChange mid-passkey
 * NEVER: Treat auth success as Consent Snapshot yes; skip passkey on real account create.
 * SEE: authState · ageGateService · docs/adr passkey / device registration
 */

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

/**
 * WHAT: Auth reducer state plus imperative account/demo methods for consumers.
 * WHY: Screens call ceremonies without importing authService + routing policy.
 * CONSENT: Methods may establish identity only — never session body-contact consent.
 * EDGE CASES: signInWithPassword is development seed only (runtimeConfig.allowDemo).
 * NEVER: Expose service-role secrets or raw JWT material through this value.
 */
type AuthValue = ReturnType<typeof authReducer> & {
  requestAccountCode(email: string, displayName: string): Promise<void>;
  confirmAccountAndCreatePasskey(email: string, code: string): Promise<void>;
  signInWithPasskey(): Promise<void>;
  /** Development seed accounts only (runtimeConfig.allowDemo). */
  signInWithPassword(email: string, password: string): Promise<void>;
  /** Add another passkey while authenticated (Settings / devices). */
  addPasskey(): Promise<void>;
  listPasskeys(): Promise<unknown[]>;
  isPasskeyPlatformReady(): Promise<boolean>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
  enterDemoMode(): void;
};
const Context = createContext<AuthValue | null>(null);

/**
 * WHAT: Mount auth reducer, session listener, safety reconcile, and route protection.
 * WHY: App root needs one provider so tabs/onboarding share fail-closed status.
 * CONSENT: Not a consent surface; age_gate blocks matching until adult signal.
 * EDGE CASES: See restore, environmentError branch, protectedRouteFor effect.
 * NEVER: Leave reconciled Soft Signal / wrap-up pending actions unflushed on restore.
 * SEE: protectedRouteFor · emergencyStopService.reconcile
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const router = useRouter();
  const segments = useSegments();
  // Blocks onAuthStateChange restore storms during multi-step passkey ceremonies.
  const ceremonyInProgress = useRef(false);

  /**
   * WHAT: Hydrate device registration, offline safety queues, profile, age eligibility.
   * WHY: Cold start and auth events must re-establish fail-closed product state.
   * CONSENT: Age non-adult → not eligible for matching; does not imply touch consent.
   * EDGE CASES:
   *   - null session → RESTORED signed out
   *   - age read throws → ageEligible false
   *   - auth_session_expired / auth_revoked → force signOut + terminal auth status
   * NEVER: Set ageEligible true when signal missing/error; skip pending Soft Signal reconcile.
   * SEE: ageGateService.getEligibility · deviceRegistrationService.verify
   */
  const restore = async (session: Session | null) => {
    if (!session) return dispatch({ type: "RESTORED", session: null });
    try {
      await deviceRegistrationService.verify();
      // Order: offline safety actions before UI routes that might start contact.
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
          // Fail closed: unknown age is not adult.
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
      // Mid-ceremony TOKEN events would race registerPasskey + restore.
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
      /**
       * WHAT: Request email OTP / code for account creation.
       * WHY: Begin sign-up without establishing a usable session yet.
       * CONSENT: Not a consent surface — account bootstrap only.
       * EDGE CASES: Errors propagate to UI; no session dispatch here.
       * NEVER: Mark onboarding complete or age eligible from code request alone.
       */
      async requestAccountCode(email, displayName) {
        await authService.requestAccountCode(email, displayName);
      },
      /**
       * WHAT: Confirm email code, register mandatory passkey, bind device, restore.
       * WHY: Real accounts require platform authenticator before product use.
       * CONSENT: Identity ceremony only; still must complete onboarding + age gate.
       * EDGE CASES: auth_cancelled → signed-out restore without FAILED sticky screen.
       * NEVER: Skip passkey registration for “faster” onboarding on real accounts.
       * SEE: authService.registerPasskey · deviceRegistrationService.register
       */
      async confirmAccountAndCreatePasskey(email, code) {
        dispatch({ type: "AUTHENTICATING" });
        ceremonyInProgress.current = true;
        try {
          await authService.confirmAccountCode(email, code);
          dispatch({ type: "REGISTERING" });
          // Face ID / Touch ID passkey is mandatory before the account is usable.
          await authService.registerPasskey();
          // Device-bound installation secret (privacy + fail-closed restore).
          await deviceRegistrationService.register();
          await restore((await supabase.auth.getSession()).data.session);
        } catch (error) {
          const mapped = mapExternalError(error);
          await supabase.auth.signOut();
          // Cancel keeps the person on sign-up without a sticky global error screen.
          if (mapped.code === "auth_cancelled") {
            dispatch({ type: "RESTORED", session: null });
          } else {
            dispatch({ type: "FAILED", error: mapped });
          }
          throw mapped;
        } finally {
          ceremonyInProgress.current = false;
        }
      },
      /**
       * WHAT: Passkey sign-in, re-register device binding, restore profile/age.
       * WHY: Primary production sign-in path without passwords.
       * CONSENT: Not session consent; age_gate may still apply after restore.
       * EDGE CASES: cancel → signed-out; other errors → FAILED after signOut.
       * NEVER: Leave previous user’s sensitive runtime unlocked across account switch.
       */
      async signInWithPasskey() {
        dispatch({ type: "AUTHENTICATING" });
        ceremonyInProgress.current = true;
        try {
          const session = await authService.signInWithPasskey();
          // Register or rotate this installation after every successful passkey.
          await deviceRegistrationService.register();
          await restore(session);
        } catch (error) {
          const mapped = mapExternalError(error);
          await supabase.auth.signOut();
          if (mapped.code === "auth_cancelled") {
            dispatch({ type: "RESTORED", session: null });
          } else {
            dispatch({ type: "FAILED", error: mapped });
          }
          throw mapped;
        } finally {
          ceremonyInProgress.current = false;
        }
      },
      /**
       * WHAT: Password sign-in for development seed accounts only.
       * WHY: Local seed UX without passkey hardware during engineering.
       * CONSENT: Not production identity proof; not touch consent.
       * EDGE CASES: Any failure signOut + FAILED (no cancel special-case).
       * NEVER: Ship as production primary auth; treat password login as age proof.
       */
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
      /**
       * WHAT: Add an additional passkey while already authenticated.
       * WHY: Multi-device recovery without replacing the whole account.
       * CONSENT: Not a consent surface.
       * EDGE CASES: ceremonyInProgress gates auth listener during WebAuthn UI.
       * NEVER: Add passkey without existing authenticated session ownership.
       */
      async addPasskey() {
        ceremonyInProgress.current = true;
        try {
          await authService.addPasskey();
        } catch (error) {
          throw mapExternalError(error);
        } finally {
          ceremonyInProgress.current = false;
        }
      },
      /**
       * WHAT: List registered passkeys for settings UI.
       * WHY: Device management transparency.
       * CONSENT: Not a consent surface.
       * EDGE CASES: Returns service payload as unknown[] for UI mapping.
       * NEVER: Log full authenticator attestation blobs.
       */
      async listPasskeys() {
        return authService.listPasskeys();
      },
      /**
       * WHAT: Whether platform WebAuthn / passkey APIs are usable on this install.
       * WHY: UI can offer alternatives or explain simulator limitations.
       * CONSENT: Not a consent surface.
       * EDGE CASES: false on Expo Go / missing hardware → do not claim account usable without path.
       * NEVER: Treat platform-ready as proof of adult age or consent skill.
       */
      async isPasskeyPlatformReady() {
        return authService.isPasskeyPlatformReady();
      },
      /**
       * WHAT: Lock sensitive runtime and clear demo or remote session.
       * WHY: Sign-out must fail closed on private material even if network is slow.
       * CONSENT: Ends account session only — does not complete Soft Signal for peer.
       * EDGE CASES: demo → local SIGNED_OUT only (no supabase).
       * NEVER: Leave sensitiveDataService unlocked after sign-out.
       */
      async signOut() {
        sensitiveDataService.lock();
        if (state.status === "demo") return dispatch({ type: "SIGNED_OUT" });
        await authService.signOut();
        dispatch({ type: "SIGNED_OUT" });
      },
      /**
       * WHAT: Re-run restore against current session (e.g. after age-gate success).
       * WHY: Age/onboarding flags live on profile and need re-read without re-login.
       * CONSENT: May move age_gate → authenticated when adult; never grants touch.
       * EDGE CASES: state.session null → restore null path.
       * NEVER: Force ageEligible true from client without service read.
       */
      async refreshProfile() {
        await restore(state.session);
      },
      /**
       * WHAT: Enter phone-visible demo mode without a real account session.
       * WHY: Expo Go slice must work without Docker/.env (ADR 0003).
       * CONSENT: Demo data is fictional — never real dual consent or real peer contact.
       * EDGE CASES: Face ID not mandatory for demo private screens (provider policy).
       * NEVER: Persist demo wrap-ups as real trust ledger for production accounts.
       */
      enterDemoMode() {
        dispatch({ type: "ENTERED_DEMO_MODE" });
      },
    }),
    [state],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * WHAT: Consume AuthProvider value or throw if used outside the tree.
 * WHY: Fail loud in development rather than silent null auth bugs.
 * CONSENT: Not a consent surface.
 * EDGE CASES: Outside provider → throw (hooks must not invent signed-in state).
 * NEVER: Catch and default to authenticated or ageEligible true.
 */
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
