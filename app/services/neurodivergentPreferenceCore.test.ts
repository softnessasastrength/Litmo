import assert from "node:assert/strict";
import test from "node:test";
import {
  autoAdvanceDelayMs,
  defaultNeurodivergentPrefs,
  demoStrengthNeurodivergentPrefs,
  effectiveReducedStimulation,
  optimizedNeurodivergentPrefs,
  parseNeurodivergentPrefs,
  patchNeurodivergentPrefs,
  setNeurodivergentEnabled,
  setPaceMode,
} from "./neurodivergentPreferenceCore.ts";

test("parse fails closed to defaults on garbage", () => {
  assert.deepEqual(parseNeurodivergentPrefs(null), defaultNeurodivergentPrefs);
  assert.deepEqual(parseNeurodivergentPrefs("nope"), defaultNeurodivergentPrefs);
});

test("enabling optimizes inclusive demo-strength bundle", () => {
  const next = setNeurodivergentEnabled(defaultNeurodivergentPrefs, true);
  assert.equal(next.enabled, true);
  assert.equal(next.version, 3);
  assert.equal(next.paceMode, "confirm");
  assert.equal(next.progressiveDisclosure, true);
  assert.equal(next.easyBreaks, true);
  assert.equal(next.reducedStimulation, true);
  assert.equal(next.voiceInputAids, true);
  assert.equal(next.sensoryProfile, "low");
  assert.equal(next.hapticIntensity, "off");
  assert.equal(next.motionPreference, "reduced");
  assert.equal(next.languagePreference, "plain");
  assert.equal(next.overloadExitMode, "break");
  assert.equal(next.alwaysConfirmCritical, true);
  assert.equal(next.lowVisualDensity, true);
  assert.equal(next.explicitProgress, true);
});

test("demo strength matches optimized", () => {
  assert.deepEqual(
    demoStrengthNeurodivergentPrefs(),
    optimizedNeurodivergentPrefs(),
  );
});

test("disabling returns quiet defaults", () => {
  const next = setNeurodivergentEnabled(optimizedNeurodivergentPrefs(), false);
  assert.deepEqual(next, defaultNeurodivergentPrefs);
});

test("pace mode is customizable without turning ND off", () => {
  const on = optimizedNeurodivergentPrefs();
  const slow = setPaceMode(on, "slow");
  assert.equal(slow.enabled, true);
  assert.equal(slow.paceMode, "slow");
  assert.equal(autoAdvanceDelayMs(slow), 900);
  assert.equal(autoAdvanceDelayMs(on), null);
});

test("critical steps never auto-advance when alwaysConfirmCritical", () => {
  const on = optimizedNeurodivergentPrefs();
  const auto = setPaceMode(on, "auto");
  assert.equal(autoAdvanceDelayMs(auto, true), null);
});

test("system reduce motion counts as reduced stimulation", () => {
  assert.equal(
    effectiveReducedStimulation(defaultNeurodivergentPrefs, true),
    true,
  );
});

test("parses v2 fields and fills second-level defaults", () => {
  const raw = JSON.stringify({
    enabled: true,
    paceMode: "slow",
    progressiveDisclosure: true,
    easyBreaks: true,
  });
  const p = parseNeurodivergentPrefs(raw);
  assert.equal(p.enabled, true);
  assert.equal(p.paceMode, "slow");
  assert.equal(p.progressiveDisclosure, true);
  assert.equal(p.sensoryProfile, "low");
  assert.equal(p.version, 3);
});

test("patch updates sensory profile while staying enabled", () => {
  const on = optimizedNeurodivergentPrefs();
  const next = patchNeurodivergentPrefs(on, { sensoryProfile: "variable" });
  assert.equal(next.enabled, true);
  assert.equal(next.sensoryProfile, "variable");
  assert.equal(next.hapticIntensity, "off");
});
