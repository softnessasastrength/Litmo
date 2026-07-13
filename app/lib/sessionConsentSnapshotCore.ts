/**
 * Pre-session Consent Snapshot — personal declaration + mutual seal.
 * Serious, protective, fail-closed. Never grants touch by itself until
 * both people independently affirm the same sealed package.
 */

import {
  BODY_ZONES,
  type ZoneId,
} from "../data/touchLanguageCatalog.ts";
import {
  effectiveZoneStatus,
  type TouchLanguageDocument,
} from "./touchLanguageCore.ts";

export const PRE_SESSION_SNAPSHOT_VERSION = 1 as const;

export const MOOD_OPTIONS = [
  { id: "grounded", label: "Grounded", detail: "Settled enough to choose freely" },
  { id: "open", label: "Open", detail: "Curious and available" },
  { id: "tender", label: "Tender", detail: "Soft day — slower pace needed" },
  { id: "guarded", label: "Guarded", detail: "Present but careful" },
  { id: "low_capacity", label: "Low capacity", detail: "Brief contact only, or pause" },
  { id: "unsure", label: "Unsure", detail: "May need to stop early — Soft Signal ready" },
] as const;

export const ENERGY_OPTIONS = [
  { id: "steady", label: "Steady" },
  { id: "low", label: "Low" },
  { id: "high", label: "High / buzzed" },
  { id: "tired", label: "Tired" },
  { id: "recovering", label: "Recovering from a hard day" },
] as const;

export const AFTERCARE_OPTIONS = [
  { id: "quiet_side", label: "Quiet side-by-side time" },
  { id: "water_space", label: "Water / space alone first" },
  { id: "check_in_words", label: "Short verbal check-in" },
  { id: "walk", label: "A short walk" },
  { id: "no_debrief", label: "No debrief unless I ask" },
  { id: "text_later", label: "Optional text later (only if both want)" },
  { id: "exit_clean", label: "Clean exit without lingering" },
] as const;

export type MoodId = (typeof MOOD_OPTIONS)[number]["id"];
export type EnergyId = (typeof ENERGY_OPTIONS)[number]["id"];
export type AftercareId = (typeof AFTERCARE_OPTIONS)[number]["id"];

export type SafewordSet = {
  /** Immediate full stop — maps to Soft Signal spirit. */
  stop: string;
  /** Slow down / check in — not a full stop. */
  slow: string;
  /** Optional all-clear / continue ok. */
  ok: string | null;
};

export type BoundaryLine = {
  zoneId: ZoneId | string;
  label: string;
  status: "welcomed" | "ask_first" | "soft_limit" | "off_limits";
};

export type SoftSignalAcknowledgment = {
  /** User affirms they know Soft Signal ends everything immediately. */
  understandsImmediateStop: true;
  /** User affirms no explanation is required. */
  understandsNoExplanation: true;
  /** User affirms Soft Signal is available to both people equally. */
  understandsMutualAvailability: true;
  affirmedAt: string;
};

/**
 * One person's pre-session declaration for a specific upcoming encounter.
 * Not a Consent Snapshot until mutually sealed.
 */
export type PreSessionDeclaration = {
  version: typeof PRE_SESSION_SNAPSHOT_VERSION;
  id: string;
  role: "self" | "partner_practice" | "imported";
  displayLabel: string;
  createdAt: string;
  updatedAt: string;
  mood: MoodId;
  energy: EnergyId;
  boundaries: BoundaryLine[];
  hardLimits: string[];
  softLimits: string[];
  safewords: SafewordSet;
  aftercare: AftercareId[];
  aftercareNote: string | null;
  softSignal: SoftSignalAcknowledgment;
  /** Explicit: this declaration alone is not consent. */
  notConsentAlone: true;
  /** Session-specific intent language. */
  forThisMomentOnly: true;
};

export type MutualConsentSnapshot = {
  version: typeof PRE_SESSION_SNAPSHOT_VERSION;
  id: string;
  createdAt: string;
  fingerprint: string;
  partyA: PreSessionDeclaration;
  partyB: PreSessionDeclaration;
  /** Conservative intersection text for display. */
  intersection: {
    welcomed: string[];
    askFirst: string[];
    excluded: string[];
    hardLimitsUnion: string[];
    softLimitsUnion: string[];
    aftercareShared: string[];
    safewords: {
      partyA: SafewordSet;
      partyB: SafewordSet;
    };
    softSignal: {
      eitherPersonMayStopImmediately: true;
      noExplanationRequired: true;
    };
  };
  affirmations: {
    partyAAffirmedAt: string | null;
    partyBAffirmedAt: string | null;
    partyAChecks: AffirmationChecks | null;
    partyBChecks: AffirmationChecks | null;
  };
  sealedAt: string | null;
  withdrawnAt: string | null;
  withdrawnBy: "partyA" | "partyB" | null;
  notConsentUntilSealed: true;
  softSignalAlwaysAvailable: true;
};

