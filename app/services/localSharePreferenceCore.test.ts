import assert from "node:assert/strict";
import test from "node:test";
import {
  parseNearbyShareEnabled,
  serializeNearbyShareEnabled,
} from "./localSharePreferenceCore.ts";

test("nearby share preference defaults to off for missing/unknown values", () => {
  assert.equal(parseNearbyShareEnabled(null), false);
  assert.equal(parseNearbyShareEnabled(""), false);
  assert.equal(parseNearbyShareEnabled("0"), false);
  assert.equal(parseNearbyShareEnabled("false"), false);
  assert.equal(parseNearbyShareEnabled("maybe"), false);
});

test("nearby share preference recognizes explicit on values", () => {
  assert.equal(parseNearbyShareEnabled("1"), true);
  assert.equal(parseNearbyShareEnabled("true"), true);
});

test("serialize round-trips through parser", () => {
  assert.equal(parseNearbyShareEnabled(serializeNearbyShareEnabled(true)), true);
  assert.equal(
    parseNearbyShareEnabled(serializeNearbyShareEnabled(false)),
    false,
  );
});
