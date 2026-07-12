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
import {
  biometricReducer,
  canRevealAfterAuthentication,
  initialBiometricState,
  shouldRequireReauthentication,
} from "../services/biometricAuthState";

type BiometricLockContextValue = {
  state: typeof initialBiometricState;
  unlock: () => Promise<boolean>;
  authenticateSensitiveAction: () => Promise<boolean>;
};

const BiometricLockContext = createContext<BiometricLockContextValue | null>(
  null,
);

export function BiometricLockProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(biometricReducer, initialBiometricState);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const authenticate = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    const request = (async () => {
      dispatch({ type: "CHECK" });
      try {
        dispatch({ type: "AUTHENTICATE" });
        const result = await biometricAuthService.authenticate();
        if (result.ok) {
          if (canRevealAfterAuthentication(appState.current)) {
            dispatch({ type: "UNLOCK" });
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

  useEffect(() => {
    void authenticate();
  }, [authenticate]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appState.current;
      appState.current = nextState;
      if (nextState !== "active") {
        if (previous === "active") backgroundedAt.current = Date.now();
        dispatch({ type: "PRIVACY_SHIELD", enabled: true });
        return;
      }

      if (shouldRequireReauthentication(backgroundedAt.current, Date.now())) {
        dispatch({
          type: "LOCK",
          message: "Litmo locked after being in the background.",
        });
        void authenticate();
      } else {
        dispatch({ type: "PRIVACY_SHIELD", enabled: false });
      }
      backgroundedAt.current = null;
    });
    return () => subscription.remove();
  }, [authenticate]);

  const authenticateSensitiveAction = useCallback(async () => {
    dispatch({
      type: "LOCK",
      message: "Face ID is required again for this private area.",
    });
    return authenticate();
  }, [authenticate]);

  return (
    <BiometricLockContext.Provider
      value={{ state, unlock: authenticate, authenticateSensitiveAction }}
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
