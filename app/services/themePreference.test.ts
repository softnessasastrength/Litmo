import assert from "node:assert/strict";
import test from "node:test";
import { parseThemeScheme } from "./themePreferenceCore.ts";

test("theme preference defaults to light", () => {
  assert.equal(parseThemeScheme(null), "light");
  assert.equal(parseThemeScheme(""), "light");
  assert.equal(parseThemeScheme("garbage"), "light");
  assert.equal(parseThemeScheme("light"), "light");
});

test("theme preference accepts dark", () => {
  assert.equal(parseThemeScheme("dark"), "dark");
});
