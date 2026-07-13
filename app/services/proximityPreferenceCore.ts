/**
 * Proximity layer preferences — pure, fail closed to OFF.
 */

export const PROXIMITY_PREF_KEY = "@litmo/proximity_layer_prefs_v1";

export type ProximityPrefs = {
  /** Master opt-in for proximity radar (default false). */
  enabled: boolean;
  /** Include optional vibe weather family on anonymous beacon. */
  includeWeather: boolean;
  /** Prefer quieter nearby interactions (broadcast on beacon). */
  quietPreferred: boolean;
  axes: {
    pace: number;
    presence: number;
    sensory: number;
    repair: number;
  };
  weather: "hearth" | "lantern" | "tidepool" | "none";
};

export const defaultProximityPrefs: ProximityPrefs = {
  enabled: false,
  includeWeather: false,
  quietPreferred: true,
  axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
  weather: "none",
};

export function parseProximityPrefs(raw: string | null): ProximityPrefs {
  if (!raw) return { ...defaultProximityPrefs, axes: { ...defaultProximityPrefs.axes } };
  try {
    const o = JSON.parse(raw) as Partial<ProximityPrefs>;
    return {
      enabled: Boolean(o.enabled),
      includeWeather: Boolean(o.includeWeather),
      quietPreferred: o.quietPreferred !== false,
      axes: {
        pace: clamp(o.axes?.pace ?? 1),
        presence: clamp(o.axes?.presence ?? 1),
        sensory: clamp(o.axes?.sensory ?? 1),
        repair: clamp(o.axes?.repair ?? 1),
      },
      weather:
        o.weather === "hearth" ||
        o.weather === "lantern" ||
        o.weather === "tidepool"
          ? o.weather
          : "none",
    };
  } catch {
    return { ...defaultProximityPrefs, axes: { ...defaultProximityPrefs.axes } };
  }
}

export function serializeProximityPrefs(prefs: ProximityPrefs): string {
  return JSON.stringify(prefs);
}

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 1;
  if (!Number.isFinite(v)) return 1;
  return Math.max(0, Math.min(3, Math.round(v)));
}
