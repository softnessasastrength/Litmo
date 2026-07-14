/**
 * Pre-session Consent Snapshot — personal declaration + mutual seal.
 *
 * WHAT (module): Pure domain core for prepare-side declarations, intersection,
 * dual-party affirmation, withdraw, fingerprint stability, and parse gates.
 * WHY: Consent grammar must live outside UI so demo screens, vault store, and
 * tests cannot invent divergent seal rules. Fail-closed by construction.
 * CONSENT philosophy bound here:
 *   - prepare ≠ mutual seal ≠ touch authorization
 *   - soft_limit is first-class (not collapsed into off_limits or ask_first)
 *   - unset / missing zone status → off_limits
 *   - Soft Signal always available (typed true on sealed packages)
 *   - dual independent affirm required before sealedAt is set
 *   - withdraw clears seal + both affirmations immediately
 *   - fingerprint is content-stable (canonical sort + multi-seed FNV-1a style)
 *   - maxDurationMinutes takes the stricter (smaller) of both parties
 * NEVER: A sealed snapshot does not prove safety forever, does not grant touch
 * by itself outside an active session path, and does not replace Soft Signal.
 * SEE: docs/CODE_COMMENT_STANDARD.md · CONSENT_MICROINTERACTIONS · Living Constitution
 */

import {
  BODY_ZONES,
  type ZoneId,
} from "../data/touchLanguageCatalog.ts";
import {
  effectiveZoneStatus,
  type TouchLanguageDocument,
} from "./touchLanguageCore.ts";

/**
 * WHAT: Schema version for declaration + mutual snapshot payloads.
 * WHY: Parse gates reject unknown versions fail-closed instead of guessing.
 * CONSENT: Version gate is a consent integrity control — stale/forged shapes must not seal.
 * EDGE CASES: Only `1` is accepted by parseDeclaration / parseMutualSnapshot today.
 * NEVER: Bump without a migration path and ADR; never auto-upgrade untrusted raw JSON.
 * SEE: parseDeclaration, parseMutualSnapshot
 */
export const PRE_SESSION_SNAPSHOT_VERSION = 1 as const;

/**
 * WHAT: Closed catalog of moment-specific mood options for prepare UI + parse.
 * WHY: Free-text mood would be unbounded and hard to share in intersection rows;
 * fixed ids keep declarations comparable and parseable.
 * CONSENT: Mood is capacity honesty, not eligibility for contact. Unsure/low_capacity
 * are first-class and do not block prepare.
 * EDGE CASES: Unknown mood ids fail parse (null mood → reject declaration).
 * NEVER: Do not treat mood as a safety score or matching rank.
 */
export const MOOD_OPTIONS = [
  { id: "grounded", label: "Grounded", detail: "Settled enough to choose freely" },
  { id: "open", label: "Open", detail: "Curious and available" },
  { id: "tender", label: "Tender", detail: "Soft day — slower pace needed" },
  { id: "guarded", label: "Guarded", detail: "Present but careful" },
  { id: "low_capacity", label: "Low capacity", detail: "Brief contact only, or pause" },
  { id: "unsure", label: "Unsure", detail: "May need to stop early — Soft Signal ready" },
] as const;

/**
 * WHAT: Closed catalog of energy / capacity descriptors for prepare + parse.
 * WHY: Pairs with mood for “right now” state without clinical diagnosis language.
 * CONSENT: Energy is self-report for this moment only; not consent and not verification.
 * EDGE CASES: Unknown energy ids fail parse.
 * NEVER: Do not auto-exclude people for “tired” / “recovering”; Soft Signal remains the exit.
 */
export const ENERGY_OPTIONS = [
  { id: "steady", label: "Steady" },
  { id: "low", label: "Low" },
  { id: "high", label: "High / buzzed" },
  { id: "tired", label: "Tired" },
  { id: "recovering", label: "Recovering from a hard day" },
] as const;

/**
 * WHAT: Closed catalog of aftercare preference ids selectable in prepare.
 * WHY: Intersection uses set-overlap of ids; free-text alone cannot compute shared aftercare.
 * CONSENT: Aftercare is post-contact care including after Soft Signal — not a consent grant.
 * EDGE CASES: Unrecognized ids stripped on parse; empty shared set is valid (discuss verbally).
 * NEVER: Do not require aftercare selection to seal; do not auto-message partners.
 */
export const AFTERCARE_OPTIONS = [
  { id: "quiet_side", label: "Quiet side-by-side time" },
  { id: "water_space", label: "Water / space alone first" },
  { id: "check_in_words", label: "Short verbal check-in" },
  { id: "walk", label: "A short walk" },
  { id: "no_debrief", label: "No debrief unless I ask" },
  { id: "text_later", label: "Optional text later (only if both want)" },
  { id: "exit_clean", label: "Clean exit without lingering" },
] as const;