export type AffirmationChecks = {
  reviewedBoundaries: true;
  reviewedSafewords: true;
  reviewedAftercare: true;
  affirmedSoftSignal: true;
  thisMomentOnly: true;
  notAGuaranteeOfSafety: true;
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b, "en-US"))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}

export function stableFingerprint(value: unknown): string {
  const text = JSON.stringify(canonical(value));
  let output = "";
  for (let seed = 0; seed < 8; seed++) {
    let hash = (2166136261 ^ seed) >>> 0;
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    output += hash.toString(16).padStart(8, "0");
  }
  return output;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function boundariesFromTouchLanguage(
  doc: TouchLanguageDocument,
): BoundaryLine[] {
  return BODY_ZONES.map((zone) => ({
    zoneId: zone.id,
    label: zone.label,
    status: effectiveZoneStatus(doc, zone.id),
  }));
}

export function createEmptyDeclaration(
  partial?: Partial<PreSessionDeclaration>,
): PreSessionDeclaration {
  const now = new Date().toISOString();
  const base: PreSessionDeclaration = {
    version: 1,
    id: newId("decl"),
    role: "self",
    displayLabel: "You",
    createdAt: now,
    updatedAt: now,
    mood: "grounded",
    energy: "steady",
    boundaries: BODY_ZONES.map((z) => ({
      zoneId: z.id,
      label: z.label,
      status: "off_limits" as const,
    })),
    hardLimits: ["Any surprise touch"],
    softLimits: [],
    safewords: {
      stop: "Soft Signal",
      slow: "Yellow",
      ok: "Green",
    },
    aftercare: ["quiet_side", "check_in_words"],
    aftercareNote: null,
    softSignal: {
      understandsImmediateStop: true,
      understandsNoExplanation: true,
      understandsMutualAvailability: true,
      affirmedAt: now,
    },
    notConsentAlone: true,
    forThisMomentOnly: true,
  };
  return {
    ...base,
    ...partial,
    version: 1,
    notConsentAlone: true,
    forThisMomentOnly: true,
    softSignal: {
      understandsImmediateStop: true,
      understandsNoExplanation: true,
      understandsMutualAvailability: true,
      affirmedAt: now,
      ...partial?.softSignal,
    },
  };
}

export function declarationFromTouchLanguage(
  doc: TouchLanguageDocument,
  displayLabel = "You",
): PreSessionDeclaration {
  return createEmptyDeclaration({
    displayLabel,
    boundaries: boundariesFromTouchLanguage(doc),
    hardLimits:
      doc.hardLimits.length > 0 ? [...doc.hardLimits] : ["Any surprise touch"],
    softLimits: [...doc.softLimits],
    aftercareNote: doc.privateNotes
      ? "Private TL note stays on your device; not auto-copied to snapshot free text."
      : null,
  });
}

/** Practice partner declaration for demo dual-seal (synthetic, labeled). */
export function createPracticePartnerDeclaration(
  name = "Practice partner (Maya)",
): PreSessionDeclaration {
  return createEmptyDeclaration({
    role: "partner_practice",
    displayLabel: name,
    mood: "open",
    energy: "steady",
    boundaries: BODY_ZONES.map((z) => {
      if (z.id === "hands" || z.id === "upper_back")
        return { zoneId: z.id, label: z.label, status: "welcomed" as const };
      if (z.id === "shoulders" || z.id === "arms")
        return { zoneId: z.id, label: z.label, status: "ask_first" as const };
      if (z.id === "face" || z.id === "neck")
        return { zoneId: z.id, label: z.label, status: "off_limits" as const };
      return { zoneId: z.id, label: z.label, status: "soft_limit" as const };
    }),
    hardLimits: ["Face / head contact", "Any surprise touch", "Approach from behind"],
    softLimits: ["Long holds without a check-in", "Fast tempo even when pressure is light"],
    safewords: { stop: "Red", slow: "Yellow", ok: "Green" },
    aftercare: ["quiet_side", "water_space", "check_in_words"],
  });
}

function statusRank(
  s: BoundaryLine["status"],
): number {
  if (s === "off_limits") return 0;
  if (s === "soft_limit") return 1;
  if (s === "ask_first") return 2;
  return 3;
}

function stricter(
  a: BoundaryLine["status"],
  b: BoundaryLine["status"],
): BoundaryLine["status"] {
  return statusRank(a) <= statusRank(b) ? a : b;
}

export function computeIntersection(
  a: PreSessionDeclaration,
  b: PreSessionDeclaration,
): MutualConsentSnapshot["intersection"] {
  const byZoneA = new Map(a.boundaries.map((x) => [String(x.zoneId), x]));
  const byZoneB = new Map(b.boundaries.map((x) => [String(x.zoneId), x]));
  const zoneIds = new Set([...byZoneA.keys(), ...byZoneB.keys()]);

  const welcomed: string[] = [];
  const askFirst: string[] = [];
  const excluded: string[] = [];

  for (const id of zoneIds) {
    const lineA = byZoneA.get(id);
    const lineB = byZoneB.get(id);
    const label = lineA?.label ?? lineB?.label ?? id;
    const statusA = lineA?.status ?? "off_limits";
    const statusB = lineB?.status ?? "off_limits";
    const joint = stricter(statusA, statusB);
    if (joint === "welcomed") welcomed.push(label);
    else if (joint === "ask_first") askFirst.push(label);
    else excluded.push(label);
  }

  const hardLimitsUnion = [
    ...new Set([...a.hardLimits, ...b.hardLimits].map((s) => s.trim()).filter(Boolean)),
  ];
  const softLimitsUnion = [
    ...new Set([...a.softLimits, ...b.softLimits].map((s) => s.trim()).filter(Boolean)),
  ];
  const aftercareShared = a.aftercare.filter((id) => b.aftercare.includes(id));

  return {
    welcomed,
    askFirst,
    excluded,
    hardLimitsUnion,
    softLimitsUnion,
    aftercareShared,
    safewords: { partyA: a.safewords, partyB: b.safewords },
    softSignal: {
      eitherPersonMayStopImmediately: true,
      noExplanationRequired: true,
    },
  };
}

export function createMutualSnapshot(
  partyA: PreSessionDeclaration,
  partyB: PreSessionDeclaration,
): MutualConsentSnapshot {
  const createdAt = new Date().toISOString();
  const intersection = computeIntersection(partyA, partyB);
  const payload = {
    partyA: { ...partyA, notConsentAlone: true as const },
    partyB: { ...partyB, notConsentAlone: true as const },
    intersection,
  };
  return {
    version: 1,
    id: newId("snap"),
    createdAt,
    fingerprint: stableFingerprint(payload),
    partyA,
    partyB,
    intersection,
    affirmations: {
      partyAAffirmedAt: null,
      partyBAffirmedAt: null,
      partyAChecks: null,
      partyBChecks: null,
    },
    sealedAt: null,
    withdrawnAt: null,
    withdrawnBy: null,
    notConsentUntilSealed: true,
    softSignalAlwaysAvailable: true,
  };
}

export function affirmParty(
  snapshot: MutualConsentSnapshot,
  party: "partyA" | "partyB",
  checks: AffirmationChecks,
  at = new Date().toISOString(),
): MutualConsentSnapshot {
  if (snapshot.withdrawnAt) throw new Error("snapshot_withdrawn");
  if (snapshot.sealedAt) throw new Error("snapshot_already_sealed");

  const affirmations = { ...snapshot.affirmations };
  if (party === "partyA") {
    affirmations.partyAAffirmedAt = at;
    affirmations.partyAChecks = checks;
  } else {
    affirmations.partyBAffirmedAt = at;
    affirmations.partyBChecks = checks;
  }

  const both =
    Boolean(affirmations.partyAAffirmedAt) &&
    Boolean(affirmations.partyBAffirmedAt);

  return {
    ...snapshot,
    affirmations,
    sealedAt: both ? at : null,
    notConsentUntilSealed: true,
    softSignalAlwaysAvailable: true,
  };
}

export function withdrawMutualSnapshot(
  snapshot: MutualConsentSnapshot,
  by: "partyA" | "partyB",
  at = new Date().toISOString(),
): MutualConsentSnapshot {
  return {
    ...snapshot,
    affirmations: {
      partyAAffirmedAt: null,
      partyBAffirmedAt: null,
      partyAChecks: null,
      partyBChecks: null,
    },
    sealedAt: null,
    withdrawnAt: at,
    withdrawnBy: by,
    notConsentUntilSealed: true,
    softSignalAlwaysAvailable: true,
  };
}

export function isSealed(snapshot: MutualConsentSnapshot): boolean {
  return Boolean(
    snapshot.sealedAt &&
      snapshot.affirmations.partyAAffirmedAt &&
      snapshot.affirmations.partyBAffirmedAt &&
      !snapshot.withdrawnAt,
  );
}

export function parseDeclaration(raw: unknown): PreSessionDeclaration | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || o.notConsentAlone !== true || o.forThisMomentOnly !== true)
    return null;
  if (!o.softSignal || typeof o.softSignal !== "object") return null;
  const ss = o.softSignal as Record<string, unknown>;
  if (
    ss.understandsImmediateStop !== true ||
    ss.understandsNoExplanation !== true ||
    ss.understandsMutualAvailability !== true
  )
    return null;
  if (!o.safewords || typeof o.safewords !== "object") return null;
  const sw = o.safewords as Record<string, unknown>;
  if (typeof sw.stop !== "string" || !sw.stop.trim()) return null;
  if (typeof sw.slow !== "string" || !sw.slow.trim()) return null;

  const mood = MOOD_OPTIONS.some((m) => m.id === o.mood) ? (o.mood as MoodId) : null;
  const energy = ENERGY_OPTIONS.some((e) => e.id === o.energy)
    ? (o.energy as EnergyId)
    : null;
  if (!mood || !energy) return null;

  const boundaries = Array.isArray(o.boundaries)
    ? (o.boundaries as BoundaryLine[]).filter(
        (b) =>
          b &&
          typeof b.label === "string" &&
          ["welcomed", "ask_first", "soft_limit", "off_limits"].includes(
            b.status,
          ),
      )
    : [];

  const aftercare = Array.isArray(o.aftercare)
    ? (o.aftercare as string[]).filter((id) =>
        AFTERCARE_OPTIONS.some((a) => a.id === id),
      )
    : [];

  return {
    version: 1,
    id: typeof o.id === "string" ? o.id : newId("decl"),
    role:
      o.role === "partner_practice" || o.role === "imported" ? o.role : "self",
    displayLabel:
      typeof o.displayLabel === "string" && o.displayLabel.trim()
        ? o.displayLabel.trim().slice(0, 80)
        : "Participant",
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
    mood,
    energy,
    boundaries,
    hardLimits: Array.isArray(o.hardLimits)
      ? o.hardLimits.filter((x): x is string => typeof x === "string").slice(0, 20)
      : [],
    softLimits: Array.isArray(o.softLimits)
      ? o.softLimits.filter((x): x is string => typeof x === "string").slice(0, 20)
      : [],
    safewords: {
      stop: String(sw.stop).trim().slice(0, 40),
      slow: String(sw.slow).trim().slice(0, 40),
      ok:
        typeof sw.ok === "string" && sw.ok.trim()
          ? sw.ok.trim().slice(0, 40)
          : null,
    },
    aftercare: aftercare as AftercareId[],
    aftercareNote:
      typeof o.aftercareNote === "string"
        ? o.aftercareNote.trim().slice(0, 400) || null
        : null,
    softSignal: {
      understandsImmediateStop: true,
      understandsNoExplanation: true,
      understandsMutualAvailability: true,
      affirmedAt:
        typeof ss.affirmedAt === "string"
          ? ss.affirmedAt
          : new Date().toISOString(),
    },
    notConsentAlone: true,
    forThisMomentOnly: true,
  };
}

