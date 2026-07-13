import assert from "node:assert/strict";
import test from "node:test";
import {
  allConsentMicroRulesPass,
  assertConsentPoint,
  CONSENT_POINT_IDS,
  CONSENT_POINTS,
  CONSENT_TIMING,
  consentPointsByKind,
  labelViolatesConsentGrammar,
  mayEnableGrantConfirm,
  mayFireSoftSignal,
  softSignalPhaseFromOutcome,
  stopFasterThanGrant,
} from "./consentInteractionCore.ts";

test("stop is faster than grant (constitution I.4)", () => {
  assert.equal(stopFasterThanGrant(), true);
  assert.ok(
    CONSENT_TIMING.softSignalLocalCommitMs < CONSENT_TIMING.grantConfirmArmMs,
  );
});

test("all micro-rules pass", () => {
  const { ok, failed } = allConsentMicroRulesPass();
  assert.equal(ok, true, `failed: ${failed.join(",")}`);
});

test("catalog is exhaustive and consistent", () => {
  assert.ok(CONSENT_POINT_IDS.length >= 20);
  for (const id of CONSENT_POINT_IDS) {
    const p = assertConsentPoint(id);
    assert.equal(p.id, id);
    assert.ok(p.title.length > 0);
    assert.ok(p.authorizes.length > 10);
    assert.ok(p.neverMeans.length >= 1);
    assert.ok(p.minTouchTargetPt >= 44);
    assert.ok(p.a11yLabel.length > 0);
    assert.ok(p.copy.primary.length > 0);
    assert.equal(labelViolatesConsentGrammar(p.copy.primary), false);
  }
});

test("withdraw Soft Signal points dominate weight and never arm", () => {
  for (const p of consentPointsByKind("withdraw")) {
    if (!p.id.startsWith("soft_signal") && p.id !== "block_and_leave") continue;
    if (p.id.startsWith("soft_signal")) {
      assert.ok(p.weight >= 90);
      assert.equal(p.requiresArm, false);
      assert.equal(p.worksOffline, true);
      assert.ok(
        p.neverMeans.some((n) => /emergency/i.test(n) || /reason/i.test(n)),
      );
    }
  }
});

test("prepare is not grant", () => {
  const prep = CONSENT_POINTS.snapshot_prepare_declaration;
  assert.equal(prep.kind, "prepare");
  assert.ok(prep.neverMeans.some((n) => /mutual consent/i.test(n)));
});

test("learning scenario is inform only", () => {
  assert.equal(CONSENT_POINTS.learning_scenario_choice.kind, "inform");
});

test("mayEnableGrantConfirm is deliberate", () => {
  assert.equal(
    mayEnableGrantConfirm({
      contentReady: true,
      requiredTogglesAllOn: true,
      dwellMs: 0,
      fingerprintCurrent: true,
      withdrawn: false,
    }),
    false,
  );
  assert.equal(
    mayEnableGrantConfirm({
      contentReady: true,
      requiredTogglesAllOn: true,
      dwellMs: CONSENT_TIMING.grantArmDwellMs,
      fingerprintCurrent: true,
      withdrawn: false,
    }),
    true,
  );
  assert.equal(
    mayEnableGrantConfirm({
      contentReady: true,
      requiredTogglesAllOn: true,
      dwellMs: 9999,
      fingerprintCurrent: true,
      withdrawn: true,
    }),
    false,
  );
});

test("mayFireSoftSignal never waits for peer or dwell", () => {
  assert.equal(
    mayFireSoftSignal({ alreadyEnded: false, phase: "idle" }),
    true,
  );
  assert.equal(
    mayFireSoftSignal({ alreadyEnded: true, phase: "idle" }),
    false,
  );
  assert.equal(
    mayFireSoftSignal({ alreadyEnded: false, phase: "firing" }),
    false,
  );
});

test("softSignalPhaseFromOutcome maps pending", () => {
  assert.equal(softSignalPhaseFromOutcome("pending_sync"), "syncing");
  assert.equal(softSignalPhaseFromOutcome("stopped_synced"), "settled");
});

test("forbidden labels are rejected", () => {
  assert.equal(labelViolatesConsentGrammar("Swipe to agree"), true);
  assert.equal(labelViolatesConsentGrammar("Soft Signal — end now"), false);
});
