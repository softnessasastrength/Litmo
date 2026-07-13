/**
 * Semantic haptic language pure-core tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compilePhrase,
  compose,
  defaultPhraseForLexeme,
  evaluateHapticLanguageFeature,
  intensityToImpactStyle,
  legacyEventToPhoneCalls,
  lexemeAllowedAtIntensity,
  parsePhrase,
  phrase,
  phraseToPhoneCalls,
  resolveInterrupt,
  samplePressureCurve,
  serializePhrase,
  zonePreviewPhrase,
} from "./hapticLanguageCore.ts";

describe("hapticLanguageCore", () => {
  it("descend_warm falls over time", () => {
    const a = samplePressureCurve("descend_warm", 0);
    const b = samplePressureCurve("descend_warm", 1);
    assert.ok(a > b);
  });

  it("soft_signal phrase interrupts and compiles atoms", () => {
    const p = defaultPhraseForLexeme("soft_signal");
    assert.equal(p.interrupt, "soft_signal");
    assert.equal(p.curve, "descend_warm");
    const atoms = compilePhrase(p);
    assert.ok(atoms.length >= 1);
    assert.ok(atoms.every((a) => a.intensity > 0 && a.intensity <= 1));
  });

  it("soft_signal phone calls start with warning notification", () => {
    const calls = phraseToPhoneCalls(defaultPhraseForLexeme("soft_signal"));
    assert.equal(calls[0]?.kind, "notification");
    if (calls[0]?.kind === "notification") {
      assert.equal(calls[0].type, "warning");
    }
  });

  it("legacy softSignal maps through grammar", () => {
    const calls = legacyEventToPhoneCalls("softSignal");
    assert.ok(calls.length >= 1);
    assert.equal(calls[0]?.kind, "notification");
  });

  it("interrupt priority: emergency beats soft_signal", () => {
    assert.equal(
      resolveInterrupt("soft_signal", "emergency_stop"),
      "emergency_stop",
    );
    assert.equal(resolveInterrupt("none", "soft_signal"), "soft_signal");
  });

  it("ND minimal allows only stop-class lexemes", () => {
    assert.equal(lexemeAllowedAtIntensity("presence", "minimal"), false);
    assert.equal(lexemeAllowedAtIntensity("soft_signal", "minimal"), true);
    assert.equal(lexemeAllowedAtIntensity("presence", "off"), false);
  });

  it("zone preview intensity follows TL pressure", () => {
    assert.ok(
      zonePreviewPhrase("firm").intensity > zonePreviewPhrase("light").intensity,
    );
  });

  it("serialize/parse round-trips", () => {
    const p = phrase({ lexeme: "attention", intensity: 0.5 });
    const raw = serializePhrase(p);
    const back = parsePhrase(raw);
    assert.ok(back);
    assert.equal(back?.lexeme, "attention");
    assert.equal(back?.intensity, 0.5);
  });

  it("compose sequences phrases", () => {
    const c = compose("seal", [
      defaultPhraseForLexeme("seal_step"),
      defaultPhraseForLexeme("confirmation"),
    ]);
    assert.equal(c.phrases.length, 2);
  });

  it("intensity maps to impact styles", () => {
    assert.equal(intensityToImpactStyle(0.2), "light");
    assert.equal(intensityToImpactStyle(0.5), "medium");
    assert.equal(intensityToImpactStyle(0.9), "heavy");
  });

  it("constitution gate", () => {
    assert.equal(
      evaluateHapticLanguageFeature({
        encodesPeerConsent: true,
        engagementLoop: false,
        delaysSoftSignalCommit: false,
        secretInterUserCode: false,
        documentsGrammar: true,
      }).ok,
      false,
    );
    assert.equal(
      evaluateHapticLanguageFeature({
        encodesPeerConsent: false,
        engagementLoop: false,
        delaysSoftSignalCommit: false,
        secretInterUserCode: false,
        documentsGrammar: true,
      }).ok,
      true,
    );
  });
});
