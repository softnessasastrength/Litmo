import assert from "node:assert/strict";
import test from "node:test";
import {
  neuroTextScale,
  scaleStyleRecord,
  scaleStylesMap,
} from "./neuroStyleScale.ts";

test("neuro text scale is 1 when off and larger when on", () => {
  assert.equal(neuroTextScale(false), 1);
  assert.ok(neuroTextScale(true) > 1.1);
});

test("scales font metrics but not border width", () => {
  const scaled = scaleStyleRecord(
    { fontSize: 16, lineHeight: 24, borderWidth: 1, minHeight: 44 },
    1.2,
  );
  assert.equal(scaled.fontSize, 19.2);
  assert.equal(scaled.lineHeight, 28.8);
  assert.equal(scaled.borderWidth, 1);
  assert.equal(scaled.minHeight, 52.8);
});

test("scaleStylesMap scales nested style objects", () => {
  const map = scaleStylesMap(
    {
      title: { fontSize: 20 },
      bare: "skip",
    },
    1.18,
  );
  assert.equal((map.title as { fontSize: number }).fontSize, 23.6);
  assert.equal(map.bare, "skip");
});
