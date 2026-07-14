/**
 * Emotional Masochist Mode — global intensity/ritualization toggle.
 * Makes containment protocols longer, denser, more ceremonial.
 * Soft Signal freeness is NEVER reduced.
 * v0.2: consumer helpers + intensity labels + Soft Signal hard invariant.
 */
export const MASOCHIST_MODE_VERSION = 2 as const;

export type MasochistPrefs = {
  version: typeof MASOCHIST_MODE_VERSION;
  enabled: boolean;
  /** Extra ritual steps / longer scripts preferred */
  denserScripts: boolean;
  /** Prefer Edge-capable paths where they exist (still capped) */
  preferEdge: boolean;
  /** Ceremony language on */
  ceremonialCopy: boolean;
  /** Self-aware: I am choosing intensity as regulation */
  intensityAsRegulation: boolean;
  updatedAt: string;
};

export function defaultMasochistPrefs(): MasochistPrefs {
  return {
    version: MASOCHIST_MODE_VERSION,
    enabled: false,
    denserScripts: true,
    preferEdge: false,
    ceremonialCopy: true,
    intensityAsRegulation: true,
    updatedAt: new Date(0).toISOString(),
  };
}

export function parseMasochistPrefs(raw: unknown): MasochistPrefs {
  const d = defaultMasochistPrefs();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  return {
    version: MASOCHIST_MODE_VERSION,
    enabled: Boolean(o.enabled),
    denserScripts: o.denserScripts !== false,
    preferEdge: Boolean(o.preferEdge),
    ceremonialCopy: o.ceremonialCopy !== false,
    intensityAsRegulation: o.intensityAsRegulation !== false,
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : d.updatedAt,
  };
}

/** Script step multiplier when mode on + denserScripts */
export function ritualDensity(prefs: MasochistPrefs): number {
  if (!prefs.enabled) return 1;
  return prefs.denserScripts ? 1.5 : 1.2;
}

/** Whether consumers should inject denserSteps / ceremony */
export function wantsDenserRitual(prefs: MasochistPrefs): boolean {
  return prefs.enabled && prefs.denserScripts;
}

export function wantsCeremonialCopy(prefs: MasochistPrefs): boolean {
  return prefs.enabled && prefs.ceremonialCopy;
}

export function wantsEdgeBias(prefs: MasochistPrefs): boolean {
  return prefs.enabled && prefs.preferEdge;
}

/**
 * Soft Signal freeness invariant — always true.
 * Consumers must never gate Soft Signal on masochist mode.
 */
export function softSignalStillFree(_prefs: MasochistPrefs): true {
  return true;
}

export function masochistBanner(prefs: MasochistPrefs): string | null {
  if (!prefs.enabled) return null;
  if (prefs.ceremonialCopy) {
    return "EMOTIONAL MASOCHIST MODE · denser ritual · Soft Signal still free · intensity as regulation allowed";
  }
  return "Masochist mode on · Soft Signal free";
}

export function intensityLabel(prefs: MasochistPrefs): string {
  if (!prefs.enabled) return "baseline";
  if (prefs.denserScripts && prefs.ceremonialCopy) return "cathedral";
  if (prefs.denserScripts) return "dense";
  if (prefs.ceremonialCopy) return "ceremonial";
  return "lit";
}

export const MASOCHIST_INVARIANTS = [
  "Soft Signal freeness is never reduced by this mode.",
  "Edge remains capped where Edge exists; preferEdge is bias not override.",
  "Intensity is allowed as regulation — and allowed to be turned off.",
  "This mode is self-aware: choosing denser ritual is not proof of brokenness.",
  "Turning the mode off is always Soft Signal free.",
] as const;
