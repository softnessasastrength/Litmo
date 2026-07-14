/**
 * Nervous System Weather — daily local check-in.
 * Containment job: name the weather before it becomes someone else's job.
 * Soft Signal free. Not clinical. Not a partner dashboard.
 */
export const WEATHER_VERSION = "0.1" as const;

export type WeatherDraft = {
  energy: 1 | 2 | 3 | 4 | 5 | null;
  anxiety: 1 | 2 | 3 | 4 | 5 | null;
  attachmentHeat: 1 | 2 | 3 | 4 | 5 | null;
  capacityForOthers: 1 | 2 | 3 | 4 | 5 | null;
  note: string;
  softSignalAcknowledged: boolean;
};

export type WeatherSnapshot = {
  id: string;
  version: typeof WEATHER_VERSION;
  sealedAt: string;
  energy: 1 | 2 | 3 | 4 | 5;
  anxiety: 1 | 2 | 3 | 4 | 5;
  attachmentHeat: 1 | 2 | 3 | 4 | 5;
  capacityForOthers: 1 | 2 | 3 | 4 | 5;
  note: string;
  skyLabel: string;
};

export type WeatherEntry = {
  snapshot: WeatherSnapshot;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "abandoned";
};

export function defaultWeatherDraft(): WeatherDraft {
  return {
    energy: null,
    anxiety: null,
    attachmentHeat: null,
    capacityForOthers: null,
    note: "",
    softSignalAcknowledged: false,
  };
}

export function canSealWeather(d: WeatherDraft): { ok: boolean; reason: string } {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal free required (always)." };
  if (
    d.energy == null ||
    d.anxiety == null ||
    d.attachmentHeat == null ||
    d.capacityForOthers == null
  )
    return { ok: false, reason: "Name all four axes (1–5)." };
  return { ok: true, reason: "Ready." };
}

/** Poetry label from axes — comedy + utility */
export function skyLabel(
  energy: number,
  anxiety: number,
  attachmentHeat: number,
  capacity: number,
): string {
  if (anxiety >= 4 && capacity <= 2) return "Storm · low capacity";
  if (attachmentHeat >= 4 && anxiety >= 3) return "Attachment thunder";
  if (energy <= 2 && capacity <= 2) return "Fog · rest first";
  if (energy >= 4 && anxiety <= 2 && capacity >= 4) return "Clear · careful green";
  if (attachmentHeat >= 4) return "Warm front · need present";
  if (anxiety >= 4) return "High winds · Soft Signal free";
  if (capacity >= 4) return "Partly open";
  return "Mixed sky · Soft Signal free";
}

export function sealWeather(d: WeatherDraft): WeatherSnapshot | null {
  if (!canSealWeather(d).ok) return null;
  const energy = d.energy!;
  const anxiety = d.anxiety!;
  const attachmentHeat = d.attachmentHeat!;
  const capacityForOthers = d.capacityForOthers!;
  return {
    id: `weather-${Date.now()}`,
    version: WEATHER_VERSION,
    sealedAt: new Date().toISOString(),
    energy,
    anxiety,
    attachmentHeat,
    capacityForOthers,
    note: d.note.trim().slice(0, 400),
    skyLabel: skyLabel(energy, anxiety, attachmentHeat, capacityForOthers),
  };
}

export function parseWeatherHistory(raw: unknown): WeatherEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && (x as WeatherEntry).snapshot,
  ) as WeatherEntry[];
}

export function summarizeWeather(entries: WeatherEntry[]) {
  if (entries.length === 0) {
    return {
      total: 0,
      avg_anxiety: null as number | null,
      avg_capacity: null as number | null,
      last_sky: null as string | null,
    };
  }
  let a = 0;
  let c = 0;
  for (const e of entries) {
    a += e.snapshot.anxiety;
    c += e.snapshot.capacityForOthers;
  }
  return {
    total: entries.length,
    avg_anxiety: Math.round((a / entries.length) * 10) / 10,
    avg_capacity: Math.round((c / entries.length) * 10) / 10,
    last_sky: entries[0]!.snapshot.skyLabel,
  };
}

/** Suggest protocols from weather without partner surveillance */
export function weatherSuggestions(s: WeatherSnapshot): string[] {
  const out: string[] = [];
  if (s.anxiety >= 4 || s.capacityForOthers <= 2) out.push("/soft-signal/practice", "/too-much");
  if (s.attachmentHeat >= 4) out.push("/need-scared", "/attachment-repair");
  if (s.energy <= 2) out.push("/not-ready-yet", "/containment/lofi");
  if (s.capacityForOthers >= 4 && s.anxiety <= 2) out.push("/parallel-play", "/pre-renn");
  if (out.length === 0) out.push("/containment", "/debrief-lab");
  const seen = new Set<string>();
  return out.filter((h) => {
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  }).slice(0, 4);
}
