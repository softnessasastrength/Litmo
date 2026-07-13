import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * WHAT: Subscribes to the OS Reduce Motion preference and returns a live boolean.
 * WHY: Onboarding quiz advance delay, FadeIn, and other micro-motion must collapse
 *   to zero or static when the user asks for less motion (a11y law).
 * CONSENT: Not a consent surface. Affects presentation timing only — never grant
 *   arm dwell (320ms) on dual-seal, never Soft Signal latency (stop stays fast).
 * EDGE CASES:
 *   - Initial state false until first isReduceMotionEnabled resolves → brief
 *     motion may run once; prefer fail-open for motion (not for consent gates).
 *   - Preference flips mid-session via reduceMotionChanged → next interactions honor it.
 *   - Unmount removes subscription to avoid leaks.
 * NEVER: Use this to skip age, boundary, or Soft Signal requirements. Never slow Soft Signal.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §13 · docs/CODE_COMMENT_STANDARD.md · AccessibilityInfo
 */
export function useReducedMotion() {
  // Fail-open for motion: default false so we do not invent “reduced” before the OS answers.
  // Consent / eligibility gates must never default open this way.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => subscription.remove();
  }, []);
  return reduced;
}
