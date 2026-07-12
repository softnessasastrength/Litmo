import { type PropsWithChildren, useEffect, useState } from "react";
import { LoadingState } from "./AsyncState";
import { useBiometricLock } from "../context/BiometricLockContext";

export function SensitiveAccessGate({ children }: PropsWithChildren) {
  const { authenticateSensitiveAction } = useBiometricLock();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    void authenticateSensitiveAction().then((ok) => {
      if (mounted) setAllowed(ok);
    });
    return () => {
      mounted = false;
    };
  }, [authenticateSensitiveAction]);

  if (!allowed) return <LoadingState label="Protecting this private area…" />;
  return children;
}
