import { z } from "zod";

export const consentStates = ["off_limits", "ask_first", "welcomed"] as const;
export const consentDimensions = [
  "body_zone",
  "contact_type",
  "pressure",
  "duration",
  "environment",
  "position",
  "communication",
  "accessibility",
  "sensory",
] as const;
export const directions = ["a_receives_from_b", "b_receives_from_a"] as const;
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
export type OverlapItem = {
  dimension: ConsentRule["dimension"];
  value: string;
  direction: Direction;
  state: "welcomed" | "ask_first";
  pressure: ConsentRule["pressure"];
  maxDurationMinutes: number | null;
  explanation: string;
};
export type ExclusionReason =
  | "off_limits"
  | "missing_preference"
  | "cannot_receive"
  | "cannot_offer"
  | "invalid_profile"
  | "stale_profile"
  | "contradictory_preference";
export type ExcludedItem = {
  dimension: ConsentRule["dimension"] | "profile";
  value: string;
  direction?: Direction;
  reason: ExclusionReason;
  explanation: string;
};
export type CompatibilityResult = {
  eligible: boolean;
  consentGranted: false;
  profileA: { id: string; version: number } | null;
  profileB: { id: string; version: number } | null;
  permitted: OverlapItem[];
  askFirst: OverlapItem[];
  excluded: ExcludedItem[];
  explanations: string[];
};

const stateRank = { off_limits: 0, ask_first: 1, welcomed: 2 } as const;
const pressureRank = { light: 0, medium: 1, firm: 2 } as const;
const keyOf = (rule: ConsentRule) =>
  `${rule.dimension}\u0000${rule.value.toLocaleLowerCase("en-US")}`;
const readable = (value: string) => value.replaceAll("_", " ");
const compare = (
  a: { dimension: string; value: string; direction?: string },
  b: { dimension: string; value: string; direction?: string },
) =>
  `${a.dimension}:${a.value}:${a.direction ?? ""}`.localeCompare(
    `${b.dimension}:${b.value}:${b.direction ?? ""}`,
    "en-US",
  );
function pressure(a: ConsentRule["pressure"], b: ConsentRule["pressure"]) {
  if (!a) return b;
  if (!b) return a;
  return pressureRank[a] <= pressureRank[b] ? a : b;
}
function duration(a: number | null, b: number | null) {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}
function normalize(rules: ConsentRule[]) {
  const groups = new Map<string, ConsentRule[]>();
  for (const rule of rules)
    groups.set(keyOf(rule), [...(groups.get(keyOf(rule)) ?? []), rule]);
  const values = new Map<string, ConsentRule>();
  const contradictory = new Set<string>();
  for (const [key, group] of groups) {
    if (group.length > 1) contradictory.add(key);
    values.set(
      key,
      group.reduce((a, b) => ({
        ...a,
        state: stateRank[a.state] <= stateRank[b.state] ? a.state : b.state,
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
const isStale = (profile: ConsentProfileVersion, now: Date) =>
  new Date(profile.createdAt) > now ||
  (profile.validUntil !== null && new Date(profile.validUntil) <= now);

export function computeCompatibility(
  inputA: unknown,
  inputB: unknown,
  now = new Date(),
): CompatibilityResult {
  const pa = ConsentProfileVersionSchema.safeParse(inputA);
  const pb = ConsentProfileVersionSchema.safeParse(inputB);
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
    excluded: [{ dimension: "profile", value: "profile", reason, explanation }],
    explanations: [explanation],
  });
  if (!pa.success || !pb.success)
    return empty(
      "invalid_profile",
      "Compatibility could not be calculated because a profile was missing or invalid.",
    );
  if (isStale(pa.data, now) || isStale(pb.data, now))
    return empty(
      "stale_profile",
      "Compatibility could not be calculated because at least one profile version is stale.",
    );
  const a = normalize(pa.data.rules);
  const b = normalize(pb.data.rules);
  const keys = [...new Set([...a.values.keys(), ...b.values.keys()])].sort();
  const permitted: OverlapItem[] = [];
  const askFirst: OverlapItem[] = [];
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
      if (!left || !right) {
        exclude(
          "missing_preference",
          `${readable(base.value)} is excluded because both people did not provide a current preference.`,
        );
        continue;
      }
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
      const chosenPressure = pressure(receiver.pressure, offerer.pressure);
      const chosenDuration = duration(
        receiver.maxDurationMinutes,
        offerer.maxDurationMinutes,
      );
      const explanation = `${readable(base.value)} ${state === "ask_first" ? "requires a fresh verbal ask" : "is mutually permitted in this direction"}${chosenPressure ? ` with ${chosenPressure} pressure` : ""}${chosenDuration ? ` for up to ${chosenDuration} minutes` : ""}.`;
      const item: OverlapItem = {
        dimension: base.dimension,
        value: base.value,
        direction,
        state,
        pressure: chosenPressure,
        maxDurationMinutes: chosenDuration,
        explanation,
      };
      (state === "ask_first" ? askFirst : permitted).push(item);
    }
  permitted.sort(compare);
  askFirst.sort(compare);
  excluded.sort(compare);
  return {
    eligible: permitted.length + askFirst.length > 0,
    consentGranted: false,
    profileA: { id: pa.data.id, version: pa.data.version },
    profileB: { id: pb.data.id, version: pb.data.version },
    permitted,
    askFirst,
    excluded,
    explanations: [...permitted, ...askFirst]
      .map((item) => item.explanation)
      .concat(excluded.map((item) => item.explanation)),
  };
}

export type ProfileChangePreviewItem = Pick<
  OverlapItem,
  "dimension" | "value" | "direction" | "state"
>;
export type ProfileChangePreview = {
  gainedPermitted: ProfileChangePreviewItem[];
  lostPermitted: ProfileChangePreviewItem[];
  gainedAskFirst: ProfileChangePreviewItem[];
  lostAskFirst: ProfileChangePreviewItem[];
};
const previewKey = (item: ProfileChangePreviewItem) =>
  `${item.dimension} ${item.value} ${item.direction}`;
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
 * Compares a not-yet-saved profile version against the currently saved
 * version, both against the same counterpart, so a user can see the
 * practical effect of a change before committing it. This is a preview
 * only: it never persists a version and never grants consent.
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
