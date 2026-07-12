import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from "react";
import {
  type AppColors,
  type ColorSchemePreference,
  darkShadow,
  lightShadow,
  paletteFor } from "../theme";
import { themePreference } from "../services/themePreference";

type ThemeState = {
  scheme: ColorSchemePreference;
  isDark: boolean;
  colors: AppColors;
  shadow: typeof lightShadow | typeof darkShadow;
  /** Ready after first preference load (avoids light flash if stored dark). */
  ready: boolean;
  setScheme: (scheme: ColorSchemePreference) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [scheme, setSchemeState] = useState<ColorSchemePreference>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void themePreference.load().then((stored) => {
      if (cancelled) return;
      setSchemeState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setScheme = useCallback((next: ColorSchemePreference) => {
    setSchemeState(next);
    void themePreference.save(next);
  }, []);

  const toggleScheme = useCallback(() => {
    setSchemeState((prev) => {
      const next: ColorSchemePreference = prev === "dark" ? "light" : "dark";
      void themePreference.save(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeState>(() => {
    const isDark = scheme === "dark";
    return {
      scheme,
      isDark,
      colors: paletteFor(scheme),
      shadow: isDark ? darkShadow : lightShadow,
      ready,
      setScheme,
      toggleScheme };
  }, [scheme, ready, setScheme, toggleScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useColors(): AppColors {
  return useTheme().colors;
}
