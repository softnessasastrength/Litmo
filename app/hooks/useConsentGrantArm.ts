/**
 * Deliberate grant arming — dwell clock after all required toggles are on.
 * Soft Signal must never use this hook.
 */

import { useEffect, useRef, useState } from "react";
import {
  CONSENT_TIMING,
  mayEnableGrantConfirm,
} from "../lib/consentInteractionCore";

export function useConsentGrantArm(input: {
  contentReady: boolean;
  requiredTogglesAllOn: boolean;
  fingerprintCurrent?: boolean;
  withdrawn?: boolean;
}): {
  dwellMs: number;
  armed: boolean;
  armProgress: number;
} {
  const [dwellMs, setDwellMs] = useState(0);
  const readyAt = useRef<number | null>(null);

  const ready =
    input.contentReady &&
    input.requiredTogglesAllOn &&
    !input.withdrawn &&
    (input.fingerprintCurrent !== false);

  useEffect(() => {
    if (!ready) {
      readyAt.current = null;
      setDwellMs(0);
      return;
    }
    if (readyAt.current == null) readyAt.current = Date.now();
    const tick = setInterval(() => {
      if (readyAt.current == null) return;
      setDwellMs(Date.now() - readyAt.current);
    }, 40);
    return () => clearInterval(tick);
  }, [ready]);

  const armed = mayEnableGrantConfirm({
    contentReady: input.contentReady,
    requiredTogglesAllOn: input.requiredTogglesAllOn,
    dwellMs,
    fingerprintCurrent: input.fingerprintCurrent !== false,
    withdrawn: Boolean(input.withdrawn),
  });

  const armProgress = Math.min(
    1,
    dwellMs / Math.max(1, CONSENT_TIMING.grantArmDwellMs),
  );

  return { dwellMs, armed, armProgress };
}
