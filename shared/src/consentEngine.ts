/**
 * Canonical consent compatibility engine (shared client/server).
 *
 * Product philosophy:
 * - Profile compatibility is never consent (consentGranted is always false)
 * - soft_limit is first-class: mutual care zones, stricter than ask_first, not full exclusion
 * - Strictest boundary wins (off_limits < soft_limit < ask_first < welcomed)
 * - privateNervousSystemNotes exist on profiles but must never enter overlap explanations
 * - Missing / stale / contradictory preferences fail closed (exclude, not invent welcomed)
 * - eligible means some non-off_limits overlap exists for conversation — not touch permission
 *
 * SEE: docs/LITMO_CONSTITUTION.md (I.1–I.6) · shared/src/consentSnapshot.ts ·
 *      docs/CODE_COMMENT_STANDARD.md
 */

import { z } from "zod";

/**
 * WHAT: Ordered consent boundary states used on rules.
 * WHY: Rankable vocabulary for strictest-wins merge and mutual overlap.
 * CONSENT: soft_limit is first-class — not collapsed into ask_first or off_limits.
 * NEVER: welcomed alone is not session consent; off_limits never becomes permitted.
 */
export const consentStates = ["off_limits", "soft_limit", "ask_first", "welcomed"] as const;

/**
 * WHAT: Preference dimensions the engine can compare.
 * WHY: Multi-axis consent language beyond body zones alone.
 * CONSENT: Dimension values still require mutual non-off_limits + capability flags.
 * NEVER: Presence of a dimension does not imply contact is authorized.
 * SEE: haptic_device is capability negotiation only (ADR 0064) — never touch yes.
 */
export const deviceCapabilityDimensions = [
  "haptic_device",
  "soft_signal_local",
  "watch_complication",
] as const;

export const consentDimensions = [
  "body_zone",
  "contact_type",
  "pressure",
  "duration",
  "environment",
  "position",
  "communication",
  "accessibility",
  "haptic_device",
  "sensory",
] as const;

/**
 * WHAT: Direction of receive/offer between person A and person B.
 * WHY: Consent is directional — A receiving from B is not the same as reverse.
 * CONSENT: Each direction is evaluated independently; one welcome does not flip the other.
 * NEVER: Match both directions from a single unilateral rule.
 */
export const directions = ["a_receives_from_b", "b_receives_from_a"] as const;

/**
 * WHAT: Zod schema for one consent rule on a profile version.
 * WHY: Fail-closed validation of untrusted profile payloads.
 * CONSENT: state includes soft_limit; canReceive/canOffer gate capability without implying grant.
 * EDGE CASES: pressure/maxDuration nullable; value length 1–80; maxDuration ≤ 480 minutes.
 * NEVER: private notes are not on rules — they live only on the profile version field.
 */
export const ConsentRuleSchema = z.object({
  dimension: z.enum(consentDimensions),
  value: z.string().trim().min(1).max(80),
  state: z.enum(consentStates),
  canReceive: z.boolean(),
  canOffer: z.boolean(),
  pressure: z.enum(["light", "medium", "firm"]).nullable().default(null),
  maxDurationMinutes: z
    .number()
    .int()
    .positive()
    .max(480)
    .nullable()
    .default(null),
});

/**
 * WHAT: Zod schema for a versioned consent profile.
 * WHY: Compatibility must pin exact profile versions for snapshot fingerprinting.
 * CONSENT: privateNervousSystemNotes stay on the profile and must never enter CompatibilityResult text.
 * EDGE CASES: validUntil null = no expiry field; rules max 500; version positive int.
 * NEVER: Serialize privateNervousSystemNotes into explanations or wire share of compatibility.
 */
export const ConsentProfileVersionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }),
  validUntil: z.iso.datetime({ offset: true }).nullable().default(null),
  rules: z.array(ConsentRuleSchema).max(500),
  privateNervousSystemNotes: z.string().max(1000).nullable().default(null),
});

export type ConsentRule = z.infer<typeof ConsentRuleSchema>;
export type ConsentProfileVersion = z.infer<typeof ConsentProfileVersionSchema>;
export type Direction = (typeof directions)[number];

/**
 * WHAT: One mutually non-excluded overlap item (welcomed, ask_first, or soft_limit).
 * WHY: UI and snapshots need structured permitted / care / ask lists.
 * CONSENT: state soft_limit is first-class mutual care — still not consentGranted.
 * NEVER: Treat permitted as sealed session authorization without Consent Snapshot + affirm.
 */
