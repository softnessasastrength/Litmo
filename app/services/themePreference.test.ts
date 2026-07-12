import assert from "node:assert/strict";
import test from "node:test";
import {
  nextAppearancePreference,
  resolveScheme,
} from "../theme.ts";
import { parseThemeScheme } from "./themePreferenceCore.ts";

test("theme preference defaults to light", () => {
  assert.equal(parseThemeScheme(null), "light");
  assert.equal(parseThemeScheme(""), "light");
  assert.equal(parseThemeScheme("garbage"), "light");
  assert.equal(parseThemeScheme("light"), "light");
});

test("theme preference accepts dark and system", () => {
  assert.equal(parseThemeScheme("dark"), "dark");
  assert.equal(parseThemeScheme("system"), "system");
});

test("resolveScheme follows system when preferred", () => {
  assert.equal(resolveScheme("system", true), "dark");
  assert.equal(resolveScheme("system", false), "light");
  assert.equal(resolveScheme("dark", false), "dark");
  assert.equal(resolveScheme("light", true), "light");
});

test("appearance cycles light → dark → system → light", () => {
  assert.equal(nextAppearancePreference("light"), "dark");
  assert.equal(nextAppearancePreference("dark"), "system");
  assert.equal(nextAppearancePreference("system"), "light");
});
