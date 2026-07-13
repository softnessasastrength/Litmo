import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultProximityPrefs,
  parseProximityPrefs,
  serializeProximityPrefs,
} from "./proximityPreferenceCore.ts";

test("proximity prefs default to opt-out", () => {
  const p = parseProximityPrefs(null);
  assert.equal(p.enabled, false);
  assert.equal(p.quietPreferred, true);
});

test("malformed prefs fail closed to defaults", () => {
  const p = parseProximityPrefs("{not-json");
  assert.equal(p.enabled, false);
  assert.deepEqual(p.axes, defaultProximityPrefs.axes);
});

test("round-trip serialization", () => {
  const next = {
    ...defaultProximityPrefs,
    enabled: true,
    includeWeather: true,
    weather: "tidepool" as const,
    axes: { pace: 0, presence: 2, sensory: 3, repair: 1 },
  };
  const parsed = parseProximityPrefs(serializeProximityPrefs(next));
  assert.deepEqual(parsed, next);
});
