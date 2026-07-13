import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultTouchLanguage, setZone } from "./touchLanguageCore.ts";
import {
  anonAxesFromTouchLanguage,
  computeTouchLanguageCompatibility,
  decodeTlAnonAxes,
  encodeTlAnonAxes,
  TL_COMPAT_DISCLAIMER,
} from "./touchLanguageProximity.ts";

test("anon axes never expose zone ids", () => {
  let doc = createDefaultTouchLanguage({ pressure: "light", speed: "slow" });
  doc = setZone(doc, "hands", "welcomed", "light");
  doc = setZone(doc, "face", "off_limits");
  const axes = anonAxesFromTouchLanguage(doc);
  assert.equal(axes.pressure, 0);
  assert.equal(axes.speed, 0);
  const json = JSON.stringify(axes);
  assert.ok(!json.includes("hands"));
  assert.ok(!json.includes("face"));
});

test("compatibility is high for identical axes", () => {
  const a = { pressure: 1, speed: 1, duration: 1, openness: 1 };
  assert.equal(computeTouchLanguageCompatibility(a, a), 100);
  assert.ok(
    computeTouchLanguageCompatibility(a, {
      pressure: 3,
      speed: 3,
      duration: 3,
      openness: 3,
    }) < 40,
  );
});

test("encode/decode tl axes", () => {
  const a = { pressure: 2, speed: 0, duration: 1, openness: 3 };
  assert.deepEqual(decodeTlAnonAxes(encodeTlAnonAxes(a)), a);
  assert.equal(decodeTlAnonAxes("nope"), null);
  assert.ok(TL_COMPAT_DISCLAIMER.toLowerCase().includes("not consent"));
});
