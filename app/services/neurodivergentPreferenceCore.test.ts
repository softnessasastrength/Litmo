import assert from "node:assert/strict";
import test from "node:test";
import {
  autoAdvanceDelayMs,
  defaultNeurodivergentPrefs,
  effectiveReducedStimulation,
  optimizedNeurodivergentPrefs,
  parseNeurodivergentPrefs,
  setNeurodivergentEnabled,
  setPaceMode,
} from "./neurodivergentPreferenceCore.ts";

test("parse fails closed to defaults on garbage", () => {
  assert.deepEqual(parseNeurodivergentPrefs(null), defaultNeurodivergentPrefs);
  assert.deepEqual(parseNeurodivergentPrefs("nope"), defaultNeurodivergentPrefs);
});

test("enabling optimizes inclusive design bundle", () => {
  const next = setNeurodivergentEnabled(defaultNeurodivergentPrefs, true);
  assert.equal(next.enabled, true);
  assert.equal(next.paceMode, "confirm");
  assert.equal(next.progressiveDisclosure, true);
  assert.equal(next.easyBreaks, true);
  assert.equal(next.reducedStimulation, true);
  assert.equal(next.voiceInputAids, true);
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
  assert.equal(autoAdvanceDelayMs(slow), 600);
  assert.equal(autoAdvanceDelayMs(on), null);
});

test("system reduce motion counts as reduced stimulation", () => {
  assert.equal(
    effectiveReducedStimulation(defaultNeurodivergentPrefs, true),
    true,
  );
});

test("parses v2 fields from storage", () => {
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
});
