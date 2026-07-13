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

const durationMinutes: Record<TouchLanguageProfile["duration"], number | null> =
  {
    brief: 15,
    few_minutes: 30,
    decide_together: null,
  };

/**
 * Documented in docs/adr/0002-legacy-profile-adapter.md. Combines the
 * Chapter 2 persisted touch and consent shapes into the single canonical
 * Chapter 3 ConsentProfileVersion the compatibility engine understands.
 * Read-time transform only: never writes to storage.
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
  if (input.touchVersion !== input.consentVersion)
    throw new Error("touch_and_consent_versions_diverged");
  const touch: TouchLanguageProfile = TouchLanguageProfileSchema.parse(
    input.touch,
  );
  const consent: ConsentPreference = ConsentPreferenceSchema.parse(
    input.consent,
  );
  const rules: ConsentRule[] = [];
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
    // soft_limit is a client-only status; map conservatively to ask_first so it
    // never widens to welcomed (Living Constitution Article I.6).
    const status =
      (zone.status as string) === "soft_limit" ? "ask_first" : zone.status;
    rules.push(
      bodyZoneRule({
        ...zone,
        status: status as BodyZonePreference["status"],
      }),
    );
  }
  for (const hardStop of consent.hardStops)
    rules.push({
      dimension: "body_zone",
      value: hardStop,
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
