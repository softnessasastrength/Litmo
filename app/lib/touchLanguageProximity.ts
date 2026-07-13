/**
 * Anonymous Touch Language compatibility for proximity radar.
 *
 * Derives coarse 0–3 axes from a local Touch Language document without
 * exposing body zones, notes, or hard-limit text on the wire.
 * Percentages are preference resonance only — never safety or consent.
 *
 * Product philosophy:
 * - TL profile ≠ consent (high % never authorizes touch)
 * - private notes / hard-limit free text never enter axes or beacons
 * - soft_limit contributes lower openness than ask_first (first-class, not ignored)
 * - compatibility is anonymous shape match, not a safety certificate
 *
 * SEE: app/lib/touchLanguageCore.ts · docs/LITMO_CONSTITUTION.md (II.4 trust ≠ safety)
 */

import type { TouchLanguageDocument } from "./touchLanguageCore.ts";
import { BODY_ZONES } from "../data/touchLanguageCatalog.ts";
import { effectiveZoneStatus } from "./touchLanguageCore.ts";

/**
 * WHAT: Coarse TL axes safe for anonymous beacons (no zone list, no free text).
 * WHY: Proximity discovery needs a privacy-preserving shape without leaking body map.
 * CONSENT: Axes are preference resonance inputs only — never session authorization.
 * NEVER: Reconstruct specific zones or hard limits from these numbers.
 */
export type TouchLanguageAnonAxes = {
  /** 0 feather · 1 gentle · 2 medium · 3 firm (implementation maps light→0, medium→1, firm→2). */
  pressure: number;
  /** 0 very slow · 1 unhurried · 2 moderate · 3 brisk */
  speed: number;
  /** 0 brief · 1 few minutes · 2 decide together · 3 reserved for extended if catalog grows */
  duration: number;
  /**
   * 0 very closed · 3 relatively open — based on how many zones are
   * welcomed/ask_first/soft_limit vs off_limits. Does not reveal which zones.
   */
  openness: number;
};

/**
 * WHAT: Fixed disclaimer copy for TL compatibility UI and beacons.
 * WHY: Product must never present % as safety, trust, or consent.
 * CONSENT: Explicit non-claims bound to every display of computeTouchLanguageCompatibility.
 * NEVER: Shorten away "not consent to touch" in user-facing surfaces that use this constant.
 */
export const TL_COMPAT_DISCLAIMER =
  "Anonymous Touch Language compatibility only. Not safety, not trust, not consent to touch, not a session invitation.";

/**
 * WHAT: Clamps a number to integer 0–3 for axis encoding.
 * WHY: Wire format and distance math assume discrete quartiles; NaN must not poison scores.
 * CONSENT: Not a consent surface — pure numeric sanitize.
 * EDGE CASES:
 *   - non-finite (NaN/Inf) → 0 (fail closed toward "closed/zero" not mid-open)
 *   - rounds then clamps so 2.6 → 3, -1 → 0
 * NEVER: Clamped axes are not proof of profile validity or mutual agreement.
 */
