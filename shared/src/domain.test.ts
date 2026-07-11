import assert from "node:assert/strict";
import test from "node:test";
import {
  BodyZonePreferenceSchema,
  ConsentPreferenceSchema,
  SessionRequestSchema,
  TouchLanguageProfileSchema,
  serializeValidated,
} from "./index.ts";

test("touch language validates and strips unknown fields", () => {
  const parsed = TouchLanguageProfileSchema.parse({
    pressure: "light",
    duration: "brief",
    environments: ["public_calm"],
    holdTypes: ["hand_holding"],
    privateNervousSystemNotes: null,
    ignored: "removed",
  });
  assert.equal("ignored" in parsed, false);
});
test("missing private notes fail closed to null", () =>
  assert.equal(
    TouchLanguageProfileSchema.parse({
      pressure: "medium",
      duration: "few_minutes",
      environments: ["outdoors"],
      holdTypes: [],
    }).privateNervousSystemNotes,
    null,
  ));
test("body zone requires pressure unless it is off limits", () =>
  assert.equal(
    BodyZonePreferenceSchema.safeParse({
      zone: "hands",
      status: "welcomed",
      pressure: null,
    }).success,
    false,
  ));
test("consent preference rejects an empty body-zone policy", () =>
  assert.equal(
    ConsentPreferenceSchema.safeParse({ bodyZones: [], hardStops: [] }).success,
    false,
  ));
test("session request rejects matching participant ids", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  assert.equal(
    SessionRequestSchema.safeParse({
      id,
      requesterId: id,
      recipientId: id,
      createdAt: "2026-07-11T12:00:00Z",
    }).success,
    false,
  );
});
test("serialization validates before producing JSON", () =>
  assert.throws(() =>
    serializeValidated(TouchLanguageProfileSchema, { pressure: "unknown" }),
  ));
