import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import type { AppColors } from "../theme";

/**
 * Build StyleSheet values from the active theme palette.
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
  return useMemo(
    () => StyleSheet.create(factory(colors, shadow, isDark) as never),
    // factory is expected stable (module scope); colors/shadow change on toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, shadow, isDark],
  );
}