export function clamp03(n: number): number {
  // Fail closed: garbage numbers become 0, not a middle "neutral open" value.
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

/**
 * WHAT: Derives anonymous 0–3 axes from a full local Touch Language document.
 * WHY: Beacons need coarse shape without body zones, notes, or hard-limit text.
 * CONSENT: Output never includes privateNotes; high openness is not consent to touch.
 * EDGE CASES:
 *   - pressure maps light→0, medium→1, firm→2 (catalog has 3 levels; firm not 3)
 *   - duration "decide_together" and any extended map to 2 (no fourth catalog id yet)
 *   - openness uses effectiveZoneStatus so hard limits force off_limits contribution
 *   - soft_limit adds +1 (less open than ask_first +2, welcomed +3) — first-class, not ignored
 *   - named always counts all BODY_ZONES (unset already off_limits via effective status)
 * NEVER: Encode hard-limit free text, zone ids, or private notes into axes or discoveryInfo.
 * SEE: effectiveZoneStatus · encodeTlAnonAxes · TL_COMPAT_DISCLAIMER
 */
export function anonAxesFromTouchLanguage(
  doc: TouchLanguageDocument,
): TouchLanguageAnonAxes {
  // Coarse buckets only — never send raw catalog enums that pair with zone maps.
  const pressure =
    doc.pressure === "light" ? 0 : doc.pressure === "medium" ? 1 : 2;
  const speed =
    doc.speed === "slow"
      ? 0
      : doc.speed === "unhurried"
        ? 1
        : doc.speed === "moderate"
          ? 2
          : 3;
  const duration =
    doc.duration === "brief"
      ? 0
      : doc.duration === "few_minutes"
        ? 1
        : 2;

  let openScore = 0;
  let named = 0;
  for (const zone of BODY_ZONES) {
    // Hard limits win: effective status prevents "welcomed" beacon openness after a hard no.
    const status = effectiveZoneStatus(doc, zone.id);
    named += 1;
    if (status === "welcomed") openScore += 3;
    else if (status === "ask_first") openScore += 2;
    // soft_limit is first-class: contributes some openness but less than ask_first.
    else if (status === "soft_limit") openScore += 1;
    // off_limits contributes 0 — closed without revealing which zones.
  }
  // Average openness 0–3; named===0 is defensive (BODY_ZONES is non-empty in catalog).
  const openness =
    named === 0 ? 0 : clamp03(Math.round(openScore / named));

  return {
    pressure: clamp03(pressure),
    speed: clamp03(speed),
    duration: clamp03(duration),
    openness,
  };
}

/**
 * WHAT: Touch Language preference resonance 0–100 from two anonymous axis sets.
 * WHY: Proximity radar needs a single % without comparing private body maps.
 * CONSENT: Score is preference shape only — never safety, trust, or consent grant.
 * EDGE CASES:
 *   - axes re-clamped per key so garbage peer beacons cannot explode distance
 *   - max L1 distance = 3*4 = 12 → score 0; distance 0 → 100
 *   - result hard-clamped 0–100 after round
 * NEVER: Treat high % as session invitation, match-as-touch, or safety certificate.
 * SEE: TL_COMPAT_DISCLAIMER · Living Constitution II.4
 */
export function computeTouchLanguageCompatibility(
  self: TouchLanguageAnonAxes,
  peer: TouchLanguageAnonAxes,
): number {
  const keys: (keyof TouchLanguageAnonAxes)[] = [
    "pressure",
    "speed",
    "duration",
    "openness",
  ];
  let dist = 0;
  for (const k of keys) {
    // Re-clamp both sides: untrusted decode or hand-built axes stay in 0–3.
    dist += Math.abs(clamp03(self[k]) - clamp03(peer[k]));
  }
  // Max dist = 3*4 = 12
  const score = Math.round(100 * (1 - dist / 12));
  return Math.max(0, Math.min(100, score));
}

/**
 * WHAT: Maps a compatibility percentage to calm, non-ranking band language.
 * WHY: Avoid score-shame and "safety rank" tone; describe shape similarity only.
 * CONSENT: Labels never say "safe," "verified," or "ready to touch."
 * EDGE CASES: pct below 40 → "Different…"; thresholds 80/60/40 inclusive upper bands.
 * NEVER: Use band labels as ranking-as-safety or engagement urgency.
 * SEE: TL_COMPAT_DISCLAIMER
 */
export function tlBandLabel(pct: number): string {
  if (pct >= 80) return "Very similar Touch Language shape";
  if (pct >= 60) return "Similar Touch Language shape";
  if (pct >= 40) return "Gentle Touch Language overlap";
  return "Different Touch Language shape";
}

/**
 * WHAT: Compact 4-char encoding for discoveryInfo beacons (no PII).
 * WHY: Nearby protocols need a short stable token without zone/hard-limit leakage.
 * CONSENT: Encoded axes remain preference shape only.
 * EDGE CASES: axes clamped before digits so out-of-range cannot produce non [0-3] chars.
 * NEVER: Embed user ids, names, notes, or zone lists in this string.
 * SEE: decodeTlAnonAxes
 */
export function encodeTlAnonAxes(axes: TouchLanguageAnonAxes): string {
  return `c${clamp03(axes.pressure)}${clamp03(axes.speed)}${clamp03(
    axes.duration,
  )}${clamp03(axes.openness)}`;
}

/**
 * WHAT: Decodes a beacon string into axes or null if malformed.
 * WHY: Fail-closed ingress for untrusted proximity discoveryInfo.
 * CONSENT: Successful decode is not mutual interest or consent.
 * EDGE CASES:
 *   - null/undefined/non-string → null
 *   - must match ^c([0-3]){4}$ exactly → else null
 * NEVER: Accept longer payloads that might smuggle free text as "axes."
 * SEE: encodeTlAnonAxes
 */
export function decodeTlAnonAxes(
  raw: string | null | undefined,
): TouchLanguageAnonAxes | null {
  // Fail closed: missing or wrong type cannot yield synthetic mid-open axes.
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(/^c([0-3])([0-3])([0-3])([0-3])$/);
  if (!m) return null;
  return {
    pressure: Number(m[1]),
    speed: Number(m[2]),
    duration: Number(m[3]),
    openness: Number(m[4]),
  };
}
