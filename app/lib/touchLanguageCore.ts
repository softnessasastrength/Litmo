/**
 * Full Touch Language document model.
 *
 * Touch Language is a preference map for conversation and discovery shape —
 * never a grant of session consent, never a match-as-permission, never a
 * substitute for a session-specific Consent Snapshot.
 *
 * Product philosophy:
 * - TL profile ≠ consent (notConsentToTouch is always true and non-overridable)
 * - soft_limit is first-class (zone status + free-text softLimits)
 * - hard limits always win over zone status (Living Constitution I.6)
 * - privateNotes never leave the device in share payloads
 * - unset zones fail closed as off_limits in effectiveZoneStatus
 *
 * SEE: docs/LITMO_CONSTITUTION.md · docs/CODE_COMMENT_STANDARD.md ·
 *      app/data/touchLanguageCatalog.ts
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

/**
 * WHAT: Schema version constant for Touch Language documents.
 * WHY: Migrations and parsers gate on exact version; unknown versions fail closed.
 * CONSENT: Versioning protects stale preference maps from being treated as current consent-adjacent data.
 * EDGE CASES: Future v2 must add an explicit migrator — do not silently accept.
 * NEVER: Do not bump without a migration path for local storage.
 */
export const TOUCH_LANGUAGE_DOC_VERSION = 1 as const;

/**
 * WHAT: Per-zone preference: boundary status plus optional preferred pressure.
 * WHY: Zones are the atomic unit of body-map conversation; pressure is meaningless when off_limits.
 * CONSENT: Status is preference language only — never session authorization.
 * NEVER: A welcomed zone is not permission to touch that zone in a session.
 */
export type ZonePreference = {
  status: BoundaryStatusId;
  /** Preferred pressure when status allows contact; null if off_limits. */
  pressure: PressureId | null;
};

/**
 * WHAT: Canonical on-device Touch Language document.
 * WHY: Single structured source for onboarding, discovery shape, and share review.
 * CONSENT: notConsentToTouch and shareIsReviewOnly are always true — document is never consent.
 * NEVER: Treat hardLimits/softLimits or zones as a sealed Consent Snapshot.
 */
export type TouchLanguageDocument = {
  version: typeof TOUCH_LANGUAGE_DOC_VERSION;
  updatedAt: string;
  /** Human-readable display name for shares (optional). Not legal identity. */
  displayLabel: string | null;
  pressure: PressureId;
  speed: SpeedId;
  duration: DurationId;
  environments: EnvironmentId[];
  holdTypes: HoldTypeId[];
  zones: Partial<Record<ZoneId, ZonePreference>>;
  /** Absolute nos — win over zone status (Living Constitution I.6). */
  hardLimits: string[];
  /**
   * Soft limits — usually avoid; need extra care and easy Soft Signal.
   * First-class product concept, not a weaker off_limits.
   */
  softLimits: string[];
  /** Device-private free text; stripped from share by default. Never wire. */
  privateNotes: string | null;
  /** Always true — profile is never consent. Non-overridable at create/parse. */
  notConsentToTouch: true;
  /** Always true — sharing is review-only unless both open Consent Snapshot later. */
  shareIsReviewOnly: true;
};

/**
 * WHAT: Wire/share envelope for reviewing a peer's TL document.
 * WHY: Explicit flags force clients to treat accept-share as review, not activation.
 * CONSENT: Accepting a share is not consent to touch, not a match, not session start.
 * NEVER: privateNotes must be null on the wire; never re-inject from local store into share.
 */
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

/**
 * WHAT: Completeness metrics for onboarding progress UI.
 * WHY: Minimal completeness is a conversation-readiness aid, not eligibility for contact.
 * CONSENT: isMinimallyComplete never authorizes touch or snapshot seal.
 * NEVER: Incomplete docs must not be treated as "unsafe people"; complete docs are not "safe people."
 */
export type CompletenessReport = {
  zonesNamed: number;
  zonesTotal: number;
  hasEnvironments: boolean;
  hasHoldTypes: boolean;
  hardLimitCount: number;
  softLimitCount: number;
  isMinimallyComplete: boolean;
};

/**
 * WHAT: Returns an empty partial zone map.
 * WHY: Default document starts with no named zones so unset → off_limits is explicit later.
 * CONSENT: Empty zones are not "open to everything"; effective status fails closed.
 * EDGE CASES: none — pure factory of {}.
 * NEVER: Do not treat empty zones as welcomed.
 * SEE: effectiveZoneStatus
 */
