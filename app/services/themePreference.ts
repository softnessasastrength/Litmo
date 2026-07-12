import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ColorSchemePreference } from "../theme";
import { parseThemeScheme } from "./themePreferenceCore.ts";

export const THEME_PREF_KEY = "litmo.theme.scheme.v1";
export { parseThemeScheme };

export const themePreference = {
  async load(): Promise<ColorSchemePreference> {
    try {
      return parseThemeScheme(await AsyncStorage.getItem(THEME_PREF_KEY));
    } catch {
      return "light";
    }
  },
  async save(scheme: ColorSchemePreference): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, scheme);
    } catch {
      // Device storage failure: in-memory theme still works for the session.
    }
  },
};