export function parseMutualSnapshot(raw: unknown): MutualConsentSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (o.notConsentUntilSealed !== true || o.softSignalAlwaysAvailable !== true)
    return null;
  const partyA = parseDeclaration(o.partyA);
  const partyB = parseDeclaration(o.partyB);
  if (!partyA || !partyB) return null;
  const rebuilt = createMutualSnapshot(partyA, partyB);
  // Preserve ids/fingerprint if present and still match content.
  const fingerprint =
    typeof o.fingerprint === "string" ? o.fingerprint : rebuilt.fingerprint;
  return {
    ...rebuilt,
    id: typeof o.id === "string" ? o.id : rebuilt.id,
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : rebuilt.createdAt,
    fingerprint,
    affirmations: {
      partyAAffirmedAt:
        typeof (o.affirmations as { partyAAffirmedAt?: string } | undefined)
          ?.partyAAffirmedAt === "string"
          ? (o.affirmations as { partyAAffirmedAt: string }).partyAAffirmedAt
          : null,
      partyBAffirmedAt:
        typeof (o.affirmations as { partyBAffirmedAt?: string } | undefined)
          ?.partyBAffirmedAt === "string"
          ? (o.affirmations as { partyBAffirmedAt: string }).partyBAffirmedAt
          : null,
      partyAChecks:
        ((o.affirmations as { partyAChecks?: AffirmationChecks })
          ?.partyAChecks as AffirmationChecks | null) ?? null,
      partyBChecks:
        ((o.affirmations as { partyBChecks?: AffirmationChecks })
          ?.partyBChecks as AffirmationChecks | null) ?? null,
    },
    sealedAt: typeof o.sealedAt === "string" ? o.sealedAt : null,
    withdrawnAt: typeof o.withdrawnAt === "string" ? o.withdrawnAt : null,
    withdrawnBy:
      o.withdrawnBy === "partyA" || o.withdrawnBy === "partyB"
        ? o.withdrawnBy
        : null,
  };
}

