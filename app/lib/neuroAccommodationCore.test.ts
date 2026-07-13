/**
 * Second-level ND / trauma accommodation pure-core tests.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accommodationAutoAdvanceMs,
  demoStrengthAccommodations,
  effectiveMotionReduced,
  evaluateAccommodationFeature,
  languageDensity,
  mayPlayHaptic,
  overloadExitHref,
  pickLanguageVariant,
  sensoryDensityLevel,
  standardAccommodations,
} from "./neuroAccommodationCore.ts";

describe("neuroAccommodationCore", () => {
  it("demo strength is calm-first", () => {
    const d = demoStrengthAccommodations();
    assert.equal(d.sensoryProfile, "low");
    assert.equal(d.hapticIntensity, "off");
    assert.equal(d.motionPreference, "reduced");
    assert.equal(d.languagePreference, "plain");
    assert.equal(d.paceMode, "confirm");
    assert.equal(d.alwaysConfirmCritical, true);
  });

  it("haptic gate: off never, minimal only stop-class", () => {
    assert.equal(mayPlayHaptic("off", "presence"), false);
    assert.equal(mayPlayHaptic("minimal", "presence"), false);
    assert.equal(mayPlayHaptic("minimal", "softSignal"), true);
    assert.equal(mayPlayHaptic("standard", "confirmation"), true);
  });

  it("motion reduced ORs system Reduce Motion", () => {
    assert.equal(effectiveMotionReduced("standard", true, false), true);
    assert.equal(effectiveMotionReduced("reduced", false, false), true);
    assert.equal(effectiveMotionReduced("standard", false, false), false);
  });

  it("auto-advance null on confirm and critical", () => {
    assert.equal(
      accommodationAutoAdvanceMs({
        paceMode: "confirm",
        reducedStimulation: false,
        sensoryProfile: "balanced",
        isCriticalStep: false,
        alwaysConfirmCritical: true,
      }),
      null,
    );
    assert.equal(
      accommodationAutoAdvanceMs({
        paceMode: "auto",
        reducedStimulation: false,
        sensoryProfile: "balanced",
        isCriticalStep: true,
        alwaysConfirmCritical: true,
      }),
      null,
    );
    assert.equal(
      accommodationAutoAdvanceMs({
        paceMode: "slow",
        reducedStimulation: true,
        sensoryProfile: "low",
        isCriticalStep: false,
        alwaysConfirmCritical: true,
      }),
      900,
    );
  });

  it("overload exit routes by mode and context", () => {
    assert.equal(
      overloadExitHref("break", "quiz").href,
      "/(tabs)/quizzes",
    );
    assert.equal(
      overloadExitHref("panic_cover", "session").href,
      "/safety/panic-cover",
    );
    assert.equal(overloadExitHref("home", "general").href, "/(tabs)");
  });

  it("language variants prefer plain by default", () => {
    assert.equal(languageDensity("plain"), "short");
    assert.equal(
      pickLanguageVariant("plain", {
        plain: "A",
        standard: "B",
        detailed: "C",
      }),
      "A",
    );
    assert.equal(sensoryDensityLevel("low", false), 0);
    assert.equal(sensoryDensityLevel("balanced", false), 2);
  });

  it("standard accommodations are quieter than demo only on sensory axes", () => {
    const s = standardAccommodations();
    assert.equal(s.hapticIntensity, "standard");
    assert.equal(s.alwaysConfirmCritical, true);
  });

  it("constitution gate fails closed on profile export and consent gating", () => {
    const bad = evaluateAccommodationFeature({
      exportsAsProfileTrait: true,
      gatesConsentOrMatching: true,
      forcesDiagnosisLanguage: false,
      softSignalRequiresExtraStepsWhenOverload: true,
      documentsAccommodations: true,
    });
    assert.equal(bad.ok, false);
    const good = evaluateAccommodationFeature({
      exportsAsProfileTrait: false,
      gatesConsentOrMatching: false,
      forcesDiagnosisLanguage: false,
      softSignalRequiresExtraStepsWhenOverload: false,
      documentsAccommodations: true,
    });
    assert.equal(good.ok, true);
  });
});