export type OverlapItem = {
  dimension: ConsentRule["dimension"];
  value: string;
  direction: Direction;
  state: "welcomed" | "ask_first" | "soft_limit";
  pressure: ConsentRule["pressure"];
  maxDurationMinutes: number | null;
  explanation: string;
};

/**
 * WHAT: Machine reasons a key/direction was excluded from overlap.
 * WHY: Fail-closed paths need stable codes for tests and UI explanations.
 * CONSENT: All reasons deny that slice of contact language; none grant consent.
 */
export type ExclusionReason =
  | "off_limits"
  | "missing_preference"
  | "cannot_receive"
  | "cannot_offer"
  | "invalid_profile"
  | "stale_profile"
  | "contradictory_preference";

/**
 * WHAT: One excluded dimension/value with reason and human explanation.
 * WHY: Transparency without inventing a "almost ok" middle grant.
 * CONSENT: Exclusion is fail-closed product logic, not a score deduction.
 */
export type ExcludedItem = {
  dimension: ConsentRule["dimension"] | "profile";
  value: string;
  direction?: Direction;
  reason: ExclusionReason;
  explanation: string;
};

/**
 * WHAT: Full compatibility result between two profile versions.
 * WHY: Canonical shared output for discovery prep and Consent Snapshot construction.
 * CONSENT: consentGranted is always false; eligible is not touch permission.
 * NEVER: softLimit bucket must not be dropped into permitted or silently excluded.
 */
export type CompatibilityResult = {
  eligible: boolean;
  /** Always false — engine never grants consent. */
  consentGranted: false;
  profileA: { id: string; version: number } | null;
  profileB: { id: string; version: number } | null;
  permitted: OverlapItem[];
  askFirst: OverlapItem[];
  /** Soft limits — mutual care zones; stricter than ask_first, not full exclusion. */
  softLimit: OverlapItem[];
  excluded: ExcludedItem[];
  explanations: string[];
};

/**
 * WHAT: Numeric rank for boundary states (lower = stricter).
 * WHY: strictest-wins merge for duplicates and mutual state selection.
 * CONSENT: off_limits (0) always beats soft_limit (1) beats ask_first (2) beats welcomed (3).
 * NEVER: Invert rank so welcomed wins over off_limits.
 */
const stateRank = { off_limits: 0, soft_limit: 1, ask_first: 2, welcomed: 3 } as const;

/**
 * WHAT: Numeric rank for pressure preference (lower = lighter).
 * WHY: Mutual pressure takes the lighter of the two (fail softer contact).
 * CONSENT: Lighter mutual pressure is not a grant of firm contact later.
 */
const pressureRank = { light: 0, medium: 1, firm: 2 } as const;

/**
 * WHAT: Stable map key for a rule dimension+value (case-insensitive value).
 * WHY: Group duplicates and join A/B rules without locale surprises.
 * CONSENT: Not a consent surface — identity of preference row only.
 * EDGE CASES: uses en-US lowercasing; NUL separator avoids value/dimension collision.
 */
const keyOf = (rule: ConsentRule) =>
  `${rule.dimension}\u0000${rule.value.toLocaleLowerCase("en-US")}`;

/**
 * WHAT: Makes rule values readable in explanations (underscores → spaces).
 * WHY: Human explanations without leaking private notes.
 * CONSENT: Formatting only.
 */
const readable = (value: string) => value.replaceAll("_", " ");

/**
 * WHAT: Stable sort comparator for overlap/excluded lists.
 * WHY: Deterministic fingerprint-friendly ordering across platforms.
 * CONSENT: Not a consent surface.
 */
const compare = (
  a: { dimension: string; value: string; direction?: string },
  b: { dimension: string; value: string; direction?: string },
) =>
  `${a.dimension}:${a.value}:${a.direction ?? ""}`.localeCompare(
    `${b.dimension}:${b.value}:${b.direction ?? ""}`,
    "en-US",
  );

/**
 * WHAT: Picks the lighter (or only) pressure between two rules.
 * WHY: Mutual contact should not assume the firmer preference.
 * CONSENT: Pressure merge is for overlap language only — not session seal.
 * EDGE CASES: null pressure defers to the other side; both null → null.
 * NEVER: Invent firm when either side is light.
 */
