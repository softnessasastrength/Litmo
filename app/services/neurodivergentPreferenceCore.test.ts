import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultNeurodivergentPrefs,
  effectiveReducedStimulation,
  optimizedNeurodivergentPrefs,
  parseNeurodivergentPrefs,
  setNeurodivergentEnabled,
} from "./neurodivergentPreferenceCore.ts";

test("parse fails closed to defaults on garbage", () => {
  assert.deepEqual(parseNeurodivergentPrefs(null), defaultNeurodivergentPrefs);
  assert.deepEqual(parseNeurodivergentPrefs("nope"), defaultNeurodivergentPrefs);
  assert.deepEqual(parseNeurodivergentPrefs("[]"), defaultNeurodivergentPrefs);
});

test("enabling neurodivergent mode optimizes the full bundle", () => {
  const next = setNeurodivergentEnabled(defaultNeurodivergentPrefs, true);
  assert.equal(next.enabled, true);
  assert.equal(next.reducedStimulation, true);
  assert.equal(next.clearLanguage, true);
  assert.equal(next.easyNavigation, true);
  assert.equal(next.saveResume, true);
  assert.equal(next.readAloud, true);
  assert.equal(next.voiceInputAids, true);
});

test("disabling returns quiet defaults", () => {
  const next = setNeurodivergentEnabled(optimizedNeurodivergentPrefs(), false);
  assert.deepEqual(next, defaultNeurodivergentPrefs);
});

test("system reduce motion counts as reduced stimulation", () => {
  assert.equal(
    effectiveReducedStimulation(defaultNeurodivergentPrefs, true),
    true,
  );
  assert.equal(
    effectiveReducedStimulation(optimizedNeurodivergentPrefs(), false),
    true,
  );
});
