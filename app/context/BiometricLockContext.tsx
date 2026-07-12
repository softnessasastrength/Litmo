import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { biometricAuthService } from "../services/biometricAuthService";
import { sensitiveDataService } from "../services/sensitiveDataService";
import {
  biometricReducer,
  biometricRequiredForAuthStatus,
  canRevealAfterAuthentication,
  initialBiometricState,
  shouldRequireReauthentication,
} from "../services/biometricAuthState";
import { useAuth } from "./AuthContext";

type BiometricLockContextValue = {
  state: typeof initialBiometricState;
  unlock: () => Promise<boolean>;
  authenticateSensitiveAction: () => Promise<boolean>;
  /** True when Face ID is enforced for the current auth status. */
  required: boolean;
};

const BiometricLockContext = createContext<BiometricLockContextValue | null>(
  null,
);

/**
 * Must mount under AuthProvider. Mandatory Face ID applies only when a real
 * account session is present (authenticated/onboarding/auth ceremony). Demo
 * mode and signed-out exploration skip the gate so Expo Go can run the
 * fictional phone-visible path without a development build.
 */
export function BiometricLockProvider({ children }: PropsWithChildren) {
  const { status: authStatus } = useAuth();
  const required = biometricRequiredForAuthStatus(authStatus);
  const requiredRef = useRef(required);
  requiredRef.current = required;

  const [state, dispatch] = useReducer(biometricReducer, {
    ...initialBiometricState,
    // Pre-account / demo starts revealed; real sessions re-lock below.
    status: "unlocked",
    message: "",
    privacyShielded: false,
  });
  const inFlight = useRef<Promise<boolean> | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const authenticate = useCallback(async () => {
    if (!requiredRef.current) {
      dispatch({ type: "UNLOCK" });
      return true;
    }
    if (inFlight.current) return inFlight.current;
    const request = (async () => {
      dispatch({ type: "CHECK" });
      try {
        dispatch({ type: "AUTHENTICATE" });
        const result = await biometricAuthService.authenticate();
        if (result.ok) {
          if (canRevealAfterAuthentication(appState.current)) {
            dispatch({ type: "UNLOCK" });
            sensitiveDataService.unlock();
            return true;
          }
          dispatch({
            type: "LOCK",
            message: "Return to Litmo and use Face ID again to unlock.",
          });
          return false;
        }
        dispatch({
          type: "FAIL",
          status: result.status,
          message: result.message,
        });
        return false;
      } catch {
        dispatch({
          type: "FAIL",
          status: "error",
          message:
            "Face ID could not start. Litmo remains locked; please try again.",
        });
        return false;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = request;
    return request;
  }, []);

  // When a real session appears (or an auth ceremony starts), lock and require
  // Face ID. When the session ends or demo mode is entered, unlock and clear
  // the privacy shield without calling LocalAuthentication.
  useEffect(() => {
    if (!required) {
      sensitiveDataService.lock();
      dispatch({ type: "UNLOCK" });
      return;
    }
    sensitiveDataService.lock();
    dispatch({
      type: "LOCK",
      message: "Face ID is required to open your Litmo account.",
    });
    void authenticate();
  }, [required, authenticate]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appState.current;
      appState.current = nextState;
      if (!requiredRef.current) return;

      if (nextState !== "active") {
        sensitiveDataService.lock();
        if (previous === "active") backgroundedAt.current = Date.now();
        dispatch({ type: "PRIVACY_SHIELD", enabled: true });
        return;
      }

      if (shouldRequireReauthentication(backgroundedAt.current, Date.now())) {
        dispatch({
          type: "LOCK",
          message: "Litmo locked after being in the background.",
        });
        sensitiveDataService.lock();
        void authenticate();
      } else {
        dispatch({ type: "PRIVACY_SHIELD", enabled: false });
      }
      backgroundedAt.current = null;
    });
    return () => subscription.remove();
  }, [authenticate]);

  const authenticateSensitiveAction = useCallback(async () => {
    if (!requiredRef.current) return true;
    sensitiveDataService.lock();
    dispatch({
      type: "LOCK",
      message: "Face ID is required again for this private area.",
    });
    return authenticate();
  }, [authenticate]);

  return (
    <BiometricLockContext.Provider
      value={{
        state,
        unlock: authenticate,
        authenticateSensitiveAction,
        required,
      }}
    >
      {children}
    </BiometricLockContext.Provider>
  );
}

export function useBiometricLock() {
  const value = useContext(BiometricLockContext);
  if (!value)
    throw new Error("useBiometricLock requires BiometricLockProvider");
  return value;
}
