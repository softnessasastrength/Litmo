/**
 * Full Touch Language document model.
 * Preferences help conversation — never grant session consent.
 */

import {
  BODY_ZONES,
  BOUNDARY_STATUS_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  HOLD_TYPE_OPTIONS,
  PRESSURE_OPTIONS,
  SPEED_OPTIONS,
  type BoundaryStatusId,
  type DurationId,
  type EnvironmentId,
  type HoldTypeId,
  type PressureId,
  type SpeedId,
  type ZoneId,
} from "../data/touchLanguageCatalog.ts";

export const TOUCH_LANGUAGE_DOC_VERSION = 1 as const;

export type ZonePreference = {
  status: BoundaryStatusId;
  /** Preferred pressure when status allows contact; null if off_limits. */
  pressure: PressureId | null;
};

export type TouchLanguageDocument = {
  version: typeof TOUCH_LANGUAGE_DOC_VERSION;
  updatedAt: string;
  /** Human-readable display name for shares (optional). */
  displayLabel: string | null;
  pressure: PressureId;
  speed: SpeedId;
  duration: DurationId;
  environments: EnvironmentId[];
  holdTypes: HoldTypeId[];
  zones: Partial<Record<ZoneId, ZonePreference>>;
  /** Absolute nos — win over zone status. */
  hardLimits: string[];
  /** Soft limits — usually avoid; need extra care. */
  softLimits: string[];
  /** Device-private free text; stripped from share by default. */
  privateNotes: string | null;
  /** Always true — profile is never consent. */
  notConsentToTouch: true;
  /** Always true — sharing is review-only unless both open Consent Snapshot later. */
  shareIsReviewOnly: true;
};

export type TouchLanguageSharePayload = {
  kind: "touch_language_share";
  v: 1;
  document: Omit<TouchLanguageDocument, "privateNotes"> & {
    privateNotes: null;
  };
  sharedAt: string;
  requiresExplicitAccept: true;
  notConsentToTouch: true;
  notSessionActivation: true;
  disclaimer: string;
};

export type CompletenessReport = {
  zonesNamed: number;
  zonesTotal: number;
  hasEnvironments: boolean;
  hasHoldTypes: boolean;
  hardLimitCount: number;
  softLimitCount: number;
  isMinimallyComplete: boolean;
};

export function emptyZones(): Partial<Record<ZoneId, ZonePreference>> {
  return {};
}