export function moodLabel(id: MoodId): string {
  return MOOD_OPTIONS.find((m) => m.id === id)?.label ?? id;
}
export function energyLabel(id: EnergyId): string {
  return ENERGY_OPTIONS.find((e) => e.id === id)?.label ?? id;
}
export function aftercareLabel(id: AftercareId): string {
  return AFTERCARE_OPTIONS.find((a) => a.id === id)?.label ?? id;
}

/** Rows for protective UI + nearby share. */
export function mutualSnapshotRows(
  snap: MutualConsentSnapshot,
): { label: string; value: string }[] {
  const { intersection: i } = snap;
  return [
    {
      label: "Status",
      value: isSealed(snap)
        ? "SEALED — both affirmed this moment"
        : snap.withdrawnAt
          ? "WITHDRAWN — nothing proceeds"
          : "UNSEALED — both must affirm",
    },
    {
      label: "Fingerprint",
      value: snap.fingerprint.slice(0, 16) + "…",
    },
    {
      label: `${snap.partyA.displayLabel} mood / energy`,
      value: `${moodLabel(snap.partyA.mood)} · ${energyLabel(snap.partyA.energy)}`,
    },
    {
      label: `${snap.partyB.displayLabel} mood / energy`,
      value: `${moodLabel(snap.partyB.mood)} · ${energyLabel(snap.partyB.energy)}`,
    },
    {
      label: "Intersection — welcomed",
      value: i.welcomed.join(", ") || "None",
    },
    {
      label: "Intersection — ask each time",
      value: i.askFirst.join(", ") || "None",
    },
    {
      label: "Excluded / off limits",
      value: i.excluded.slice(0, 12).join(", ") + (i.excluded.length > 12 ? "…" : "") || "—",
    },
    {
      label: "Hard limits (either person)",
      value: i.hardLimitsUnion.join(" · ") || "None listed",
    },
    {
      label: "Soft limits (either person)",
      value: i.softLimitsUnion.join(" · ") || "None listed",
    },
    {
      label: `${snap.partyA.displayLabel} safewords`,
      value: `Stop: “${i.safewords.partyA.stop}” · Slow: “${i.safewords.partyA.slow}”${i.safewords.partyA.ok ? ` · OK: “${i.safewords.partyA.ok}”` : ""}`,
    },
    {
      label: `${snap.partyB.displayLabel} safewords`,
      value: `Stop: “${i.safewords.partyB.stop}” · Slow: “${i.safewords.partyB.slow}”${i.safewords.partyB.ok ? ` · OK: “${i.safewords.partyB.ok}”` : ""}`,
    },
    {
      label: "Aftercare overlap",
      value:
        i.aftercareShared
          .map((id) => aftercareLabel(id as AftercareId))
          .join(" · ") ||
        "No shared aftercare selected — discuss verbally",
    },
    {
      label: "Soft Signal",
      value:
        "Either person may end immediately. No explanation. No penalty. Always available.",
    },
    {
      label: "Protective truth",
      value:
        "This seal is for this moment only. It does not prove anyone is safe forever.",
    },
  ];
}
