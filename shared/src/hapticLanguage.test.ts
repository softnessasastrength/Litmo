import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILTIN_SENSORY_PROFILES,
  applySensoryProfileToCapabilities,
  defaultPhoneCapabilities,
  defaultWatchCapabilities,
  emptyHapticVocabulary,
  featherModeCapabilities,
  mayPlayOnDevice,
  affirmDeviceOnVocabulary,
} from "./hapticLanguage.ts";
import {
  WATCH_PHRASE_LIBRARY,
  createWristSoftSignalKill,
  resolveCrossDeviceProposal,
  watchPhraseSequence,
  complicationA11yLabel,
  defaultComplicationState,
} from "./hapticWatch.ts";

test("watch capabilities include complication Soft Signal", () => {
  const w = defaultWatchCapabilities();
  assert.equal(w.complicationSoftSignal, true);
  assert.equal(w.supportsDirectionalStroke, true);
});

test("feather mode caps intensity", () => {
  const f = featherModeCapabilities(defaultWatchCapabilities());
  assert.equal(f.maxIntensity, "feather");
});

test("mayPlay Soft Signal without vocabulary", () => {
  const r = mayPlayOnDevice({
    lexeme: "soft_signal",
    intensity: "firm",
    deviceId: "watch-1",
    capabilities: defaultWatchCapabilities(),
    vocabulary: null,
    softSignalActive: false,
    isSoftSignal: true,
    hasPreviewed: false,
    requireDualDeviceAffirm: true,
    minAffirmedDevices: 2,
  });
  assert.equal(r.ok, true);
});

test("live presence requires preview and affirm", () => {
  let v = emptyHapticVocabulary("snap");
  v = affirmDeviceOnVocabulary(v, "phone");
  const denied = mayPlayOnDevice({
    lexeme: "presence",
    intensity: "light",
    deviceId: "watch",
    capabilities: defaultWatchCapabilities(),
    vocabulary: v,
    softSignalActive: false,
    isSoftSignal: false,
    hasPreviewed: false,
    requireDualDeviceAffirm: true,
    minAffirmedDevices: 2,
  });
  assert.equal(denied.ok, false);
});

test("cross-device proposal needs watch preview+affirm", () => {
  const proposal = {
    proposalId: "p1",
    consentId: "snap",
    lexeme: "presence" as const,
    intensity: "light" as const,
    watchPhraseId: "watch_presence" as const,
    proposedByDeviceId: "phone",
    requiredDeviceIds: ["phone", "watch"],
    createdAt: "2026-07-13T00:00:00Z",
  };
  let v = emptyHapticVocabulary("snap");
  v = affirmDeviceOnVocabulary(v, "phone");
  v = affirmDeviceOnVocabulary(v, "watch");
  const pending = resolveCrossDeviceProposal({
    proposal,
    vocabulary: v,
    capabilitiesByDevice: {
      phone: defaultPhoneCapabilities(),
      watch: defaultWatchCapabilities(),
    },
    previewedBy: ["phone"],
    affirmedBy: ["phone"],
    rejectedBy: [],
    softSignalActive: false,
  });
  assert.equal(pending.status, "pending_preview");

  const live = resolveCrossDeviceProposal({
    proposal,
    vocabulary: v,
    capabilitiesByDevice: {
      phone: defaultPhoneCapabilities(),
      watch: defaultWatchCapabilities(),
    },
    previewedBy: ["phone", "watch"],
    affirmedBy: ["phone", "watch"],
    rejectedBy: [],
    softSignalActive: false,
  });
  assert.equal(live.status, "live_allowed");
});

test("wrist Soft Signal kill command ends session when id present", () => {
  const k = createWristSoftSignalKill({
    watchDeviceId: "w1",
    sessionId: "s1",
    at: "2026-07-13T00:00:00Z",
  });
  assert.equal(k.killAllHaptics, true);
  assert.equal(k.endSession, true);
  assert.equal(k.sourceClass, "watch");
});

test("watch Soft Signal sequence is non-empty", () => {
  const seq = watchPhraseSequence("watch_soft_signal");
  assert.ok(seq.length >= 3);
  assert.equal(WATCH_PHRASE_LIBRARY.watch_soft_signal.lexeme, "soft_signal");
});

test("complication a11y never mentions peer", () => {
  const label = complicationA11yLabel(defaultComplicationState());
  assert.ok(label.toLowerCase().includes("soft signal"));
  assert.ok(!label.toLowerCase().includes("partner"));
});

test("sensory profile applies to capabilities", () => {
  const feather = BUILTIN_SENSORY_PROFILES.find(
    (p) => p.id === "feather_overstimulated",
  )!;
  const c = applySensoryProfileToCapabilities(
    defaultPhoneCapabilities(),
    feather,
  );
  assert.equal(c.maxIntensity, "feather");
});