/** WHAT: Mood option id union. NEVER: Not a clinical diagnosis code. */
export type MoodId = (typeof MOOD_OPTIONS)[number]["id"];
/** WHAT: Energy option id union. NEVER: Not a fitness or intoxication test. */
export type EnergyId = (typeof ENERGY_OPTIONS)[number]["id"];
/** WHAT: Aftercare option id union. NEVER: Not a mandatory post-session protocol. */
export type AftercareId = (typeof AFTERCARE_OPTIONS)[number]["id"];

/**
 * WHAT: Speakable session safewords — stop / slow / optional ok.
 * WHY: Words must be unmistakable in the room; Soft Signal remains a full stop
 * even when stop word differs from the product name.
 * CONSENT: Naming words is preparation; speaking stop is withdraw/end authority.
 * EDGE CASES:
 *   - ok may be null (optional all-clear)
 *   - stop and slow are required non-empty strings at parse
 * NEVER: Presence of safewords is not consent to continue; ok is never required to stop.
 */
export type SafewordSet = {
  /** Immediate full stop — maps to Soft Signal spirit. */
  stop: string;
  /** Slow down / check in — not a full stop. */
  slow: string;
  /** Optional all-clear / continue ok. */
  ok: string | null;
};

/**
 * WHAT: One body-zone line in a declaration’s boundary map.
 * WHY: Snapshot intersection needs zone-level status, not only free-text limits.
 * CONSENT: Status is for this moment’s package; match history never upgrades status.
 * EDGE CASES:
 *   - zoneId may be ZoneId or string (imported / practice shapes)
 *   - missing zone at intersection → treated as off_limits (fail-closed)
 * NEVER: welcomed does not mean “touch without asking mid-session”; Soft Signal still wins.
 *
 * status variants (product language):
 *   - welcomed — both may treat as open in the intersection if joint is welcomed
 *   - ask_first — must re-ask; not pre-authorized continuous contact
 *   - soft_limit — first-class extra care; easy Soft Signal; not full exclusion
 *   - off_limits — not included; fail-closed default for unset
 */
export type BoundaryLine = {
  zoneId: ZoneId | string;
  label: string;
  status: "welcomed" | "ask_first" | "soft_limit" | "off_limits";
};

/**
 * WHAT: Soft Signal understanding record required on every declaration.
 * WHY: Constitutional: stop must be understood before mutual seal can mean anything.
 * CONSENT: Affirmation of understanding is not a waiver; it documents equal exit authority.
 * EDGE CASES: All three understanding fields are literal `true` at type + parse — partial false fails.
 * NEVER: This is not permission to continue after Soft Signal; no explanation is ever owed.
 */
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
 * WHAT: One person's pre-session declaration for a specific upcoming encounter.
 * WHY: Separate prepare artifact from mutual seal so one person’s save never becomes “consent.”
 * CONSENT: Explicitly `notConsentAlone` + `forThisMomentOnly`. Not a Consent Snapshot until sealed.
 * EDGE CASES:
 *   - role partner_practice / imported labels demo vs self honestly
 *   - maxDurationMinutes null = no fixed clock (Soft Signal anytime)
 * NEVER: Storing or displaying this alone must never unlock active session as sealed.
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
  /**
   * Optional personal max session length (minutes). Intersection takes the
   * stricter (smaller) value. Soft Signal still ends anytime before this.
   */
  maxDurationMinutes: number | null;
  /** Explicit: this declaration alone is not consent. */
  notConsentAlone: true;
  /** Session-specific intent language. */
  forThisMomentOnly: true;
};

/**
 * WHAT: Dual-party package: both declarations, conservative intersection, affirmations, seal/withdraw.
 * WHY: Single object both UIs and vault can treat as the only mutual truth for this moment.
 * CONSENT: `notConsentUntilSealed` + `softSignalAlwaysAvailable` are permanent product flags.
 * EDGE CASES:
 *   - sealedAt set only when both party affirm timestamps present (see affirmParty)
 *   - withdrawnAt clears seal meaning for isSealed even if timestamps linger in raw JSON
 * NEVER: Seal is not proof of safety forever; fingerprint is integrity aid not legal evidence.
 */
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
    /** Mutual soft limits — extra care, easy Soft Signal (not full exclusion). */
    softLimit: string[];
    excluded: string[];
    hardLimitsUnion: string[];
    softLimitsUnion: string[];
    aftercareShared: string[];
    /** Optional dual-agreed max minutes (strictest of both sides). */
    maxDurationMinutes: number | null;
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

