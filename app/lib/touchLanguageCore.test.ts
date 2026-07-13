import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSharePayload,
  completenessOf,
  createDefaultTouchLanguage,
  effectiveZoneStatus,
  hardLimitForcesZoneOffLimits,
  migrateFromLegacyDemo,
  parseSharePayload,
  parseTouchLanguageDocument,
  setAllUnsetZones,
  setZone,
  summarizeForDisplay,
} from "./touchLanguageCore.ts";
import { sealTouchLanguageShare, openTouchLanguageShare } from "../services/touchLanguageShareCore.ts";

test("hard limits force zones off_limits (constitution: hard limits win)", () => {
  let doc = createDefaultTouchLanguage();
  doc = setZone(doc, "face", "welcomed", "light");
  doc = setZone(doc, "hands", "welcomed", "medium");
  doc = { ...doc, hardLimits: ["No face contact", "zone:hands"] };
  assert.equal(effectiveZoneStatus(doc, "face"), "off_limits");
  assert.equal(effectiveZoneStatus(doc, "hands"), "off_limits");
  assert.equal(hardLimitForcesZoneOffLimits("neck only", "neck"), true);
  assert.equal(hardLimitForcesZoneOffLimits("neck only", "feet"), false);
});

test("default document fails closed flags and parses round-trip", () => {
  const doc = createDefaultTouchLanguage();
  assert.equal(doc.notConsentToTouch, true);
  assert.equal(doc.shareIsReviewOnly, true);
  const again = parseTouchLanguageDocument(JSON.parse(JSON.stringify(doc)));
  assert.ok(again);
  assert.equal(again!.pressure, "medium");
});

test("setZone off_limits clears pressure; welcomed requires pressure", () => {
  let doc = createDefaultTouchLanguage();
  doc = setZone(doc, "hands", "welcomed", "light");
  assert.equal(doc.zones.hands?.pressure, "light");
  doc = setZone(doc, "face", "off_limits");
  assert.equal(doc.zones.face?.pressure, null);
  assert.equal(doc.zones.face?.status, "off_limits");
});

test("completeness requires environments, holds, and enough zones", () => {
  let doc = createDefaultTouchLanguage({
    holdTypes: [],
    environments: ["outdoors"],
  });
  assert.equal(completenessOf(doc).isMinimallyComplete, false);
  doc = setZone(doc, "hands", "welcomed");
  doc = setZone(doc, "shoulders", "ask_first");
  doc = setZone(doc, "upper_back", "soft_limit");
  doc = { ...doc, holdTypes: ["side_by_side"] };
  assert.equal(completenessOf(doc).isMinimallyComplete, true);
});

test("share payload strips private notes", () => {
  const doc = createDefaultTouchLanguage({
    privateNotes: "I freeze when rushed",
  });
  const payload = buildSharePayload(doc);
  assert.equal(payload.document.privateNotes, null);
  assert.equal(payload.notConsentToTouch, true);
  assert.equal(payload.notSessionActivation, true);
  assert.ok(parseSharePayload(payload));
});

test("encrypted share opens with unlock code and fails wrong code", () => {
  const doc = createDefaultTouchLanguage();
  doc.zones = {
    hands: { status: "welcomed", pressure: "light" },
  };
  const built = sealTouchLanguageShare(doc, 60_000);
  const ok = openTouchLanguageShare(built.envelope, built.unlockCode);
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.payload.document.zones.hands?.status, "welcomed");
    assert.equal(ok.payload.document.privateNotes, null);
  }
  const bad = openTouchLanguageShare(built.envelope, "000000");
  assert.equal(bad.ok, false);
});

test("migrateFromLegacyDemo maps labels", () => {
  const doc = migrateFromLegacyDemo({
    touchChoices: {
      pressure: "Feather-light",
      duration: "A brief hello",
      environment: "Somewhere outdoors",
    },
    bodyBoundaries: {
      hands: "welcomed",
      shoulders: "ask_first",
    },
    hardStops: ["face"],
    boundaryNote: "slow down",
  });
  assert.equal(doc.pressure, "light");
  assert.equal(doc.duration, "brief");
  assert.deepEqual(doc.environments, ["outdoors"]);
  assert.equal(doc.zones.hands?.status, "welcomed");
  assert.equal(doc.privateNotes, "slow down");
});

test("setAllUnsetZones fills only empty slots", () => {
  let doc = createDefaultTouchLanguage();
  doc = setZone(doc, "hands", "welcomed", "firm");
  doc = setAllUnsetZones(doc, "ask_first");
  assert.equal(doc.zones.hands?.status, "welcomed");
  assert.equal(doc.zones.shoulders?.status, "ask_first");
});

test("summarizeForDisplay lists zone labels", () => {
  let doc = createDefaultTouchLanguage();
  doc = setZone(doc, "hands", "welcomed");
  const s = summarizeForDisplay(doc);
  assert.match(s.welcomed, /Hands/);
  assert.match(s.pressure, /Comfortably|gentle|Feather|Steady|light|medium|firm/i);
});
