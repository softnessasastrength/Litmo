import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorSchemeName } from "react-native";
import {
  type AppColors,
  type ColorSchemePreference,
  type ResolvedColorScheme,
  darkShadow,
  lightShadow,
  nextAppearancePreference,
  paletteFor,
  resolveScheme,
} from "../theme";
import { themePreference } from "../services/themePreference";

type ThemeState = {
  /** Stored preference (may be system). */
  scheme: ColorSchemePreference;
  /** Resolved light/dark after system. */
  resolvedScheme: ResolvedColorScheme;
  isDark: boolean;
  colors: AppColors;
  shadow: typeof lightShadow | typeof darkShadow;
  ready: boolean;
  setScheme: (scheme: ColorSchemePreference) => void;
  /** Cycles light → dark → system. */
  cycleScheme: () => void;
  /** @deprecated use cycleScheme — kept for a single-toggle mental model. */
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

function systemIsDarkFrom(name: ColorSchemeName | null | undefined): boolean {
  return name === "dark";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [scheme, setSchemeState] = useState<ColorSchemePreference>("light");
  const [systemIsDark, setSystemIsDark] = useState(() =>
    systemIsDarkFrom(Appearance.getColorScheme() ?? null),
  );
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

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemIsDark(systemIsDarkFrom(colorScheme));
    });
    return () => sub.remove();
  }, []);

  const setScheme = useCallback((next: ColorSchemePreference) => {
    setSchemeState(next);
    void themePreference.save(next);
  }, []);

  const cycleScheme = useCallback(() => {
    setSchemeState((prev) => {
      const next = nextAppearancePreference(prev);
      void themePreference.save(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeState>(() => {
    const resolved = resolveScheme(scheme, systemIsDark);
    const isDark = resolved === "dark";
    return {
      scheme,
      resolvedScheme: resolved,
      isDark,
      colors: paletteFor(resolved),
      shadow: isDark ? darkShadow : lightShadow,
      ready,
      setScheme,
      cycleScheme,
      toggleScheme: cycleScheme,
    };
  }, [scheme, systemIsDark, ready, setScheme, cycleScheme]);

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
