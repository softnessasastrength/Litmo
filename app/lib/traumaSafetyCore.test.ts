import assert from "node:assert/strict";
import test from "node:test";
import {
  computeTimeoutPhase,
  createEmptyReflection,
  createVerificationRecord,
  defaultSessionTimeoutPrefs,
  defaultTraumaSafetyPrefs,
  parseSessionReflection,
  parseTraumaSafetyPrefs,
  parseVerificationRecord,
  PARTNER_VERIFICATION_CHECKS,
  REFLECTION_PROMPTS,
  upsertReflectionAnswer,
} from "./traumaSafetyCore.ts";

test("timeout disabled by default", () => {
  const prefs = defaultSessionTimeoutPrefs();
  assert.equal(prefs.enabled, false);
  const phase = computeTimeoutPhase(prefs, 9999);
  assert.equal(phase.phase, "disabled");
});

test("timeout warning and due phases", () => {
  const prefs = {
    ...defaultSessionTimeoutPrefs(),
    enabled: true,
    maxMinutes: 30,
    warnBeforeMinutes: 5,
  };
  assert.equal(computeTimeoutPhase(prefs, 60).phase, "ok");
  assert.equal(computeTimeoutPhase(prefs, 26 * 60).phase, "warning");
  assert.equal(computeTimeoutPhase(prefs, 30 * 60).phase, "due");
  assert.ok(computeTimeoutPhase(prefs, 26 * 60).message);
});

test("partner verification is never a certificate", () => {
  assert.ok(PARTNER_VERIFICATION_CHECKS.length >= 4);
  const rec = createVerificationRecord(["i_am_present", "soft_signal_known"]);
  assert.equal(rec.notSafetyCertificate, true);
  assert.equal(rec.notConsent, true);
  assert.equal(rec.notIdentityProof, true);
  const parsed = parseVerificationRecord(rec);
  assert.ok(parsed);
  assert.equal(parseVerificationRecord({ version: 2 }), null);
});

test("reflection ladder is skippable and non-clinical", () => {
  assert.ok(REFLECTION_PROMPTS.every((p) => p.skipIsSuccess));
  let doc = createEmptyReflection({ exitKind: "soft_signal" });
  doc = upsertReflectionAnswer(doc, {
    promptId: "body_now",
    chip: "Prefer not to say",
    note: null,
    skipped: false,
  });
  assert.equal(doc.notTherapy, true);
  assert.equal(doc.notRequired, true);
  assert.equal(doc.notScore, true);
  const parsed = parseSessionReflection(doc);
  assert.ok(parsed);
  assert.equal(parsed!.answers.length, 1);
});

test("prefs parse fails closed", () => {
  assert.equal(parseTraumaSafetyPrefs(null), null);
  const d = defaultTraumaSafetyPrefs();
  assert.ok(parseTraumaSafetyPrefs(d));
  assert.equal(d.panic.useCoverScreen, true);
});
