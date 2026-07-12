import type { ColorSchemePreference } from "../theme";

export function parseThemeScheme(raw: string | null): ColorSchemePreference {
  if (raw === "dark") return "dark";
  if (raw === "system") return "system";
  // Missing, "light", or malformed → light (product default cream journal).
  return "light";
}