export function createDefaultTouchLanguage(
  partial?: Partial<TouchLanguageDocument>,
): TouchLanguageDocument {
  const base: TouchLanguageDocument = {
    version: TOUCH_LANGUAGE_DOC_VERSION,
    updatedAt: new Date().toISOString(),
    displayLabel: null,
    pressure: "medium",
    speed: "unhurried",
    duration: "decide_together",
    environments: ["hosted_community"],
    holdTypes: ["side_by_side"],
    zones: emptyZones(),
    hardLimits: ["Any surprise touch"],
    softLimits: [],
    privateNotes: null,
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
  return {
    ...base,
    ...partial,
    // Safety flags and version are never overridable.
    version: TOUCH_LANGUAGE_DOC_VERSION,
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

export function isPressureId(value: unknown): value is PressureId {
  return PRESSURE_OPTIONS.some((o) => o.id === value);
}
export function isSpeedId(value: unknown): value is SpeedId {
  return SPEED_OPTIONS.some((o) => o.id === value);
}
export function isDurationId(value: unknown): value is DurationId {
  return DURATION_OPTIONS.some((o) => o.id === value);
}
export function isEnvironmentId(value: unknown): value is EnvironmentId {
  return ENVIRONMENT_OPTIONS.some((o) => o.id === value);
}
export function isHoldTypeId(value: unknown): value is HoldTypeId {
  return HOLD_TYPE_OPTIONS.some((o) => o.id === value);
}
export function isZoneId(value: unknown): value is ZoneId {
  return BODY_ZONES.some((z) => z.id === value);
}
export function isBoundaryStatusId(value: unknown): value is BoundaryStatusId {
  return BOUNDARY_STATUS_OPTIONS.some((s) => s.id === value);
}

function cleanStringList(input: unknown, max: number): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, 120);
    if (!t || out.includes(t)) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export function parseTouchLanguageDocument(
  raw: unknown,
): TouchLanguageDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (!isPressureId(o.pressure)) return null;
  if (!isSpeedId(o.speed)) return null;
  if (!isDurationId(o.duration)) return null;

  const environments = Array.isArray(o.environments)
    ? o.environments.filter(isEnvironmentId).slice(0, 8)
    : [];
  if (environments.length === 0) return null;

  const holdTypes = Array.isArray(o.holdTypes)
    ? o.holdTypes.filter(isHoldTypeId).slice(0, 20)
    : [];

  const zones: Partial<Record<ZoneId, ZonePreference>> = {};
  if (o.zones && typeof o.zones === "object") {
    for (const [key, value] of Object.entries(
      o.zones as Record<string, unknown>,
    )) {
      if (!isZoneId(key) || !value || typeof value !== "object") continue;
      const z = value as Record<string, unknown>;
      if (!isBoundaryStatusId(z.status)) continue;
      let pressure: PressureId | null = null;
      if (z.status === "off_limits") {
        pressure = null;
      } else if (isPressureId(z.pressure)) {
        pressure = z.pressure;
      } else {
        pressure = isPressureId(o.pressure) ? o.pressure : "medium";
      }
      zones[key] = { status: z.status, pressure };
    }
  }

  const privateNotes =
    typeof o.privateNotes === "string"
      ? o.privateNotes.trim().slice(0, 1000) || null
      : null;

  const updatedAt =
    typeof o.updatedAt === "string" && o.updatedAt.length > 0
      ? o.updatedAt
      : new Date().toISOString();

  const displayLabel =
    typeof o.displayLabel === "string"
      ? o.displayLabel.trim().slice(0, 80) || null
      : null;

  return {
    version: 1,
    updatedAt,
    displayLabel,
    pressure: o.pressure,
    speed: o.speed,
    duration: o.duration,
    environments,
    holdTypes,
    zones,
    hardLimits: cleanStringList(o.hardLimits, 20),
    softLimits: cleanStringList(o.softLimits, 20),
    privateNotes,
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

export function completenessOf(
  doc: TouchLanguageDocument,
): CompletenessReport {
  const zonesNamed = BODY_ZONES.filter((z) => doc.zones[z.id]).length;
  const report: CompletenessReport = {
    zonesNamed,
    zonesTotal: BODY_ZONES.length,
    hasEnvironments: doc.environments.length > 0,
    hasHoldTypes: doc.holdTypes.length > 0,
    hardLimitCount: doc.hardLimits.length,
    softLimitCount: doc.softLimits.length,
    isMinimallyComplete: false,
  };
  report.isMinimallyComplete =
    report.hasEnvironments &&
    report.hasHoldTypes &&
    report.zonesNamed >= 3 &&
    Boolean(doc.pressure) &&
    Boolean(doc.speed) &&
    Boolean(doc.duration);
  return report;
}

/**
 * Structured aliases: hard-limit free text → zones forced off_limits.
 * Living Constitution: hard limits always win over zone status.
 */
export const HARD_LIMIT_ZONE_ALIASES: Record<string, ZoneId[]> = {
  face: ["face"],
  neck: ["neck"],
  throat: ["neck"],
  head: ["face", "head_scalp"],
  scalp: ["head_scalp"],
  chest: ["torso"],
  torso: ["torso", "upper_back", "lower_back"],
  belly: ["torso"],
  stomach: ["torso"],
  back: ["upper_back", "lower_back"],
  hands: ["hands"],
  hand: ["hands"],
  arms: ["arms"],
  arm: ["arms"],
  shoulders: ["shoulders"],
  shoulder: ["shoulders"],
  hips: ["hips_outer"],
  legs: ["legs"],
  leg: ["legs"],
  feet: ["feet"],
  foot: ["feet"],
  surprise: [], // global soft rule in UI copy, not zone-wide wipe
};

export function hardLimitForcesZoneOffLimits(
  hardLimit: string,
  zoneId: ZoneId,
): boolean {
  const h = hardLimit.toLowerCase().trim();
  if (!h) return false;
  // Explicit zone id tokens: "zone:face" or bare id match
  if (h === zoneId || h === `zone:${zoneId}` || h.includes(`zone:${zoneId}`)) {
    return true;
  }
  const zoneMeta = BODY_ZONES.find((z) => z.id === zoneId);
  const label = (zoneMeta?.label ?? "").toLowerCase();
  for (const [alias, zones] of Object.entries(HARD_LIMIT_ZONE_ALIASES)) {
    if (!h.includes(alias)) continue;
    if (zones.includes(zoneId)) return true;
  }
  // Phrase contains full zone label
  if (label && h.includes(label.toLowerCase())) return true;
  // First word of label (e.g. "Upper" from "Upper back") is too loose — skip.
  return false;
}

export function effectiveZoneStatus(
  doc: TouchLanguageDocument,
  zoneId: ZoneId,
): BoundaryStatusId {
  const zone = doc.zones[zoneId];
  if (!zone) return "off_limits";
  // Hard limits win — structured aliases + explicit zone:id tokens.
  for (const hard of doc.hardLimits) {
    if (hardLimitForcesZoneOffLimits(hard, zoneId)) {
      return "off_limits";
    }
  }
  return zone.status;
}

export function setZone(
  doc: TouchLanguageDocument,
  zoneId: ZoneId,
  status: BoundaryStatusId,
  pressure?: PressureId | null,
): TouchLanguageDocument {
  const nextPressure =
    status === "off_limits"
      ? null
      : (pressure ?? doc.zones[zoneId]?.pressure ?? doc.pressure);
  return {
    ...doc,
    updatedAt: new Date().toISOString(),
    zones: {
      ...doc.zones,
      [zoneId]: { status, pressure: nextPressure },
    },
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

export function setAllUnsetZones(
  doc: TouchLanguageDocument,
  status: BoundaryStatusId,
): TouchLanguageDocument {
  let next = doc;
  for (const zone of BODY_ZONES) {
    if (!next.zones[zone.id]) {
      next = setZone(next, zone.id, status);
    }
  }
  return next;
}

export function toggleListItem(
  list: string[],
  item: string,
  max = 20,
): string[] {
  const t = item.trim().slice(0, 120);
  if (!t) return list;
  if (list.includes(t)) return list.filter((x) => x !== t);
  if (list.length >= max) return list;
  return [...list, t];
}

export function toggleHoldType(
  doc: TouchLanguageDocument,
  holdId: HoldTypeId,
): TouchLanguageDocument {
  const has = doc.holdTypes.includes(holdId);
  const holdTypes = has
    ? doc.holdTypes.filter((h) => h !== holdId)
    : [...doc.holdTypes, holdId].slice(0, 20);
  return {
    ...doc,
    holdTypes,
    updatedAt: new Date().toISOString(),
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

export function toggleEnvironment(
  doc: TouchLanguageDocument,
  envId: EnvironmentId,
): TouchLanguageDocument {
  const has = doc.environments.includes(envId);
  let environments = has
    ? doc.environments.filter((e) => e !== envId)
    : [...doc.environments, envId];
  if (environments.length === 0) environments = ["hosted_community"];
  return {
    ...doc,
    environments: environments.slice(0, 8),
    updatedAt: new Date().toISOString(),
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

export function buildSharePayload(
  doc: TouchLanguageDocument,
): TouchLanguageSharePayload {
  const { privateNotes: _private, ...rest } = doc;
  return {
    kind: "touch_language_share",
    v: 1,
    document: {
      ...rest,
      privateNotes: null,
      notConsentToTouch: true,
      shareIsReviewOnly: true,
    },
    sharedAt: new Date().toISOString(),
    requiresExplicitAccept: true,
    notConsentToTouch: true,
    notSessionActivation: true,
    disclaimer:
      "Touch Language is a preference map for conversation only. Accepting a share is not consent to touch, not a match, and not a Consent Snapshot.",
  };
}

export function parseSharePayload(
  raw: unknown,
): TouchLanguageSharePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "touch_language_share" || o.v !== 1) return null;
  if (o.notConsentToTouch !== true || o.notSessionActivation !== true)
    return null;
  if (o.requiresExplicitAccept !== true) return null;
  const document = parseTouchLanguageDocument(o.document);
  if (!document) return null;
  return {
    kind: "touch_language_share",
    v: 1,
    document: { ...document, privateNotes: null },
    sharedAt:
      typeof o.sharedAt === "string" ? o.sharedAt : new Date().toISOString(),
    requiresExplicitAccept: true,
    notConsentToTouch: true,
    notSessionActivation: true,
    disclaimer:
      typeof o.disclaimer === "string"
        ? o.disclaimer
        : "Touch Language is review-only. Not consent to touch.",
  };
}

export function labelForPressure(id: PressureId): string {
  return PRESSURE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
export function labelForSpeed(id: SpeedId): string {
  return SPEED_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
export function labelForDuration(id: DurationId): string {
  return DURATION_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
export function labelForZone(id: ZoneId): string {
  return BODY_ZONES.find((z) => z.id === id)?.label ?? id;
}
export function labelForStatus(id: BoundaryStatusId): string {
  return BOUNDARY_STATUS_OPTIONS.find((s) => s.id === id)?.label ?? id;
}

export function summarizeForDisplay(doc: TouchLanguageDocument): {
  pressure: string;
  speed: string;
  duration: string;
  environments: string;
  holds: string;
  welcomed: string;
  askFirst: string;
  softLimitZones: string;
  hardZones: string;
  hardLimits: string;
  softLimits: string;
} {
  const welcomed: string[] = [];
  const askFirst: string[] = [];
  const softLimitZones: string[] = [];
  const hardZones: string[] = [];
  for (const zone of BODY_ZONES) {
    const status = effectiveZoneStatus(doc, zone.id);
    if (status === "welcomed") welcomed.push(zone.label);
    else if (status === "ask_first") askFirst.push(zone.label);
    else if (status === "soft_limit") softLimitZones.push(zone.label);
    else hardZones.push(zone.label);
  }
  return {
    pressure: labelForPressure(doc.pressure),
    speed: labelForSpeed(doc.speed),
    duration: labelForDuration(doc.duration),
    environments: doc.environments
      .map(
        (e) =>
          ENVIRONMENT_OPTIONS.find((o) => o.id === e)?.label ?? e,
      )
      .join(" · "),
    holds: doc.holdTypes
      .map((h) => HOLD_TYPE_OPTIONS.find((o) => o.id === h)?.label ?? h)
      .join(" · "),
    welcomed: welcomed.join(" · ") || "None named",
    askFirst: askFirst.join(" · ") || "None named",
    softLimitZones: softLimitZones.join(" · ") || "None named",
    hardZones: hardZones.join(" · ") || "All unset count as off limits",
    hardLimits: doc.hardLimits.join(" · ") || "None listed",
    softLimits: doc.softLimits.join(" · ") || "None listed",
  };
}

/** Migrate legacy demo touchChoices + bodyBoundaries into a document. */
export function migrateFromLegacyDemo(input: {
  touchChoices?: Record<string, string>;
  bodyBoundaries?: Partial<Record<string, string>>;
  hardStops?: string[];
  boundaryNote?: string;
}): TouchLanguageDocument {
  const pressureMap: Record<string, PressureId> = {
    "Feather-light": "light",
    "Comfortably gentle": "medium",
    "Steady and grounding": "firm",
    light: "light",
    medium: "medium",
    firm: "firm",
  };
  const durationMap: Record<string, DurationId> = {
    "A brief hello": "brief",
    "A few quiet minutes": "few_minutes",
    "Let’s decide together": "decide_together",
    brief: "brief",
    few_minutes: "few_minutes",
    decide_together: "decide_together",
  };
  const envMap: Record<string, EnvironmentId> = {
    "A calm public place": "public_calm",
    "Somewhere outdoors": "outdoors",
    "A hosted community space": "hosted_community",
    public_calm: "public_calm",
    outdoors: "outdoors",
    hosted_community: "hosted_community",
  };

  const pressure =
    pressureMap[input.touchChoices?.pressure ?? ""] ?? "medium";
  const duration =
    durationMap[input.touchChoices?.duration ?? ""] ?? "decide_together";
  const envRaw = input.touchChoices?.environment;
  const environments: EnvironmentId[] = envRaw && envMap[envRaw]
    ? [envMap[envRaw]]
    : ["hosted_community"];

  let doc = createDefaultTouchLanguage({
    pressure,
    duration,
    environments,
    hardLimits: (input.hardStops ?? []).map(String).slice(0, 20),
    privateNotes: input.boundaryNote?.trim().slice(0, 1000) || null,
  });

  const statusMap: Record<string, BoundaryStatusId> = {
    welcomed: "welcomed",
    ask_first: "ask_first",
    off_limits: "off_limits",
    soft_limit: "soft_limit",
  };
  // Map legacy combined hands/arms → hands
  const legacyZoneAlias: Record<string, ZoneId> = {
    hands: "hands",
    arms: "arms",
    shoulders: "shoulders",
    upper_back: "upper_back",
    torso: "torso",
    neck: "neck",
    face: "face",
    lower_back: "lower_back",
    hips_outer: "hips_outer",
    legs: "legs",
    feet: "feet",
    head_scalp: "head_scalp",
  };
  for (const [key, status] of Object.entries(input.bodyBoundaries ?? {})) {
    const zoneId = legacyZoneAlias[key];
    const st = statusMap[String(status)];
    if (zoneId && st) doc = setZone(doc, zoneId, st, pressure);
  }
  return doc;
}
