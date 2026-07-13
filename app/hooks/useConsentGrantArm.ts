/**
 * useConsentGrantArm — deliberate grant-arming dwell clock.
 *
 * WHAT: Tracks how long the user has had all grant preconditions satisfied,
 *       and reports whether Confirm/Seal may enable (`armed`) plus 0–1 progress.
 * WHY:  Constitution + CONSENT_MICROINTERACTIONS: granting consent is slow.
 *       A user who flicks the last checkbox and mashes Confirm is not
 *       expressing the same intentionality as someone who has read and held.
 *       This hook is the shared dwell implementation so every grant surface
 *       cannot invent a shorter local timer.
 * CONSENT: PREPARE/GRANT path only. Soft Signal must NEVER call this hook.
 *       Arming is anti-accidental for saying yes — it must never delay saying no.
 * EDGE CASES:
 *   - Precondition drops mid-dwell (toggle off, withdraw, stale fingerprint)
 *     → clock resets to 0; armed becomes false immediately.
 *   - fingerprintCurrent omitted → treated as true (default “current” unless
 *     caller explicitly passes false for stale packages).
 *   - withdrawn true → ready false forever until cleared (stop wins).
 *   - contentReady false (still loading snapshot) → no dwell starts.
 * NEVER:
 *   - Does not seal a snapshot by itself.
 *   - Does not prove mutual peer consent.
 *   - Does not authorize touch.
 *   - Does not replace Soft Signal (and must not be used to gate Soft Signal).
 * SEE: docs/CODE_COMMENT_STANDARD.md, docs/CONSENT_MICROINTERACTIONS.md,
 *      mayEnableGrantConfirm / CONSENT_TIMING.grantArmDwellMs in consentInteractionCore.
 */

import { useEffect, useRef, useState } from "react";
import {
  CONSENT_TIMING,
  mayEnableGrantConfirm,
} from "../lib/consentInteractionCore";

/**
 * WHAT: React hook that arms a grant Confirm control after minimum dwell.
 * WHY:  UI components must not hard-code 320ms in three places with drift.
 * CONSENT: Grant intentionality only — never withdraw.
 * EDGE CASES: See module header; interval 40ms balances progress UI smoothness
 *             vs battery (not 1ms spam, not 200ms choppy progress).
 * NEVER: Return armed true while withdrawn or fingerprint stale.
 * SEE: ConsentAffirmRow + mutual seal screens that disable Confirm until armed.
 */
export function useConsentGrantArm(input: {
  /** Snapshot / package finished loading and is human-readable. */
  contentReady: boolean;
  /** Every required ConsentAffirmRow (or equivalent) is checked on. */
  requiredTogglesAllOn: boolean;
  /**
   * When false, package is stale (profile edited mid-review).
   * Omitted means “assume current” so simple screens need not pass true.
   */
  fingerprintCurrent?: boolean;
  /**
   * Soft Signal / withdraw already taken on this path.
   * Must force disarm — stop wins over seal beauty.
   */
  withdrawn?: boolean;
}): {
  /** Milliseconds continuously ready; 0 when not ready. */
  dwellMs: number;
  /** True only when mayEnableGrantConfirm passes (dwell + all gates). */
  armed: boolean;
  /** 0..1 progress toward grantArmDwellMs for “Arming…” UI. */
  armProgress: number;
} {
  // dwellMs is UI-facing elapsed readiness — not a wall-clock promise of intent.
  const [dwellMs, setDwellMs] = useState(0);
  // readyAt anchors the dwell window; null means “clock not running”.
  const readyAt = useRef<number | null>(null);

  // All grant preconditions in one boolean so the effect has a single dep.
  // fingerprintCurrent !== false: missing prop defaults to “current package”.
  // Explicit false (stale fingerprint) fails closed and resets the clock.
  const ready =
    input.contentReady &&
    input.requiredTogglesAllOn &&
    !input.withdrawn &&
    input.fingerprintCurrent !== false;

  useEffect(() => {
    // Fail closed: any lost precondition cancels arming immediately.
    // WHY not leave residual dwellMs: a re-toggle must re-earn the full dwell,
    // not inherit partial progress from a previous “almost yes”.
    if (!ready) {
      readyAt.current = null;
      setDwellMs(0);
      return;
    }
    // Start the dwell anchor only on the rising edge of readiness.
    if (readyAt.current == null) readyAt.current = Date.now();
    // 40ms tick: enough for smooth armProgress bar; not a spin loop.
    const tick = setInterval(() => {
      // Defensive: interval may fire after cleanup race — ignore if disarmed.
      if (readyAt.current == null) return;
      setDwellMs(Date.now() - readyAt.current);
    }, 40);
    // Clear interval when ready flips false or component unmounts.
    return () => clearInterval(tick);
  }, [ready]);

  // Single source of arm truth — same pure function tests use.
  // UI must not invent “armed if progress looks full” without this check.
  const armed = mayEnableGrantConfirm({
    contentReady: input.contentReady,
    requiredTogglesAllOn: input.requiredTogglesAllOn,
    dwellMs,
    fingerprintCurrent: input.fingerprintCurrent !== false,
    withdrawn: Boolean(input.withdrawn),
  });

  // Clamp to 1 so overshoot after dwell does not grow the progress bar.
  // Math.max(1, dwell) avoids divide-by-zero if a future edit set dwell to 0.
  const armProgress = Math.min(
    1,
    dwellMs / Math.max(1, CONSENT_TIMING.grantArmDwellMs),
  );

  return { dwellMs, armed, armProgress };
}
