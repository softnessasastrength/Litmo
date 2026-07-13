import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNeurodivergent } from "../context/NeurodivergentContext";
import { neuroTextScale, scaleStylesMap } from "../lib/neuroStyleScale";
import type { AppColors } from "../theme";

/**
 * WHAT: Builds a StyleSheet from the active theme palette, optionally scaled for
 *   Neurodivergent Mode (larger readable text and tap targets).
 * WHY: One hook keeps color, dark mode, and ND scale consistent app-wide without
 *   each screen re-implementing neuroStyleScale.
 * CONSENT: Not a consent surface. ND scaling is accessibility comfort only —
 *   never a clinical trait, match signal, or safety score.
 * EDGE CASES:
 *   - factory is expected module-stable; omitted from deps intentionally.
 *   - prefs.enabled false → scale 1 (no growth).
 *   - colors/shadow/isDark/scale change → recompute StyleSheet.
 * NEVER: Encode consent authorization in style factories. Never use scale as “ready for strangers.”
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md law “ND calm by default (demo)” · app/lib/neuroStyleScale.ts
 */
export function useThemedStyles(
  factory: (
    colors: AppColors,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: any,
    isDark: boolean,
  ) => Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const { colors, shadow, isDark } = useTheme();
  const { prefs } = useNeurodivergent();
  // ND text/target scale: device preference presentation — not matching eligibility.
  const scale = neuroTextScale(prefs.enabled);
  return useMemo(() => {
    const raw = factory(colors, shadow, isDark);
    const scaled = scaleStylesMap(raw, scale);
    return StyleSheet.create(scaled as never);
    // factory is expected stable (module scope); colors/shadow/scale change on toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, shadow, isDark, scale]);
}
