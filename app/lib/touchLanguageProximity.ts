/**
 * Anonymous Touch Language compatibility for proximity radar.
 *
 * Derives coarse 0–3 axes from a local Touch Language document without
 * exposing body zones, notes, or hard-limit text on the wire.
 * Percentages are preference resonance only — never safety or consent.
 */

import type { TouchLanguageDocument } from "./touchLanguageCore.ts";
import { BODY_ZONES } from "../data/touchLanguageCatalog.ts";
import { effectiveZoneStatus } from "./touchLanguageCore.ts";

/** Coarse TL axes safe for anonymous beacons (no zone list). */
export type TouchLanguageAnonAxes = {
  /** 0 feather · 1 gentle · 2 medium · 3 firm */
  pressure: number;
  /** 0 very slow · 1 unhurried · 2 moderate · 3 brisk */
  speed: number;
  /** 0 brief · 1 few minutes · 2 decide together · 3 extended */
  duration: number;
  /**
   * 0 very closed · 3 relatively open — based on how many zones are
   * welcomed/ask_first vs off_limits. Does not reveal which zones.
   */
  openness: number;
};

export const TL_COMPAT_DISCLAIMER =
  "Anonymous Touch Language compatibility only. Not safety, not trust, not consent to touch, not a session invitation.";

export function clamp03(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

export function anonAxesFromTouchLanguage(
  doc: TouchLanguageDocument,
): TouchLanguageAnonAxes {
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
    const status = effectiveZoneStatus(doc, zone.id);
    named += 1;
    if (status === "welcomed") openScore += 3;
    else if (status === "ask_first") openScore += 2;
    else if (status === "soft_limit") openScore += 1;
  }
  // Average openness 0–3
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
 * Touch Language preference resonance 0–100.
 * Lower axis distance → higher %. Quiet/openness mismatch dampens slightly.
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
    dist += Math.abs(clamp03(self[k]) - clamp03(peer[k]));
  }
  // Max dist = 3*4 = 12
  const score = Math.round(100 * (1 - dist / 12));
  return Math.max(0, Math.min(100, score));
}

export function tlBandLabel(pct: number): string {
  if (pct >= 80) return "Very similar Touch Language shape";
  if (pct >= 60) return "Similar Touch Language shape";
  if (pct >= 40) return "Gentle Touch Language overlap";
  return "Different Touch Language shape";
}

/** Compact 4-char encoding for discoveryInfo (no PII). */
export function encodeTlAnonAxes(axes: TouchLanguageAnonAxes): string {
  return `c${clamp03(axes.pressure)}${clamp03(axes.speed)}${clamp03(
    axes.duration,
  )}${clamp03(axes.openness)}`;
}

export function decodeTlAnonAxes(
  raw: string | null | undefined,
): TouchLanguageAnonAxes | null {
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