function pressure(a: ConsentRule["pressure"], b: ConsentRule["pressure"]) {
  if (!a) return b;
  if (!b) return a;
  // Strictest contact force: lower rank (lighter) wins.
  return pressureRank[a] <= pressureRank[b] ? a : b;
}

/**
 * WHAT: Picks the shorter (or only) max duration between two rules.
 * WHY: Mutual time bound fails closed to the more restrictive ceiling.
 * CONSENT: Duration merge is not timer consent without Soft Signal freedom.
 * EDGE CASES: null defers to the other; both null → null.
 * NEVER: Take max (longer) when both set — that would expand contact time.
 */
function duration(a: number | null, b: number | null) {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

/**
 * WHAT: Collapses duplicate rules per key into one strictest row; flags contradictions.
 * WHY: Multiple rows for same dimension/value must not silently pick the most open.
 * CONSENT: state takes min rank (strictest); canReceive/canOffer AND; pressure/duration restrictive.
 * EDGE CASES:
 *   - group length > 1 → key marked contradictory (later excluded entirely)
 *   - merge still computed for map completeness but contradictory keys fail closed at evaluate
 * NEVER: Prefer welcomed when any duplicate is off_limits/soft_limit.
 * SEE: stateRank · Living Constitution I.6
 */
function normalize(rules: ConsentRule[]) {
  const groups = new Map<string, ConsentRule[]>();
  for (const rule of rules)
    groups.set(keyOf(rule), [...(groups.get(keyOf(rule)) ?? []), rule]);
  const values = new Map<string, ConsentRule>();
  const contradictory = new Set<string>();
  for (const [key, group] of groups) {
    // More than one row for same key is treated as contradictory preference (fail closed).
    if (group.length > 1) contradictory.add(key);
    values.set(
      key,
      group.reduce((a, b) => ({
        ...a,
        // Strictest boundary wins when collapsing duplicates.
        state: stateRank[a.state] <= stateRank[b.state] ? a.state : b.state,
        // Capability requires both rows to allow the capability.
        canReceive: a.canReceive && b.canReceive,
        canOffer: a.canOffer && b.canOffer,
        pressure: pressure(a.pressure, b.pressure),
        maxDurationMinutes: duration(
          a.maxDurationMinutes,
          b.maxDurationMinutes,
        ),
      })),
    );
  }
  return { values, contradictory };
}

/**
 * WHAT: True when a profile version is not valid at `now` (future-dated or expired).
 * WHY: Stale or not-yet-valid profiles must not drive mutual overlap.
 * CONSENT: Stale → empty compatibility, consentGranted still false.
 * EDGE CASES:
 *   - createdAt in the future → stale (clock skew / tamper fail closed)
 *   - validUntil <= now → stale
 * NEVER: Extend validity silently when validUntil is past.
 */
const isStale = (profile: ConsentProfileVersion, now: Date) =>
  new Date(profile.createdAt) > now ||
  (profile.validUntil !== null && new Date(profile.validUntil) <= now);

/**
 * WHAT: Computes mutual preference overlap between two untrusted profile payloads.
 * WHY: Single shared engine so client and server cannot reinterpret consent differently.
 * CONSENT: Always sets consentGranted: false. eligible only means non-empty care/permit/ask lists.
 * EDGE CASES:
 *   - invalid parse either side → eligible false, invalid_profile
 *   - stale either side → eligible false, stale_profile
 *   - missing key on either side → missing_preference exclude
 *   - contradictory duplicate keys → contradictory_preference exclude
 *   - !canReceive / !canOffer → exclude
 *   - mutual state off_limits → exclude
 *   - soft_limit → softLimit bucket (first-class, not excluded, not full permitted)
 *   - ask_first → askFirst; welcomed → permitted
 *   - privateNervousSystemNotes never read into explanations
 * NEVER: Return consentGranted true; never treat eligible as session activation.
 * SEE: createConsentSnapshot · Living Constitution I · soft_limit first-class
 */
export function computeCompatibility(
  inputA: unknown,
  inputB: unknown,
  now = new Date(),
): CompatibilityResult {
  const pa = ConsentProfileVersionSchema.safeParse(inputA);
  const pb = ConsentProfileVersionSchema.safeParse(inputB);
  /**
   * WHAT: Builds an empty fail-closed result with a single profile-level exclusion.
   * WHY: Invalid/stale paths share one shape so callers never see partial open overlap.
   * CONSENT: consentGranted always false; eligible false.
   */
  const empty = (
    reason: ExclusionReason,
    explanation: string,
  ): CompatibilityResult => ({
    eligible: false,
    consentGranted: false,
    profileA: pa.success ? { id: pa.data.id, version: pa.data.version } : null,
    profileB: pb.success ? { id: pb.data.id, version: pb.data.version } : null,
    permitted: [],
    askFirst: [],
    softLimit: [],
    excluded: [{ dimension: "profile", value: "profile", reason, explanation }],
    explanations: [explanation],
  });
  // Fail closed: schema failure cannot invent mutual welcomed rules.
  if (!pa.success || !pb.success)
    return empty(
      "invalid_profile",
      "Compatibility could not be calculated because a profile was missing or invalid.",
    );
  // Fail closed: expired or future-dated versions are not current preference maps.
  if (isStale(pa.data, now) || isStale(pb.data, now))
    return empty(
      "stale_profile",
      "Compatibility could not be calculated because at least one profile version is stale.",
    );
  // Note: privateNervousSystemNotes on pa/pb are intentionally never read below.
  const a = normalize(pa.data.rules);
  const b = normalize(pb.data.rules);
  const keys = [...new Set([...a.values.keys(), ...b.values.keys()])].sort();
  const permitted: OverlapItem[] = [];
  const askFirst: OverlapItem[] = [];
  const softLimit: OverlapItem[] = [];
  const excluded: ExcludedItem[] = [];
  for (const key of keys)
    for (const direction of directions) {
      const left = a.values.get(key);
      const right = b.values.get(key);
      const base = left ?? right!;
      const exclude = (reason: ExclusionReason, explanation: string) =>
        excluded.push({
          dimension: base.dimension,
          value: base.value,
          direction,
          reason,
          explanation,
        });
      // Both people must name a current preference — omission is not open.
      if (!left || !right) {
        exclude(
          "missing_preference",
          `${readable(base.value)} is excluded because both people did not provide a current preference.`,
        );
        continue;
      }
      // Contradictory duplicates fail closed rather than picking the more open row.
      if (a.contradictory.has(key) || b.contradictory.has(key)) {
        exclude(
          "contradictory_preference",
          `${readable(base.value)} is excluded because a profile contains contradictory preferences.`,
        );
        continue;
      }
      const receiver = direction === "a_receives_from_b" ? left : right;
      const offerer = direction === "a_receives_from_b" ? right : left;
      if (!receiver.canReceive) {
        exclude(
          "cannot_receive",
          `${readable(base.value)} is excluded because the receiving capability is unavailable.`,
        );
        continue;
      }
      if (!offerer.canOffer) {
        exclude(
          "cannot_offer",
          `${readable(base.value)} is excluded because the offering capability is unavailable.`,
        );
        continue;
      }
      // Mutual state = strictest of receiver and offerer (Living Constitution I.6).
      const state =
        stateRank[receiver.state] <= stateRank[offerer.state]
          ? receiver.state
          : offerer.state;
      if (state === "off_limits") {
        exclude(
          "off_limits",
          `${readable(base.value)} is excluded because the more restrictive preference is off limits.`,
        );
        continue;
      }
      // Lighter pressure + shorter duration win for mutual language.
      const chosenPressure = pressure(receiver.pressure, offerer.pressure);
      const chosenDuration = duration(
        receiver.maxDurationMinutes,
        offerer.maxDurationMinutes,
      );
      // soft_limit copy emphasizes extra care + easy Soft Signal (not "almost permitted").
      const tone =
        state === "soft_limit"
          ? "is a shared soft limit — extra care, easy Soft Signal"
          : state === "ask_first"
            ? "requires a fresh verbal ask"
            : "is mutually permitted in this direction";
      const explanation = `${readable(base.value)} ${tone}${chosenPressure ? ` with ${chosenPressure} pressure` : ""}${chosenDuration ? ` for up to ${chosenDuration} minutes` : ""}.`;
      const item: OverlapItem = {
        dimension: base.dimension,
        value: base.value,
        direction,
        state,
        pressure: chosenPressure,
        maxDurationMinutes: chosenDuration,
        explanation,
      };
      // First-class buckets: soft_limit is neither full exclusion nor silent welcome.
      if (state === "soft_limit") softLimit.push(item);
      else if (state === "ask_first") askFirst.push(item);
      else permitted.push(item);
    }
  permitted.sort(compare);
  askFirst.sort(compare);
  softLimit.sort(compare);
  excluded.sort(compare);
  return {
    // Eligible if any mutual non-off_limits language exists — still not consent.
    eligible: permitted.length + askFirst.length + softLimit.length > 0,
    consentGranted: false,
    profileA: { id: pa.data.id, version: pa.data.version },
    profileB: { id: pb.data.id, version: pb.data.version },
    permitted,
    askFirst,
    softLimit,
    excluded,
    // Explanations include softLimit; never private nervous-system notes.
    explanations: [...permitted, ...askFirst, ...softLimit]
      .map((item) => item.explanation)
      .concat(excluded.map((item) => item.explanation)),
  };
}

/**
 * WHAT: Slim overlap identity for before/after change previews.
 * WHY: Preview UI does not need full pressure/explanation payloads.
 * CONSENT: Preview items never grant consent.
 */
export type ProfileChangePreviewItem = Pick<
  OverlapItem,
  "dimension" | "value" | "direction" | "state"
>;

/**
 * WHAT: Diff of permitted/askFirst lists when a user considers a profile edit.
 * WHY: Let someone see practical effect before committing a new version.
 * CONSENT: Preview only — never persists versions and never grants consent.
 * NEVER: softLimit diffs are not currently returned (known scope of this helper).
 */
export type ProfileChangePreview = {
  gainedPermitted: ProfileChangePreviewItem[];
  lostPermitted: ProfileChangePreviewItem[];
  gainedAskFirst: ProfileChangePreviewItem[];
  lostAskFirst: ProfileChangePreviewItem[];
};

/**
 * WHAT: Stable key for preview set membership (dimension/value/direction).
 * WHY: Diff without false equality on explanation text.
 * CONSENT: Not a consent surface.
 */
const previewKey = (item: ProfileChangePreviewItem) =>
  `${item.dimension}\u0000${item.value}\u0000${item.direction}`;

/**
 * WHAT: Computes gained/lost items between two overlap lists by previewKey.
 * WHY: Shared by permitted and askFirst preview diffs.
 * CONSENT: Pure set math — not authorization.
 * EDGE CASES: sort after filter for stable UI.
 * NEVER: Use to auto-apply the proposed profile.
 */
function diff(
  before: OverlapItem[],
  after: OverlapItem[],
): { gained: ProfileChangePreviewItem[]; lost: ProfileChangePreviewItem[] } {
  const beforeKeys = new Set(before.map(previewKey));
  const afterKeys = new Set(after.map(previewKey));
  return {
    gained: after
      .filter((item) => !beforeKeys.has(previewKey(item)))
      .sort(compare),
    lost: before
      .filter((item) => !afterKeys.has(previewKey(item)))
      .sort(compare),
  };
}

/**
 * WHAT: Compares a not-yet-saved profile version against the currently saved
 * version, both against the same counterpart, so a user can see the
 * practical effect of a change before committing it.
 * WHY: Avoid surprise expansion/contraction of mutual language after save.
 * CONSENT: This is a preview only: it never persists a version and never grants consent.
 * EDGE CASES:
 *   - invalid/stale inputs propagate via computeCompatibility empty results
 *   - only permitted/askFirst diffs (softLimit not in ProfileChangePreview yet)
 * NEVER: Callers must not treat preview as sealed Consent Snapshot or auto-save.
 * SEE: computeCompatibility
 */
export function previewProfileChange(
  currentProfile: unknown,
  proposedProfile: unknown,
  counterpartProfile: unknown,
  now = new Date(),
): ProfileChangePreview {
  const before = computeCompatibility(currentProfile, counterpartProfile, now);
  const after = computeCompatibility(proposedProfile, counterpartProfile, now);
  const permitted = diff(before.permitted, after.permitted);
  const askFirst = diff(before.askFirst, after.askFirst);
  return {
    gainedPermitted: permitted.gained,
    lostPermitted: permitted.lost,
    gainedAskFirst: askFirst.gained,
    lostAskFirst: askFirst.lost,
  };
}