export function emptyZones(): Partial<Record<ZoneId, ZonePreference>> {
  return {};
}

/**
 * WHAT: Builds a default Touch Language document with conservative baseline prefs.
 * WHY: Onboarding and migration need a safe starting map without inventing openness.
 * CONSENT: Always forces notConsentToTouch and shareIsReviewOnly true after partial merge.
 * EDGE CASES:
 *   - partial tries to override safety flags → re-forced true (non-overridable)
 *   - partial omits hardLimits → default includes "Any surprise touch"
 *   - empty zones → effectiveZoneStatus will treat each as off_limits
 * NEVER: Callers must not infer that defaults grant contact or that medium pressure is agreed.
 * SEE: docs/LITMO_CONSTITUTION.md (I.6 hard limits win)
 */
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
    // Conservative default: surprise touch is always a hard no in product language.
    hardLimits: ["Any surprise touch"],
    softLimits: [],
    privateNotes: null,
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
  return {
    ...base,
    ...partial,
    // Safety flags and version are never overridable by partial or callers.
    version: TOUCH_LANGUAGE_DOC_VERSION,
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

/**
 * WHAT: Type guard for catalog pressure ids.
 * WHY: Parse paths fail closed on unknown enum-like strings from storage/network.
 * CONSENT: Not a consent surface — validates preference vocabulary only.
 * EDGE CASES: non-string / unknown id → false
 * NEVER: true does not mean pressure was mutually agreed for a session.
 */
export function isPressureId(value: unknown): value is PressureId {
  return PRESSURE_OPTIONS.some((o) => o.id === value);
}

/**
 * WHAT: Type guard for catalog speed ids.
 * WHY: Fail-closed validation for persisted/shared documents.
 * CONSENT: Not a consent surface — vocabulary only.
 * EDGE CASES: unknown → false
 * NEVER: Validation success ≠ session authorization.
 */
export function isSpeedId(value: unknown): value is SpeedId {
  return SPEED_OPTIONS.some((o) => o.id === value);
}

/**
 * WHAT: Type guard for catalog duration ids.
 * WHY: Fail-closed validation for persisted/shared documents.
 * CONSENT: Not a consent surface — vocabulary only.
 * EDGE CASES: unknown → false
 * NEVER: Validation success ≠ agreed session length.
 */
export function isDurationId(value: unknown): value is DurationId {
  return DURATION_OPTIONS.some((o) => o.id === value);
}

/**
 * WHAT: Type guard for catalog environment ids.
 * WHY: Fail-closed validation for persisted/shared documents.
 * CONSENT: Not a consent surface — vocabulary only.
 * EDGE CASES: unknown → false
 * NEVER: Hosted community preference is not venue verification or safety proof.
 */
export function isEnvironmentId(value: unknown): value is EnvironmentId {
  return ENVIRONMENT_OPTIONS.some((o) => o.id === value);
}

/**
 * WHAT: Type guard for catalog hold-type ids.
 * WHY: Fail-closed validation for persisted/shared documents.
 * CONSENT: Not a consent surface — vocabulary only.
 * EDGE CASES: unknown → false
 * NEVER: Listed hold type is not an invitation to perform that hold.
 */
export function isHoldTypeId(value: unknown): value is HoldTypeId {
  return HOLD_TYPE_OPTIONS.some((o) => o.id === value);
}

/**
 * WHAT: Type guard for catalog body zone ids.
 * WHY: Fail-closed validation so unknown keys never become zones.
 * CONSENT: Not a consent surface — vocabulary only.
 * EDGE CASES: unknown → false
 * NEVER: Valid zone id ≠ permission for that zone.
 */
export function isZoneId(value: unknown): value is ZoneId {
  return BODY_ZONES.some((z) => z.id === value);
}

/**
 * WHAT: Type guard for boundary status ids (welcomed / ask_first / soft_limit / off_limits).
 * WHY: soft_limit is first-class; unknown statuses must not coerce to welcomed.
 * CONSENT: Status language is preference only — never session seal.
 * EDGE CASES: unknown → false (caller must skip zone, not invent welcomed)
 * NEVER: soft_limit is not "almost welcomed"; off_limits is absolute for effective status when hard-limit aliases apply.
 */
export function isBoundaryStatusId(value: unknown): value is BoundaryStatusId {
  return BOUNDARY_STATUS_OPTIONS.some((s) => s.id === value);
}

/**
 * WHAT: Sanitizes free-text hard/soft limit lists from untrusted input.
 * WHY: Storage/network can send non-arrays, long strings, or duplicates.
 * CONSENT: Cleaning lists does not change consent state; hard limits still win later.
 * EDGE CASES:
 *   - non-array → []
 *   - non-string items skipped
 *   - trim + max 120 chars per item; dedupe; cap at max items
 * NEVER: Log raw limit text to analytics; never treat empty list as "no boundaries."
 */
function cleanStringList(input: unknown, max: number): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    // Skip non-strings — fail closed rather than String()-coercing objects.
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, 120);
    // Empty and duplicate entries add noise without product meaning.
    if (!t || out.includes(t)) continue;
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * WHAT: Parses unknown storage/network JSON into a TouchLanguageDocument or null.
 * WHY: Fail-closed ingress — corrupt or partial data must not become a "valid" open map.
 * CONSENT: Always stamps notConsentToTouch and shareIsReviewOnly true regardless of input flags.
 * EDGE CASES:
 *   - non-object / wrong version → null
 *   - invalid pressure/speed/duration → null
 *   - empty environments after filter → null (at least one environment required)
 *   - zone with invalid status skipped (not defaulted to welcomed)
 *   - off_limits zone forces pressure null
 *   - invalid zone pressure falls back to doc pressure then "medium"
 *   - privateNotes truncated to 1000 chars; empty → null
 * NEVER: Parse success is not consent; never trust client-sent notConsentToTouch:false.
 * SEE: createDefaultTouchLanguage · effectiveZoneStatus
 */
