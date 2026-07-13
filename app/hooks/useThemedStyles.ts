import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNeurodivergent } from "../context/NeurodivergentContext";
import { neuroTextScale, scaleStylesMap } from "../lib/neuroStyleScale";
import type { AppColors } from "../theme";

/**
 * Build StyleSheet values from the active theme palette.
 * When Neurodivergent Mode is on, scales readable text and tap targets app-wide.
 * Factory should be a stable module-level function.
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
  const scale = neuroTextScale(prefs.enabled);
  return useMemo(() => {
    const raw = factory(colors, shadow, isDark);
    const scaled = scaleStylesMap(raw, scale);
    return StyleSheet.create(scaled as never);
    // factory is expected stable (module scope); colors/shadow/scale change on toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, shadow, isDark, scale]);
}
