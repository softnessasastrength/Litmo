/**
 * Nuclear haptic language v0.1 tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SAFETY_ENVELOPE,
  ND_SAFETY_ENVELOPE,
  clampToEnvelope,
  defaultHapticVocabulary,
  describePattern,
  evaluateNuclearHapticSpec,
  formatNuclearSyntax,
  libraryPhraseToHaptic,
  markPatternPreviewed,
  mayPlayLivePattern,
  parseNuclearSyntax,
  revokeHapticFacet,
} from "./hapticLanguageNuclear.ts";

describe("hapticLanguageNuclear v0.1", () => {
  it("parses bracket syntax", () => {
    const p = parseNuclearSyntax(
      "[shoulder-left][firm][wave-rising 600ms][heartbeat 72bpm][affirming][consent-id:abc]",
    );
    assert.ok(p);
    assert.equal(p!.zone, "shoulder-left");
    assert.equal(p!.intensity, "firm");
    assert.equal(p!.durationMs, 600);
    assert.equal(p!.heartbeatBpm, 72);
    assert.equal(p!.context, "affirming");
    assert.equal(p!.consentId, "abc");
  });

  it("format/parse round-trip keeps zone and intensity", () => {
    const p = parseNuclearSyntax("[device][light][double 120ms][presence]");
    assert.ok(p);
    const raw = formatNuclearSyntax(p!);
    const back = parseNuclearSyntax(raw);
    assert.equal(back?.zone, "device");
    assert.equal(back?.intensity, "light");
  });

  it("envelope clamps ND ceilings", () => {
    const c = clampToEnvelope(0.9, 5000, ND_SAFETY_ENVELOPE, false);
    assert.ok(c.intensity <= 0.45);
    assert.ok(c.durationMs <= 2500);
  });

  it("Soft Signal envelope not ND-capped the same way for sacred path", () => {
    const c = clampToEnvelope(0.9, 900, ND_SAFETY_ENVELOPE, true);
    assert.ok(c.intensity >= 0.45); // sacred uses SOFT_SIGNAL_SACRED_ENVELOPE
  });

  it("live play requires preview and vocabulary", () => {
    const pattern = parseNuclearSyntax(
      "[device][light][single 100ms][presence][consent-id:snap1]",
    )!;
    const vocab = defaultHapticVocabulary("snap1");
    assert.equal(
      mayPlayLivePattern({
        pattern,
        vocabulary: vocab,
        envelope: DEFAULT_SAFETY_ENVELOPE,
        isSoftSignal: false,
        softSignalActive: false,
        hasPreviewed: false,
      }).ok,
      false,
    );
    const withPreview = markPatternPreviewed(vocab, "greeting_double_tap");
    assert.equal(
      mayPlayLivePattern({
        pattern,
        vocabulary: withPreview,
        envelope: DEFAULT_SAFETY_ENVELOPE,
        isSoftSignal: false,
        softSignalActive: false,
        hasPreviewed: true,
      }).ok,
      true,
    );
  });

  it("Soft Signal always ok; kills other when active", () => {
    const pattern = parseNuclearSyntax("[device][firm][single 100ms][presence]")!;
    assert.equal(
      mayPlayLivePattern({
        pattern,
        vocabulary: null,
        envelope: DEFAULT_SAFETY_ENVELOPE,
        isSoftSignal: true,
        softSignalActive: false,
        hasPreviewed: false,
      }).ok,
      true,
    );
    assert.equal(
      mayPlayLivePattern({
        pattern,
        vocabulary: defaultHapticVocabulary("x"),
        envelope: DEFAULT_SAFETY_ENVELOPE,
        isSoftSignal: false,
        softSignalActive: true,
        hasPreviewed: true,
      }).ok,
      false,
    );
  });

  it("granular revocation of sustained and zone", () => {
    const v = revokeHapticFacet(defaultHapticVocabulary("c"), "sustained");
    const pattern = parseNuclearSyntax(
      "[device][medium][wave-soft 1500ms][calming][consent-id:c]",
    )!;
    assert.equal(
      mayPlayLivePattern({
        pattern,
        vocabulary: v,
        envelope: DEFAULT_SAFETY_ENVELOPE,
        isSoftSignal: false,
        softSignalActive: false,
        hasPreviewed: true,
      }).ok,
      false,
    );
  });

  it("library soft_signal is interrupt soft_signal", () => {
    const p = libraryPhraseToHaptic("soft_signal_sacred");
    assert.equal(p.lexeme, "soft_signal");
    assert.equal(p.interrupt, "soft_signal");
  });

  it("describePattern is plain language", () => {
    const p = parseNuclearSyntax("[hand-left][feather][single 80ms][check_in]")!;
    const d = describePattern(p);
    assert.ok(d.includes("hand-left"));
    assert.ok(d.toLowerCase().includes("never means"));
  });

  it("constitution gate", () => {
    assert.equal(
      evaluateNuclearHapticSpec({
        softSignalCanBeOverridden: true,
        liveWithoutPreviewWhenRequired: false,
        peerConsentEncodedInPattern: false,
        communityPatternWithoutReview: false,
        documentsSpec: true,
      }).ok,
      false,
    );
  });
});