export function parseTouchLanguageDocument(
  raw: unknown,
): TouchLanguageDocument | null {
  // Fail closed: missing or non-object payload cannot be a preference map.
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  // Unknown versions have no migrator yet — refuse rather than partial-read.
  if (o.version !== 1) return null;
  if (!isPressureId(o.pressure)) return null;
  if (!isSpeedId(o.speed)) return null;
  if (!isDurationId(o.duration)) return null;

  const environments = Array.isArray(o.environments)
    ? o.environments.filter(isEnvironmentId).slice(0, 8)
    : [];
  // At least one environment is required so "no place named" cannot pass as complete map.
  if (environments.length === 0) return null;

  const holdTypes = Array.isArray(o.holdTypes)
    ? o.holdTypes.filter(isHoldTypeId).slice(0, 20)
    : [];

  const zones: Partial<Record<ZoneId, ZonePreference>> = {};
  if (o.zones && typeof o.zones === "object") {
    for (const [key, value] of Object.entries(
      o.zones as Record<string, unknown>,
    )) {
      // Unknown zone keys or non-objects are skipped — never invent welcomed.
      if (!isZoneId(key) || !value || typeof value !== "object") continue;
      const z = value as Record<string, unknown>;
      // Invalid status: skip zone rather than coerce to a more open state.
      if (!isBoundaryStatusId(z.status)) continue;
      let pressure: PressureId | null = null;
      if (z.status === "off_limits") {
        // Off-limits zones must not carry a preferred pressure (would imply contact shape).
        pressure = null;
      } else if (isPressureId(z.pressure)) {
        pressure = z.pressure;
      } else {
        // Prefer document-level pressure over inventing firm/light arbitrarily.
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
    // Re-stamp invariants: wire/storage cannot claim this document is consent.
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

/**
 * WHAT: Computes how complete a TL document is for onboarding progress.
 * WHY: UI needs a non-shaming readiness signal without inventing eligibility scores.
 * CONSENT: Completeness is conversation-prep only — never consent or safety grade.
 * EDGE CASES:
 *   - zonesNamed counts only named map keys; unset zones are not "welcomed"
 *   - isMinimallyComplete requires envs, holds, ≥3 zones, pressure/speed/duration
 * NEVER: isMinimallyComplete must not gate Soft Signal or justify pressure to finish.
 * SEE: CompletenessReport
 */
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
  // Minimum is for "enough to talk from," not enough to touch.
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
 * WHAT: Structured aliases mapping free-text hard-limit words to body zone ids.
 * WHY: Hard limits always win; free text must force zones off_limits without NLP magic.
 * CONSENT: Alias hits force off_limits in effectiveZoneStatus — preference language becomes hard no.
 * EDGE CASES:
 *   - "surprise" → empty zone list (global soft rule in UI copy, not zone-wide wipe)
 *   - multi-zone aliases (e.g. head → face + head_scalp)
 * NEVER: Absence of alias is not permission; do not auto-expand aliases to all zones.
 * SEE: hardLimitForcesZoneOffLimits · Living Constitution I.6
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
  // Global product language — not a zone-wide wipe of the body map.
  surprise: [],
};

/**
 * WHAT: Returns whether a free-text hard limit forces a specific zone off_limits.
 * WHY: Living Constitution — hard limits always win over zone status labels.
 * CONSENT: True means that zone must be treated as off_limits for effective status.
 * EDGE CASES:
 *   - empty hard limit after trim → false
 *   - explicit "zone:{id}" or bare id match → true
 *   - alias substring match when zone in alias list → true
 *   - phrase contains full zone label → true
 *   - first-word-of-label matching intentionally skipped (too loose, false opens)
 * NEVER: false does not mean touch is welcomed; only that this hard-limit string did not force the zone.
 * SEE: effectiveZoneStatus · HARD_LIMIT_ZONE_ALIASES
 */
export function hardLimitForcesZoneOffLimits(
  hardLimit: string,
  zoneId: ZoneId,
): boolean {
  const h = hardLimit.toLowerCase().trim();
  if (!h) return false;
  // Explicit zone id tokens: "zone:face" or bare id match — deterministic, not fuzzy NLP.
  if (h === zoneId || h === `zone:${zoneId}` || h.includes(`zone:${zoneId}`)) {
    return true;
  }
  const zoneMeta = BODY_ZONES.find((z) => z.id === zoneId);
  const label = (zoneMeta?.label ?? "").toLowerCase();
  for (const [alias, zones] of Object.entries(HARD_LIMIT_ZONE_ALIASES)) {
    if (!h.includes(alias)) continue;
    // Empty alias lists (e.g. surprise) never force a specific zone here.
    if (zones.includes(zoneId)) return true;
  }
  // Phrase contains full zone label (e.g. "upper back") — still fail-closed for that zone.
  if (label && h.includes(label.toLowerCase())) return true;
  // First word of label (e.g. "Upper" from "Upper back") is too loose — skip.
  return false;
}

/**
 * WHAT: Resolves the effective boundary status for a zone after hard-limit win rules.
 * WHY: Callers must not trust raw zone.status when hardLimits contradict it.
 * CONSENT: Unset zone → off_limits (fail closed). Hard limits force off_limits over welcomed/soft_limit/ask_first.
 * EDGE CASES:
 *   - missing zone entry → off_limits
 *   - any matching hard limit → off_limits regardless of stored status
 *   - soft_limit status preserved only when no hard limit forces off
 * NEVER: effective status is still preference language — not session consent for that zone.
 * SEE: hardLimitForcesZoneOffLimits · Living Constitution I.6
 */
export function effectiveZoneStatus(
  doc: TouchLanguageDocument,
  zoneId: ZoneId,
): BoundaryStatusId {
  const zone = doc.zones[zoneId];
  // Fail closed: unnamed zones are off_limits, not open by omission.
  if (!zone) return "off_limits";
  // Hard limits win — structured aliases + explicit zone:id tokens.
  for (const hard of doc.hardLimits) {
    if (hardLimitForcesZoneOffLimits(hard, zoneId)) {
      return "off_limits";
    }
  }
  return zone.status;
}

/**
 * WHAT: Immutably sets one zone's status and pressure on a TL document.
 * WHY: Onboarding/body-map UI needs pure updates that re-stamp consent invariants.
 * CONSENT: Re-forces notConsentToTouch and shareIsReviewOnly; prepare-only preference edit.
 * EDGE CASES:
 *   - off_limits → pressure forced null
 *   - non-off_limits without pressure arg → prior zone pressure, else doc pressure
 * NEVER: Setting welcomed does not authorize touch of that zone.
 * SEE: setAllUnsetZones
 */
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
    // Preference mutation never becomes a consent claim.
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

/**
 * WHAT: Applies a status to every catalog zone that is still unset.
 * WHY: Bulk "set remaining as off_limits / ask_first" without overwriting named zones.
 * CONSENT: Prepare-only; re-stamped via setZone.
 * EDGE CASES: zones already present are left unchanged (named preferences win).
 * NEVER: Bulk welcomed must not be sold as "everything is open for sessions."
 * SEE: setZone · emptyZones
 */
export function setAllUnsetZones(
  doc: TouchLanguageDocument,
  status: BoundaryStatusId,
): TouchLanguageDocument {
  let next = doc;
  for (const zone of BODY_ZONES) {
    // Only fill gaps — never clobber an explicit zone choice.
    if (!next.zones[zone.id]) {
      next = setZone(next, zone.id, status);
    }
  }
  return next;
}

/**
 * WHAT: Toggles a free-text item in a hard/soft limit list with caps.
 * WHY: UI chips and free-text adds need pure list mutation without duplicates.
 * CONSENT: Not a consent surface by itself; list feeds hardLimitForcesZoneOffLimits later.
 * EDGE CASES:
 *   - empty after trim → unchanged list
 *   - already present → remove (toggle off)
 *   - at max length → refuse add (do not drop others silently)
 * NEVER: Removing a hard limit from the list is not retroactive session consent.
 */
export function toggleListItem(
  list: string[],
  item: string,
  max = 20,
): string[] {
  const t = item.trim().slice(0, 120);
  if (!t) return list;
  if (list.includes(t)) return list.filter((x) => x !== t);
  // Cap prevents unbounded private preference blobs on device.
  if (list.length >= max) return list;
  return [...list, t];
}

/**
 * WHAT: Toggles a hold type on the document.
 * WHY: Multi-select hold language without allowing unbounded arrays.
 * CONSENT: Hold types are preference language; re-stamps notConsentToTouch.
 * EDGE CASES: remove if present; add capped at 20; empty holdTypes allowed here (completeness may flag).
 * NEVER: Selected hold ≠ invitation to that hold in a session.
 */
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

/**
 * WHAT: Toggles an environment preference on the document.
 * WHY: Multi-select environments with a fail-closed floor of one environment.
 * CONSENT: Environment prefs are not venue safety proof; re-stamps notConsentToTouch.
 * EDGE CASES:
 *   - removing last environment → reset to hosted_community (never empty list)
 *   - cap at 8 environments
 * NEVER: hosted_community preference is not host verification or safety certificate.
 */
export function toggleEnvironment(
  doc: TouchLanguageDocument,
  envId: EnvironmentId,
): TouchLanguageDocument {
  const has = doc.environments.includes(envId);
  let environments = has
    ? doc.environments.filter((e) => e !== envId)
    : [...doc.environments, envId];
  // Never leave zero environments — empty would break parse and imply "anywhere."
  if (environments.length === 0) environments = ["hosted_community"];
  return {
    ...doc,
    environments: environments.slice(0, 8),
    updatedAt: new Date().toISOString(),
    notConsentToTouch: true,
    shareIsReviewOnly: true,
  };
}

/**
 * WHAT: Builds a share payload with privateNotes stripped and consent flags forced.
 * WHY: Sharing must be review-only; private nervous-system text must never leave the device.
 * CONSENT: requiresExplicitAccept, notConsentToTouch, notSessionActivation all true.
 * EDGE CASES: privateNotes always null on wire even if local doc has notes.
 * NEVER: Accept-share must not auto-open session, seal snapshot, or imply touch permission.
 * SEE: parseSharePayload · TouchLanguageSharePayload
 */
export function buildSharePayload(
  doc: TouchLanguageDocument,
): TouchLanguageSharePayload {
  // Destructure away privateNotes so they cannot accidentally spread onto the wire.
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

/**
 * WHAT: Parses an untrusted share payload; fails closed if safety flags are missing.
 * WHY: Malicious or legacy shares must not drop notConsent / notSessionActivation.
 * CONSENT: Requires notConsentToTouch, notSessionActivation, requiresExplicitAccept all true.
 * EDGE CASES:
 *   - wrong kind/v → null
 *   - any safety flag not strictly true → null
 *   - invalid nested document → null
 *   - privateNotes forced null even if present in raw document
 * NEVER: Parse success is not mutual consent; never rehydrate privateNotes from share.
 * SEE: buildSharePayload · parseTouchLanguageDocument
 */
export function parseSharePayload(
  raw: unknown,
): TouchLanguageSharePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "touch_language_share" || o.v !== 1) return null;
  // Fail closed: share must self-declare it is not consent and not activation.
  if (o.notConsentToTouch !== true || o.notSessionActivation !== true)
    return null;
  if (o.requiresExplicitAccept !== true) return null;
  const document = parseTouchLanguageDocument(o.document);
  if (!document) return null;
  return {
    kind: "touch_language_share",
    v: 1,
    // Defense in depth: strip notes again after nested parse.
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

/**
 * WHAT: Human label for a pressure id from the catalog.
 * WHY: Display-only mapping for summaries and UI.
 * CONSENT: Not a consent surface — formats labels only.
 * EDGE CASES: missing catalog entry falls back to raw id string.
 * NEVER: Label is not an agreed session pressure.
 */
export function labelForPressure(id: PressureId): string {
  return PRESSURE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/**
 * WHAT: Human label for a speed id from the catalog.
 * WHY: Display-only mapping for summaries and UI.
 * CONSENT: Not a consent surface — formats labels only.
 * EDGE CASES: missing catalog entry falls back to raw id.
 * NEVER: Label is not session pacing consent.
 */
export function labelForSpeed(id: SpeedId): string {
  return SPEED_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/**
 * WHAT: Human label for a duration id from the catalog.
 * WHY: Display-only mapping for summaries and UI.
 * CONSENT: Not a consent surface — formats labels only.
 * EDGE CASES: missing catalog entry falls back to raw id.
 * NEVER: Label is not an agreed timer boundary.
 */
export function labelForDuration(id: DurationId): string {
  return DURATION_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/**
 * WHAT: Human label for a zone id from the catalog.
 * WHY: Display-only mapping for summaries and UI.
 * CONSENT: Not a consent surface — formats labels only.
 * EDGE CASES: missing catalog entry falls back to raw id.
 * NEVER: Label is not zone authorization.
 */
export function labelForZone(id: ZoneId): string {
  return BODY_ZONES.find((z) => z.id === id)?.label ?? id;
}

/**
 * WHAT: Human label for a boundary status id from the catalog.
 * WHY: Display-only mapping; soft_limit must remain visible as first-class language.
 * CONSENT: Not a consent surface — formats labels only.
 * EDGE CASES: missing catalog entry falls back to raw id.
 * NEVER: "Welcomed" label is not permission to touch.
 */
export function labelForStatus(id: BoundaryStatusId): string {
  return BOUNDARY_STATUS_OPTIONS.find((s) => s.id === id)?.label ?? id;
}

/**
 * WHAT: Builds display strings for a TL document using effective zone status.
 * WHY: Summaries must apply hard-limit win rules so UI never shows welcomed over hard no.
 * CONSENT: Output is conversation chrome only — never a grant list for a session.
 * EDGE CASES:
 *   - empty category lists → "None named" / hard zones "All unset count as off limits"
 *   - soft_limit zones listed separately from hard/off_limits (first-class)
 *   - privateNotes intentionally omitted from summary object
 * NEVER: Include privateNotes in any returned field; never present summary as safety score.
 * SEE: effectiveZoneStatus · soft_limit first-class
 */
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
    // Use effective status so hard limits override raw zone map for display truth.
    const status = effectiveZoneStatus(doc, zone.id);
    if (status === "welcomed") welcomed.push(zone.label);
    else if (status === "ask_first") askFirst.push(zone.label);
    else if (status === "soft_limit") softLimitZones.push(zone.label);
    // off_limits + unset (already coerced) land in hardZones for honest summary.
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

/**
 * WHAT: Migrates legacy demo touchChoices + bodyBoundaries into a v1 document.
 * WHY: Older demo storage used free labels and partial zone maps; need one path forward.
 * CONSENT: Output is createDefaultTouchLanguage-based — still never consent.
 * EDGE CASES:
 *   - unknown legacy labels fall back to medium / decide_together / hosted_community
 *   - soft_limit preserved in statusMap (first-class, not collapsed to ask_first)
 *   - unknown legacy zone keys skipped
 *   - hardStops → hardLimits; boundaryNote → privateNotes (device-local)
 * NEVER: Migration success is not a new consent event; do not broadcast privateNotes.
 * SEE: createDefaultTouchLanguage · setZone
 */
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

  // Unknown labels fail soft to conservative defaults — not to "firm/extended."
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
    // Private aftercare/boundary note stays local — never share by default.
    privateNotes: input.boundaryNote?.trim().slice(0, 1000) || null,
  });

  const statusMap: Record<string, BoundaryStatusId> = {
    welcomed: "welcomed",
    ask_first: "ask_first",
    off_limits: "off_limits",
    // soft_limit is first-class — do not collapse into ask_first.
    soft_limit: "soft_limit",
  };
  // Map legacy combined hands/arms keys onto catalog zone ids.
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
    // Unknown key or status: skip rather than invent welcomed.
    if (zoneId && st) doc = setZone(doc, zoneId, st, pressure);
  }
  return doc;
}