/**
 * WHAT: Required dual-seal check bundle — every field literal true when recorded.
 * WHY: UI must not invent partial “good enough” affirmations that skip Soft Signal or moment-only.
 * CONSENT: Completing checks is intentional yes for this package; withdraw remains free and faster.
 * EDGE CASES: Type forces all true when present; UI may hold booleans until complete then cast.
 * NEVER: Checks are not a guarantee of safety; notAGuaranteeOfSafety must stay true as affirmation of that fact.
 */
export type AffirmationChecks = {
  reviewedBoundaries: true;
  reviewedSafewords: true;
  reviewedAftercare: true;
  affirmedSoftSignal: true;
  thisMomentOnly: true;
  notAGuaranteeOfSafety: true;
};

/**
 * WHAT: Recursively sort object keys and canonicalize arrays so JSON stringify is stable.
 * WHY: Fingerprints must not flip when key insertion order differs across devices/stores.
 * CONSENT: Not a consent surface — integrity primitive for seal package comparison.
 * EDGE CASES:
 *   - arrays preserve element order (list order is product-meaningful for some fields)
 *   - null / primitives returned as-is
 * NEVER: Do not use for UI display; do not strip fields silently (caller chooses payload).
 * SEE: stableFingerprint
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        // Sort keys en-US so locale-stable key order feeds the fingerprint.
        .sort(([a], [b]) => a.localeCompare(b, "en-US"))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}

/**
 * WHAT: Content-stable hex fingerprint of an arbitrary JSON-like value.
 * WHY: Mutual UI and share rows show a short fingerprint so parties can confirm same package;
 * rebuild paths must not invent a new id-only identity for unchanged content.
 * CONSENT: Fingerprint equality aids mutual honesty; it is not consent and not remote proof.
 * EDGE CASES:
 *   - 8 seeds × FNV-1a-style 32-bit → 64 hex chars, collision-resistant enough for local demo integrity
 *   - non-JSON types stringify via JSON.stringify of canonical form
 * NEVER: Never treat fingerprint as cryptographic signature, notarization, or safety score.
 * SEE: createMutualSnapshot payload shape
 */
export function stableFingerprint(value: unknown): string {
  const text = JSON.stringify(canonical(value));
  let output = "";
  // Multiple seeds reduce accidental collision vs single 32-bit hash for local package ids.
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

/**
 * WHAT: Generate a local opaque id with prefix + time + random suffix.
 * WHY: Declarations and snapshots need stable keys for vault history without server mint.
 * CONSENT: Not a consent surface — identifiers only.
 * EDGE CASES: Collision risk is negligible for local demo; not a security nonce.
 * NEVER: Do not use as proof of identity or remote authenticity.
 */
function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * WHAT: Map a Touch Language document into BoundaryLine[] for every catalog zone.
 * WHY: Prepare should start from the user’s saved map rather than blank inventiveness.
 * CONSENT: effectiveZoneStatus already fail-closes unset → off_limits; we preserve that here.
 * EDGE CASES: All BODY_ZONES included even if TL doc never mentioned a zone.
 * NEVER: Does not write TL; does not seal mutual; does not copy privateNotes into free text.
 * SEE: touchLanguageCore.effectiveZoneStatus
 */
export function boundariesFromTouchLanguage(
  doc: TouchLanguageDocument,
): BoundaryLine[] {
  return BODY_ZONES.map((zone) => ({
    zoneId: zone.id,
    label: zone.label,
    // Unset / unknown status resolves fail-closed inside effectiveZoneStatus.
    status: effectiveZoneStatus(doc, zone.id),
  }));
}

/**
 * WHAT: Build a complete PreSessionDeclaration with protective defaults, optional partial overlay.
 * WHY: UI and practice-partner helpers need one fail-closed constructor that always stamps
 * notConsentAlone, forThisMomentOnly, and Soft Signal understanding trues.
 * CONSENT: Default boundaries are all off_limits; surprise touch is a default hard limit.
 * EDGE CASES:
 *   - maxDurationMinutes: null if missing/non-finite; only integer minutes in [5, 180]
 *   - partial cannot clear version flags or Soft Signal understanding literals
 *   - softSignal.affirmedAt defaults to construction time
 * NEVER: Partial merge must never weaken notConsentAlone / forThisMomentOnly to false.
 * SEE: createPracticePartnerDeclaration, declarationFromTouchLanguage
 */
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
    // Fail-closed: every zone starts off_limits until TL or user content says otherwise.
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
    maxDurationMinutes: null,
    notConsentAlone: true,
    forThisMomentOnly: true,
  };
  return {
    ...base,
    ...partial,
    // Always re-force version and constitutional flags after partial spread.
    version: 1,
    maxDurationMinutes: (() => {
      const n = partial?.maxDurationMinutes;
      if (n == null) return null;
      // Non-numbers / NaN / Infinity → no fixed clock (fail-closed away from invented duration).
      if (typeof n !== "number" || !Number.isFinite(n)) return null;
      const m = Math.floor(n);
      // Clamp to deliberate session window; out-of-range → null, not silent clamp to 5/180.
      return m >= 5 && m <= 180 ? m : null;
    })(),
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

/**
 * WHAT: Seed a declaration from a saved Touch Language document.
 * WHY: Prepare should reflect current boundaries/hard/soft limits without manual re-entry.
 * CONSENT: Private TL notes stay on device — aftercareNote only records that a note exists,
 * never copies note body into the snapshot free-text surface.
 * EDGE CASES:
 *   - empty hardLimits → still include “Any surprise touch”
 *   - softLimits copied as list (first-class, not discarded)
 * NEVER: Does not auto-seal; does not share privateNotes contents.
 * SEE: boundariesFromTouchLanguage
 */
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
    // Privacy: never paste private note body into snapshot free text.
    aftercareNote: doc.privateNotes
      ? "Private TL note stays on your device; not auto-copied to snapshot free text."
      : null,
  });
}

