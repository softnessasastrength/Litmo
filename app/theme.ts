/**
 * Litmo color systems — light (default cream journal) and dark (night soft).
 * Prefer useTheme() / useColors() from ThemeContext so toggles re-render.
 * The static `colors` export remains the light palette for non-React callers.
 */

export const fonts = {
  headline: "CormorantGaramond-Italic",
  wordmark: "BeauRivage-Regular",
} as const;

export type AppColors = {
  ink: string;
  muted: string;
  cream: string;
  paper: string;
  moss: string;
  mossSoft: string;
  plum: string;
  plumSoft: string;
  apricot: string;
  apricotSoft: string;
  line: string;
  white: string;
  signal: string;
  signalSoft: string;
  gold: string;
};

/** Warm cream journal surface (product default). */
export const lightColors: AppColors = {
  ink: "#302D2A",
  muted: "#6E6861",
  cream: "#F7F1E8",
  paper: "#FFFDFC",
  moss: "#3F6658",
  mossSoft: "#DDE9DF",
  plum: "#70536E",
  plumSoft: "#EEE2EC",
  apricot: "#EBAE83",
  apricotSoft: "#F9E4D4",
  line: "#DDD3C8",
  white: "#FFFFFF",
  signal: "#8C3F46",
  signalSoft: "#F5E1E0",
  gold: "#B8833C",
};

/**
 * Night surface: charcoal paper, soft moss accents, readable ink.
 * Soft Signal stays rose-distinct for safety (not color-only).
 */
export const darkColors: AppColors = {
  ink: "#F0EBE3",
  muted: "#A89F94",
  cream: "#1C1A18",
  paper: "#2A2724",
  moss: "#7FA894",
  mossSoft: "#2F3D36",
  plum: "#C4A8C0",
  plumSoft: "#3A3038",
  apricot: "#E0A97A",
  apricotSoft: "#3D322A",
  line: "#3F3A35",
  /** Always pure white for text on moss / signal fills. */
  white: "#FFFFFF",
  signal: "#E07A82",
  signalSoft: "#3D282A",
  gold: "#D4A85C",
};

/** @deprecated Prefer useColors() — static light palette for tests / non-React. */
export const colors = lightColors;

export const radius = { sm: 14, md: 22, lg: 32, pill: 999 } as const;

export const lightShadow = {
  shadowColor: "#392F2A",
  shadowOpacity: 0.09,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const darkShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

/** @deprecated Prefer shadowFor(colors) / useTheme().shadow */
export const shadow = lightShadow;

export function shadowFor(isDark: boolean) {
  return isDark ? darkShadow : lightShadow;
}

/** Stored preference. `system` follows the OS light/dark setting. */
export type ColorSchemePreference = "light" | "dark" | "system";

/** Resolved palette key after applying system appearance. */
export type ResolvedColorScheme = "light" | "dark";

export function resolveScheme(
  preference: ColorSchemePreference,
  systemIsDark: boolean,
): ResolvedColorScheme {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

export function paletteFor(scheme: ResolvedColorScheme): AppColors {
  return scheme === "dark" ? darkColors : lightColors;
}

/** Cycle Settings control: light → dark → system → light. */
export function nextAppearancePreference(
  current: ColorSchemePreference,
): ColorSchemePreference {
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  return "light";
}
