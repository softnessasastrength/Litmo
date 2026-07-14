/**
 * Emotional Masochist Mode — global intensity/ritualization toggle.
 * Makes containment protocols longer, denser, more ceremonial.
 * Soft Signal freeness is NEVER reduced.
 */
export const MASOCHIST_MODE_VERSION = 1 as const;

export type MasochistPrefs = {
  version: typeof MASOCHIST_MODE_VERSION;
  enabled: boolean;
  /** Extra ritual steps / longer scripts preferred */
  denserScripts: boolean;
  /** Prefer Edge-capable paths where they exist */
  preferEdge: boolean;
  /** Ceremony language on */
  ceremonialCopy: boolean;
  updatedAt: string;
};

export function defaultMasochistPrefs(): MasochistPrefs {
  return {
    version: MASOCHIST_MODE_VERSION,
    enabled: false,
    denserScripts: true,
    preferEdge: false,
    ceremonialCopy: true,
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
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : d.updatedAt,
  };
}

/** Script step multiplier when mode on + denserScripts */
export function ritualDensity(prefs: MasochistPrefs): number {
  if (!prefs.enabled) return 1;
  return prefs.denserScripts ? 1.5 : 1.2;
}

export function masochistBanner(prefs: MasochistPrefs): string | null {
  if (!prefs.enabled) return null;
  return prefs.ceremonialCopy
    ? "EMOTIONAL MASOCHIST MODE · denser ritual · Soft Signal still free"
    : "Masochist mode on · Soft Signal free";
}