/**
 * WHAT: Synthetic practice-partner declaration for single-device dual-seal rehearsal.
 * WHY: Demo path must teach mutual seal without forging a real remote human’s yes.
 * CONSENT: role is `partner_practice` — UI must label demo honestly; never present as remote proof.
 * EDGE CASES: Seeded zones mix welcomed / ask_first / soft_limit / off_limits to exercise intersection.
 * NEVER: Completing practice partner checks on one phone is not two independent people.
 * SEE: consent-snapshot/mutual.tsx demo banner
 */
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
      // Remainder: soft_limit first-class (extra care), not collapsed to off_limits.
      return { zoneId: z.id, label: z.label, status: "soft_limit" as const };
    }),
    hardLimits: ["Face / head contact", "Any surprise touch", "Approach from behind"],
    softLimits: ["Long holds without a check-in", "Fast tempo even when pressure is light"],
    safewords: { stop: "Red", slow: "Yellow", ok: "Green" },
    aftercare: ["quiet_side", "water_space", "check_in_words"],
  });
}

/**
 * WHAT: Numeric rank for boundary status where lower = stricter / more restrictive.
 * WHY: Intersection must pick the more protective joint status without ad-hoc if trees.
 * CONSENT: off_limits wins over soft_limit wins over ask_first wins over welcomed.
 * EDGE CASES: Unknown status falls through to rank 3 (treated like welcomed) — callers must only pass typed statuses.
 * NEVER: Do not invert ranks (would auto-widen consent).
 */
function statusRank(
  s: BoundaryLine["status"],
): number {
  if (s === "off_limits") return 0;
  if (s === "soft_limit") return 1;
  if (s === "ask_first") return 2;
  return 3; // welcomed
}

/**
 * WHAT: Return the stricter of two zone statuses (lower rank wins).
 * WHY: Mutual package must never expand beyond either person’s line.
 * CONSENT: Conservative intersection is the product rule for pre-session maps.
 * EDGE CASES: Equal ranks return a’s status (stable, either is fine).
 * NEVER: Never average or “round up” toward welcomed.
 */
function stricter(
  a: BoundaryLine["status"],
  b: BoundaryLine["status"],
): BoundaryLine["status"] {
  return statusRank(a) <= statusRank(b) ? a : b;
}

/**
 * WHAT: Compute conservative intersection display structure from two declarations.
 * WHY: Mutual UI shows one shared truth: welcomed / ask_first / soft_limit / excluded plus unions.
 * CONSENT: Missing zone on either side → off_limits (fail-closed). soft_limit preserved as first-class.
 * EDGE CASES:
 *   - zone id union covers zones only one party listed
 *   - hard/soft free-text limits are unions (either person can exclude)
 *   - aftercareShared is intersection of ids only
 *   - maxDurationMinutes: null∩null→null; one set→that value; both→Math.min (stricter)
 * NEVER: Do not drop soft_limit into excluded; do not treat welcomed as permanent permission.
 * SEE: createMutualSnapshot, mutualSnapshotRows
 */
