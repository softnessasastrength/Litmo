/**
 * Legacy Chapter 2 profile → Chapter 3 ConsentProfileVersion adapter.
 *
 * WHAT: Read-time merge of TouchLanguageProfile + ConsentPreference into engine rules.
 * WHY: Compatibility engine only understands ConsentProfileVersion; storage may still hold split shapes.
 * CONSENT: Transform is prepare/compute only — never writes storage or seals dual consent.
 * EDGE CASES: Diverged touch/consent versions throw; hardStops force off_limits; missing speed omitted.
 * NEVER: Widen soft_limit to welcomed; invent rules when parse fails; log private notes.
 * SEE: docs/adr/0002-legacy-profile-adapter.md · consentEngine
 */

import { z } from "zod";
import {
  ConsentPreferenceSchema,
  TouchLanguageProfileSchema,
  type BodyZonePreference,
  type ConsentPreference,
  type TouchLanguageProfile,
} from "./index.ts";
import {
  ConsentProfileVersionSchema,
  type ConsentProfileVersion,
  type ConsentRule,
} from "./consentEngine.ts";

/**
 * WHAT: Map legacy duration enums to maxDurationMinutes on duration rules.
 * WHY: Engine duration dimension expects minutes or null for decide_together.
 * CONSENT: Duration preference is not session start consent.
 * EDGE CASES: decide_together → null (no automatic cap invented).
 * NEVER: Treat brief as auto Soft Signal; use as safety score.
 */
const durationMinutes: Record<TouchLanguageProfile["duration"], number | null> =
  {
    brief: 15,
    few_minutes: 30,
    decide_together: null,
  };

/**
 * WHAT: Combine persisted touch + consent shapes into ConsentProfileVersion for compatibility.
 * WHY: Chapter 3 engine single profile; Chapter 2 storage dual documents (ADR 0002).
 * CONSENT: Read-time only — success does not mean mutual snapshot confirm or contact OK.
 * EDGE CASES:
 *   - invalid uuids / createdAt → zod throw
 *   - touchVersion !== consentVersion → throw touch_and_consent_versions_diverged
 *   - hardStops → off_limits rules with canReceive/canOffer false
 *   - private notes joined; empty → null
 * NEVER: Write back to storage; coerce soft_limit to off_limits silently without engine support;
 *        treat returned profile as dual-sealed snapshot fingerprint.
 * SEE: docs/adr/0002-legacy-profile-adapter.md
 */
export function toConsentProfileVersion(input: {
  touchId: string;
  touchVersion: number;
  consentVersion: number;
  userId: string;
  createdAt: string;
  touch: unknown;
  consent: unknown;
}): ConsentProfileVersion {
  z.uuid().parse(input.touchId);
  z.uuid().parse(input.userId);
  z.iso.datetime({ offset: true }).parse(input.createdAt);
  // Fail closed: diverged versions would mis-state what the person currently affirms.
  if (input.touchVersion !== input.consentVersion)
    throw new Error("touch_and_consent_versions_diverged");
  const touch: TouchLanguageProfile = TouchLanguageProfileSchema.parse(
    input.touch,
  );
  const consent: ConsentPreference = ConsentPreferenceSchema.parse(
    input.consent,
  );
  const rules: ConsentRule[] = [];
  /**
   * WHAT: Map one body zone preference into an engine ConsentRule.
   * WHY: Body zones are first-class dimensions for dual-profile intersection.
   * CONSENT: canReceive/canOffer true here still intersect with peer; hardStops override later.
   * EDGE CASES: soft_limit remains first-class (care zone, not full exclusion).
   * NEVER: Drop pressure; map unset zone as welcomed.
   */
  const bodyZoneRule = (zone: BodyZonePreference): ConsentRule => ({
    dimension: "body_zone",
    value: zone.zone,
    state: zone.status,
    canReceive: true,
    canOffer: true,
    pressure: zone.pressure,
    maxDurationMinutes: null,
  });
  for (const zone of consent.bodyZones) {
    // soft_limit is first-class on the engine (care zone, not full exclusion).
    rules.push(bodyZoneRule(zone));
  }
  for (const hardStop of consent.hardStops)
    rules.push({
      dimension: "body_zone",
      value: hardStop,
      // Hard stops are absolute off_limits with no offer/receive for contact.
      state: "off_limits",
      canReceive: false,
      canOffer: false,
      pressure: null,
      maxDurationMinutes: null,
    });
  for (const environment of touch.environments)
    rules.push({
      dimension: "environment",
      value: environment,
      state: "welcomed",
      canReceive: true,
      canOffer: true,
      pressure: null,
      maxDurationMinutes: null,
    });
  for (const holdType of touch.holdTypes)
    rules.push({
      dimension: "contact_type",
      value: holdType,
      state: "welcomed",
      canReceive: true,
      canOffer: true,
      pressure: null,
      maxDurationMinutes: null,
    });
  rules.push({
    dimension: "pressure",
    value: "general",
    state: "welcomed",
    canReceive: true,
    canOffer: true,
    pressure: touch.pressure,
    maxDurationMinutes: null,
  });
  // Speed is part of full Touch Language; encode as sensory preference so
  // dual-profile overlap can respect tempo (missing → fail closed by engine).
  if (touch.speed) {
    rules.push({
      dimension: "sensory",
      value: `speed:${touch.speed}`,
      state: "welcomed",
      canReceive: true,
      canOffer: true,
      pressure: null,
      maxDurationMinutes: null,
    });
  }
  rules.push({
    dimension: "duration",
    value: "general",
    state: "welcomed",
    canReceive: true,
    canOffer: true,
    pressure: null,
    maxDurationMinutes: durationMinutes[touch.duration],
  });
  // Private notes stay private fields — never used as public match copy.
  const notes = [
    touch.privateNervousSystemNotes,
    consent.privateNervousSystemNotes,
  ]
    .filter((note): note is string => note !== null)
    .join("\n");
  return ConsentProfileVersionSchema.parse({
    id: input.touchId,
    userId: input.userId,
    version: input.touchVersion,
    createdAt: input.createdAt,
    validUntil: null,
    rules,
    privateNervousSystemNotes: notes.length > 0 ? notes : null,
  });
}
