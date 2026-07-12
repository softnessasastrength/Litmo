import { type PropsWithChildren, useEffect, useState } from "react";
import { LoadingState } from "./AsyncState";
import { useBiometricLock } from "../context/BiometricLockContext";

/**
 * Step-up Face ID for private screens. In demo / pre-account states the
 * biometric provider reports required=false and authenticateSensitiveAction
 * resolves true without calling LocalAuthentication, so Expo Go can walk
 * Consent Snapshot, Soft Signal, wrap-up, and trust history on fictional data.
 */
export function SensitiveAccessGate({ children }: PropsWithChildren) {
  const { authenticateSensitiveAction, required } = useBiometricLock();
  const [allowed, setAllowed] = useState(!required);

  useEffect(() => {
    if (!required) {
      setAllowed(true);
      return;
    }
    let mounted = true;
    setAllowed(false);
    void authenticateSensitiveAction().then((ok) => {
      if (mounted) setAllowed(ok);
    });
    return () => {
      mounted = false;
    };
  }, [authenticateSensitiveAction, required]);

  if (!allowed) return <LoadingState label="Protecting this private area…" />;
  return children;
}