export function computeIntersection(
  a: PreSessionDeclaration,
  b: PreSessionDeclaration,
): MutualConsentSnapshot["intersection"] {
  const byZoneA = new Map(a.boundaries.map((x) => [String(x.zoneId), x]));
  const byZoneB = new Map(b.boundaries.map((x) => [String(x.zoneId), x]));
  const zoneIds = new Set([...byZoneA.keys(), ...byZoneB.keys()]);

  const welcomed: string[] = [];
  const askFirst: string[] = [];
  const softLimit: string[] = [];
  const excluded: string[] = [];

  for (const id of zoneIds) {
    const lineA = byZoneA.get(id);
    const lineB = byZoneB.get(id);
    const label = lineA?.label ?? lineB?.label ?? id;
    // Fail-closed: absent line means off_limits, never welcomed by omission.
    // Fail closed: absence on either side is off_limits, never welcomed.
    const statusA = lineA?.status ?? "off_limits";
    const statusB = lineB?.status ?? "off_limits";
    const joint = stricter(statusA, statusB);
    if (joint === "welcomed") welcomed.push(label);
    else if (joint === "ask_first") askFirst.push(label);
    else if (joint === "soft_limit") softLimit.push(label);
    else excluded.push(label);
  }

  // Unions: either person’s hard/soft free-text applies to the shared package.
  const hardLimitsUnion = [
    ...new Set([...a.hardLimits, ...b.hardLimits].map((s) => s.trim()).filter(Boolean)),
  ];
  const softLimitsUnion = [
    ...new Set([...a.softLimits, ...b.softLimits].map((s) => s.trim()).filter(Boolean)),
  ];
  // Shared aftercare only when both selected the same catalog id.
  const aftercareShared = a.aftercare.filter((id) => b.aftercare.includes(id));

  const maxDurationMinutes = (() => {
    const ma = a.maxDurationMinutes;
    const mb = b.maxDurationMinutes;
    if (ma == null && mb == null) return null;
    // One party set a clock → that clock applies until both set (then min).
    if (ma == null) return mb;
    if (mb == null) return ma;
    // Stricter = shorter agreed max; Soft Signal still ends anytime sooner.
    return Math.min(ma, mb);
  })();

  return {
    welcomed,
    askFirst,
    softLimit,
    excluded,
    hardLimitsUnion,
    softLimitsUnion,
    aftercareShared,
    maxDurationMinutes,
    safewords: { partyA: a.safewords, partyB: b.safewords },
    softSignal: {
      eitherPersonMayStopImmediately: true,
      noExplanationRequired: true,
    },
  };
}

/**
 * WHAT: Content fingerprint for two declarations + their fail-closed intersection.
 * WHY: Detect stale mutual packages when prepare edits mid-seal without minting a new snap id.
 * CONSENT: Fingerprint equality is package honesty only — not mutual yes, not safety forever.
 * EDGE CASES:
 *   - forces notConsentAlone true on both parties inside the hash payload
 *   - intersection recomputed every call (never trusts a caller-supplied map)
 * NEVER: Treat match as dual affirm or touch authorization.
 * SEE: createMutualSnapshot, isMutualFingerprintCurrent, CONSENT_EDGE_CASES.fingerprint_stale_mid_seal
 */
export function fingerprintForMutualParties(
  partyA: PreSessionDeclaration,
  partyB: PreSessionDeclaration,
): string {
  const intersection = computeIntersection(partyA, partyB);
  // Same payload shape as createMutualSnapshot so resume/rebuild comparisons stay exact.
  const payload = {
    partyA: { ...partyA, notConsentAlone: true as const },
    partyB: { ...partyB, notConsentAlone: true as const },
    intersection,
  };
  return stableFingerprint(payload);
}

/**
 * WHAT: True when snapshot.fingerprint matches recomputed content from its embedded parties.
 * WHY: Hand-edited vault rows or drifted stored fingerprints must not arm seal (fail closed).
 * CONSENT: Stale package → no seal arm; Soft Signal / withdraw still free.
 * EDGE CASES: Missing fingerprint string → false; content recompute is source of truth.
 * NEVER: true does not mean sealed, mutual remote proof, or session-ready.
 * SEE: fingerprintForMutualParties, mayEnableGrantConfirm.fingerprintCurrent
 */
export function isMutualFingerprintCurrent(
  snapshot: MutualConsentSnapshot,
): boolean {
  if (!snapshot.fingerprint) return false;
  return (
    snapshot.fingerprint ===
    fingerprintForMutualParties(snapshot.partyA, snapshot.partyB)
  );
}

/**
 * WHAT: True when the live self declaration still matches the mutual package content.
 * WHY: Prepare re-save while reviewing must invalidate old fingerprint (Agent 06 residual).
 * CONSENT: Self edit mid-seal → rebuild required; prior checklist yes must not carry over.
 * EDGE CASES:
 *   - partner side taken from snapshot.partyB (practice or real role)
 *   - any field change including updatedAt → new fingerprint → false
 * NEVER: false must not block Soft Signal / withdraw; only blocks seal arm + stale resume.
 * SEE: mutual.tsx focus rebuild, fingerprint_stale_mid_seal edge case
 */
export function isSelfDeclarationCurrentForMutual(
  snapshot: MutualConsentSnapshot,
  selfDecl: PreSessionDeclaration,
): boolean {
  return (
    snapshot.fingerprint ===
    fingerprintForMutualParties(selfDecl, snapshot.partyB)
  );
}

