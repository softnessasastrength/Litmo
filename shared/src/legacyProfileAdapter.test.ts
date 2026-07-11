import assert from "node:assert/strict";
import test from "node:test";
import { computeCompatibility } from "./consentEngine.ts";
import { toConsentProfileVersion } from "./legacyProfileAdapter.ts";

const userId = "10000000-0000-4000-8000-000000000001";
const touchId = "20000000-0000-4000-8000-000000000001";
const createdAt = "2026-07-11T10:00:00Z";
const touch = {
  pressure: "medium",
  duration: "few_minutes",
  environments: ["public_calm", "outdoors"],
  holdTypes: ["hand_holding"],
  privateNervousSystemNotes: "gets cold easily",
};
const consent = {
  bodyZones: [
    { zone: "hands", status: "welcomed", pressure: "medium" },
    { zone: "shoulders", status: "ask_first", pressure: "light" },
  ],
  hardStops: ["neck"],
  privateNervousSystemNotes: null,
};

test("maps body zones, hard stops, environments, hold types, pressure, and duration", () => {
  const profile = toConsentProfileVersion({
    touchId,
    touchVersion: 1,
    consentVersion: 1,
    userId,
    createdAt,
    touch,
    consent,
  });
  assert.equal(profile.id, touchId);
  assert.equal(profile.version, 1);
  const byValue = (value: string) =>
    profile.rules.find((rule) => rule.value === value);
  assert.equal(byValue("hands")?.state, "welcomed");
  assert.equal(byValue("shoulders")?.state, "ask_first");
  assert.equal(byValue("neck")?.state, "off_limits");
  assert.equal(byValue("neck")?.canReceive, false);
  assert.equal(byValue("neck")?.canOffer, false);
  assert.equal(byValue("public_calm")?.dimension, "environment");
  assert.equal(byValue("hand_holding")?.dimension, "contact_type");
  assert.equal(byValue("general")?.pressure, "medium");
  const durationRule = profile.rules.find(
    (rule) => rule.dimension === "duration",
  );
  assert.equal(durationRule?.maxDurationMinutes, 30);
});
test("concatenates private notes from both legacy tables and never uses them for compatibility", () => {
  const profile = toConsentProfileVersion({
    touchId,
    touchVersion: 1,
    consentVersion: 1,
    userId,
    createdAt,
    touch,
    consent: { ...consent, privateNervousSystemNotes: "trauma-informed note" },
  });
  assert.equal(
    profile.privateNervousSystemNotes,
    "gets cold easily\ntrauma-informed note",
  );
  const result = computeCompatibility(profile, profile, new Date(createdAt));
  assert.equal(JSON.stringify(result).includes("trauma-informed"), false);
});
test("decide_together contributes no duration ceiling of its own", () => {
  const profile = toConsentProfileVersion({
    touchId,
    touchVersion: 1,
    consentVersion: 1,
    userId,
    createdAt,
    touch: { ...touch, duration: "decide_together" },
    consent,
  });
  const counterpart = toConsentProfileVersion({
    touchId: "20000000-0000-4000-8000-000000000002",
    touchVersion: 1,
    consentVersion: 1,
    userId: "10000000-0000-4000-8000-000000000002",
    createdAt,
    touch,
    consent,
  });
  const result = computeCompatibility(
    profile,
    counterpart,
    new Date(createdAt),
  );
  const durationItem = [...result.permitted, ...result.askFirst].find(
    (item) => item.dimension === "duration",
  );
  assert.equal(durationItem?.maxDurationMinutes, 30);
});
test("a hard stop for a zone the counterpart never lists is still safe by default exclusion", () => {
  const profile = toConsentProfileVersion({
    touchId,
    touchVersion: 1,
    consentVersion: 1,
    userId,
    createdAt,
    touch,
    consent,
  });
  const counterpartConsent = {
    bodyZones: [{ zone: "hands", status: "welcomed", pressure: "medium" }],
    hardStops: [],
    privateNervousSystemNotes: null,
  };
  const counterpart = toConsentProfileVersion({
    touchId: "20000000-0000-4000-8000-000000000002",
    touchVersion: 1,
    consentVersion: 1,
    userId: "10000000-0000-4000-8000-000000000002",
    createdAt,
    touch,
    consent: counterpartConsent,
  });
  const result = computeCompatibility(
    profile,
    counterpart,
    new Date(createdAt),
  );
  const neckItem = [...result.permitted, ...result.askFirst].find(
    (item) => item.value === "neck",
  );
  assert.equal(neckItem, undefined);
});
test("mismatched touch and consent versions fail closed", () => {
  assert.throws(
    () =>
      toConsentProfileVersion({
        touchId,
        touchVersion: 2,
        consentVersion: 1,
        userId,
        createdAt,
        touch,
        consent,
      }),
    /touch_and_consent_versions_diverged/,
  );
});
test("an invalid legacy shape fails closed rather than producing a partial profile", () => {
  assert.throws(() =>
    toConsentProfileVersion({
      touchId,
      touchVersion: 1,
      consentVersion: 1,
      userId,
      createdAt,
      touch: { pressure: "unknown" },
      consent,
    }),
  );
});