/**
 * WHAT: Create a new unsealed MutualConsentSnapshot from two declarations.
 * WHY: Fingerprint must cover both parties + intersection so later edits rebuild identity.
 * CONSENT: Starts with null affirmations, sealedAt null, notConsentUntilSealed true.
 * EDGE CASES:
 *   - party payloads forced notConsentAlone true inside fingerprint payload
 *   - softSignalAlwaysAvailable always true
 * NEVER: Does not mark either party affirmed; does not authorize touch.
 * SEE: affirmParty, isSealed, fingerprintForMutualParties
 */
/**
 * WHAT: Create unsealed MutualConsentSnapshot with fingerprint + empty affirmations.
 * WHY:  Both parties must still independently affirm before sealedAt is set.
 * CONSENT: notConsentUntilSealed + softSignalAlwaysAvailable forced true.
 * EDGE CASES: Fingerprint covers both parties + intersection payload.
 * NEVER: Sets sealedAt on create; does not activate a session timer.
 */
export function createMutualSnapshot(
  partyA: PreSessionDeclaration,
  partyB: PreSessionDeclaration,
): MutualConsentSnapshot {
  const createdAt = new Date().toISOString();
  const intersection = computeIntersection(partyA, partyB);
  // Fingerprint payload is the consent-relevant content, not runtime seal timestamps.
  return {
    version: 1,
    id: newId("snap"),
    createdAt,
    fingerprint: fingerprintForMutualParties(partyA, partyB),
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

/**
 * WHAT: Record one party’s AffirmationChecks; seal when both have affirmed.
 * WHY: Dual independent affirm is the only path to sealedAt — no single-tap mutual.
 * CONSENT: Prepare ≠ seal; seal still leaves Soft Signal available; notConsentUntilSealed stays true
 * as a permanent product flag on the type even after seal (semantic: seal is moment-specific).
 * EDGE CASES:
 *   - withdrawnAt set → throw snapshot_withdrawn (fail-closed, no re-affirm without new package)
 *   - already sealed → throw snapshot_already_sealed
 *   - one party only → sealedAt remains null
 * NEVER: Do not auto-affirm the other party; do not seal on partial checks (caller supplies complete checks).
 * SEE: withdrawMutualSnapshot, isSealed
 */
export function affirmParty(
  snapshot: MutualConsentSnapshot,
  party: "partyA" | "partyB",
  checks: AffirmationChecks,
  at = new Date().toISOString(),
): MutualConsentSnapshot {
  // Fail-closed: withdrawn packages cannot be re-affirmed in place.
  if (snapshot.withdrawnAt) throw new Error("snapshot_withdrawn");
  // Fail-closed: sealed packages are immutable via affirm (rebuild after withdraw/new prepare).
  if (snapshot.sealedAt) throw new Error("snapshot_already_sealed");

  const affirmations = { ...snapshot.affirmations };
  if (party === "partyA") {
    affirmations.partyAAffirmedAt = at;
    affirmations.partyAChecks = checks;
  } else {
    affirmations.partyBAffirmedAt = at;
    affirmations.partyBChecks = checks;
  }

  // Seal only when both independent timestamps exist — dual affirm required.
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

/**
 * WHAT: Withdraw a mutual snapshot — clear seal, clear both affirmations, stamp who/when.
 * WHY: Withdraw must be faster and freer than sealing; no peer required, no reason field.
 * CONSENT: Clears sealedAt so isSealed becomes false; Soft Signal spirit applies to unsealing package.
 * EDGE CASES:
 *   - works whether previously sealed or only partially affirmed
 *   - does not delete declarations from vault (caller/store owns persistence)
 * NEVER: Do not require the other party’s approval; do not demand explanation.
 * SEE: isSealed, mutual.tsx withdraw path
 */
export function withdrawMutualSnapshot(
  snapshot: MutualConsentSnapshot,
  by: "partyA" | "partyB",
  at = new Date().toISOString(),
): MutualConsentSnapshot {
  return {
    ...snapshot,
    // Dual affirmations wiped — seal cannot residual-survive withdraw.
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

/**
 * WHAT: True only when sealedAt + both affirm timestamps exist and not withdrawn.
 * WHY: Single gate for UI “enter session” and status rows; avoids trusting sealedAt alone.
 * CONSENT: Success means this-moment dual seal only — not safety forever, not ongoing touch license.
 * EDGE CASES:
 *   - withdrawnAt set → false even if sealedAt still present in corrupt raw data
 *   - missing either affirm timestamp → false
 * NEVER: Do not treat isSealed as Soft Signal disablement; Soft Signal always available.
 */
export function isSealed(snapshot: MutualConsentSnapshot): boolean {
  return Boolean(
    snapshot.sealedAt &&
      snapshot.affirmations.partyAAffirmedAt &&
      snapshot.affirmations.partyBAffirmedAt &&
      // Fail-closed: withdraw wins over residual seal fields.
      !snapshot.withdrawnAt,
  );
}

/**
 * WHAT: Fail-closed parse of unknown JSON into PreSessionDeclaration or null.
 * WHY: Vault / import paths must not load half-valid packages that skip Soft Signal flags.
 * CONSENT: Requires version 1, notConsentAlone true, forThisMomentOnly true, all Soft Signal trues,
 * non-empty stop/slow, known mood/energy.
 * EDGE CASES:
 *   - invalid status lines filtered out of boundaries (not invented as welcomed)
 *   - aftercare ids restricted to AFTERCARE_OPTIONS
 *   - string caps: label 80, safewords 40, aftercareNote 400, limits lists 20
 *   - maxDurationMinutes same [5,180] gate as createEmptyDeclaration
 *   - missing id → mint newId (local recovery, not remote identity)
 * NEVER: Never return a declaration that claims to be consent alone; never log private note bodies.
 * SEE: sessionConsentSnapshotStore.saveDeclaration
 */
export function parseDeclaration(raw: unknown): PreSessionDeclaration | null {
  // Fail-closed: non-objects cannot be declarations.
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  // Constitutional flags must be explicit true — omission is not consent-alone denial by accident.
  if (o.version !== 1 || o.notConsentAlone !== true || o.forThisMomentOnly !== true)
    return null;
  if (!o.softSignal || typeof o.softSignal !== "object") return null;
  const ss = o.softSignal as Record<string, unknown>;
  // All three Soft Signal understandings required; partial understanding rejects the package.
  if (
    ss.understandsImmediateStop !== true ||
    ss.understandsNoExplanation !== true ||
    ss.understandsMutualAvailability !== true
  )
    return null;
  if (!o.safewords || typeof o.safewords !== "object") return null;
  const sw = o.safewords as Record<string, unknown>;
  // Stop and slow must be speakable non-empty strings.
  if (typeof sw.stop !== "string" || !sw.stop.trim()) return null;
  if (typeof sw.slow !== "string" || !sw.slow.trim()) return null;

  const mood = MOOD_OPTIONS.some((m) => m.id === o.mood) ? (o.mood as MoodId) : null;
  const energy = ENERGY_OPTIONS.some((e) => e.id === o.energy)
    ? (o.energy as EnergyId)
    : null;
  // Unknown mood/energy → reject (do not default to grounded/steady silently).
  if (!mood || !energy) return null;

  const boundaries = Array.isArray(o.boundaries)
    ? (o.boundaries as BoundaryLine[]).filter(
        (b) =>
          b &&
          typeof b.label === "string" &&
          // soft_limit first-class — keep it; unknown status dropped.
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
    maxDurationMinutes: (() => {
      if (o.maxDurationMinutes == null) return null;
      const n = Number(o.maxDurationMinutes);
      if (!Number.isFinite(n)) return null;
      const m = Math.floor(n);
      return m >= 5 && m <= 180 ? m : null;
    })(),
    notConsentAlone: true,
    forThisMomentOnly: true,
  };
}

/**
 * WHAT: Fail-closed parse of mutual snapshot raw JSON into MutualConsentSnapshot or null.
 * WHY: Vault load must re-validate parties and recompute intersection via createMutualSnapshot.
 * CONSENT: Requires version 1, notConsentUntilSealed true, softSignalAlwaysAvailable true.
 * EDGE CASES:
 *   - either party fails parseDeclaration → null entire mutual
 *   - intersection always rebuilt from parties (not trusted from raw)
 *   - seal/withdraw/affirm restored only when stored fingerprint matches content
 *   - stale fingerprint → content fingerprint kept; affirmations + sealedAt cleared
 * NEVER: Do not trust raw intersection arrays; do not invent seal from single affirm;
 *        do not keep sealedAt on a hand-edited fingerprint (Agent 06 / fingerprint_stale_mid_seal).
 * SEE: createMutualSnapshot, fingerprintForMutualParties, parseDeclaration
 */
/**
 * WHAT: Parse mutual snapshot JSON; rebuild intersection via createMutualSnapshot.
 * WHY:  Stored packages must re-validate constitutional flags and parties.
 * CONSENT: Requires notConsentUntilSealed + softSignalAlwaysAvailable true.
 * EDGE CASES: Affirmations/seal preserved only when fingerprint matches content; else wipe.
 * NEVER: Trusts client intersection without recompute from parties (rebuild path).
 */
export function parseMutualSnapshot(raw: unknown): MutualConsentSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  // Permanent product flags must remain true on any loadable mutual package.
  if (o.notConsentUntilSealed !== true || o.softSignalAlwaysAvailable !== true)
    return null;
  const partyA = parseDeclaration(o.partyA);
  const partyB = parseDeclaration(o.partyB);
  // Fail-closed: both parties must fully parse.
  if (!partyA || !partyB) return null;
  // Rebuild intersection + base shape from validated parties (ignore raw intersection).
  const rebuilt = createMutualSnapshot(partyA, partyB);
  // Content fingerprint is always authoritative — never keep a divergent stored hash.
  const contentFingerprint = rebuilt.fingerprint;
  const storedFingerprint =
    typeof o.fingerprint === "string" ? o.fingerprint : contentFingerprint;
  // Stale/hand-edited fingerprint → wipe seal + affirmations (fail closed mid-seal integrity).
  const fingerprintCurrent = storedFingerprint === contentFingerprint;

  const emptyAffirmations = {
    partyAAffirmedAt: null as string | null,
    partyBAffirmedAt: null as string | null,
    partyAChecks: null as AffirmationChecks | null,
    partyBChecks: null as AffirmationChecks | null,
  };

  return {
    ...rebuilt,
    id: typeof o.id === "string" ? o.id : rebuilt.id,
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : rebuilt.createdAt,
    // Always content-true so UI fingerprintCurrent and seal math agree.
    fingerprint: contentFingerprint,
    affirmations: fingerprintCurrent
      ? {
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
        }
      : emptyAffirmations,
    // Fail-closed: never restore sealedAt when package identity drifted.
    sealedAt:
      fingerprintCurrent && typeof o.sealedAt === "string" ? o.sealedAt : null,
    withdrawnAt: typeof o.withdrawnAt === "string" ? o.withdrawnAt : null,
    withdrawnBy:
      o.withdrawnBy === "partyA" || o.withdrawnBy === "partyB"
        ? o.withdrawnBy
        : null,
  };
}

/**
 * WHAT: Resolve MoodId to human label for display rows.
 * WHY: Avoid leaking raw ids into protective UI copy.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: Unknown id falls back to id string.
 * NEVER: Do not use label for parse identity.
 */
export function moodLabel(id: MoodId): string {
  return MOOD_OPTIONS.find((m) => m.id === id)?.label ?? id;
}

/**
 * WHAT: Resolve EnergyId to human label for display rows.
 * WHY: Presentation-only mirror of moodLabel.
 * CONSENT: Not a consent surface.
 * EDGE CASES: Unknown id falls back to id string.
 * NEVER: Do not rank people by energy label.
 */
export function energyLabel(id: EnergyId): string {
  return ENERGY_OPTIONS.find((e) => e.id === id)?.label ?? id;
}

/**
 * WHAT: Resolve AftercareId to human label for display rows.
 * WHY: Intersection aftercareShared stores ids; rows need readable text.
 * CONSENT: Not a consent surface.
 * EDGE CASES: Unknown id falls back to id string.
 * NEVER: Do not imply aftercare was completed.
 */
export function aftercareLabel(id: AftercareId): string {
  return AFTERCARE_OPTIONS.find((a) => a.id === id)?.label ?? id;
}

/**
 * WHAT: Build plain-language label/value rows for mutual snapshot UI and nearby share.
 * WHY: Single source of protective copy for seal status, intersection, safewords, Soft Signal truth.
 * CONSENT: Status row distinguishes SEALED / WITHDRAWN / UNSEALED; Soft Signal always stated available.
 * EDGE CASES:
 *   - empty welcomed/askFirst/softLimit → “None”
 *   - excluded truncated to 12 labels for readability
 *   - softLimit uses ?? [] for older snapshots missing field
 *   - maxDurationMinutes null → “No fixed clock — Soft Signal anytime”
 * NEVER: Do not claim seal proves lifelong safety; protective truth row restates that.
 * SEE: isSealed, computeIntersection
 */
export function mutualSnapshotRows(
  snap: MutualConsentSnapshot,
): { label: string; value: string }[] {
  const { intersection: i } = snap;
  return [
    {
      label: "Status",
      // Order: sealed only if isSealed; else withdrawn if stamped; else unsealed.
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
      label: "Together we can (welcomed)",
      value: i.welcomed.join(", ") || "None",
    },
    {
      label: "Ask each time",
      value: i.askFirst.join(", ") || "None",
    },
    {
      label: "Soft limit (extra care)",
      // soft_limit first-class row — never hide as “not included”.
      value: (i.softLimit ?? []).join(", ") || "None",
    },
    {
      label: "Not included / off limits",
      value: i.excluded.slice(0, 12).join(", ") + (i.excluded.length > 12 ? "…" : "") || "—",
    },
    {
      label: "Agreed time boundary",
      value: i.maxDurationMinutes
        ? `Up to ${i.maxDurationMinutes} minutes (Soft Signal anytime sooner)`
        : "No fixed clock — Soft Signal anytime",
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
