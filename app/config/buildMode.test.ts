/**
 * WHAT: Unit tests for dual build mode resolution and feature matrix.
 * WHY: Mode mis-resolution would ship Maximum RF surfaces to App Review or
 *      neuter Soft Signal — both are product defects.
 * CONSENT: Assert safety-core flags stay true in BOTH modes.
 * SEE: docs/BUILD_MODES.md
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_STORE_SAFE,
  MAXIMUM_MODE,
  parseBuildModeEnv,
  resolveBuildMode,
} from "./buildMode.ts";
import {
  FEATURES_APP_STORE,
  FEATURES_MAXIMUM,
  featureDelta,
  featuresForMode,
} from "./features.ts";
import { copyForMode } from "./copy/index.ts";
import { assertSafetyCorePresentInFlowCatalog } from "./consentFlowsByMode.ts";

test("parseBuildModeEnv accepts aliases", () => {
  assert.equal(parseBuildModeEnv("maximum"), "maximum");
  assert.equal(parseBuildModeEnv("MAX"), "maximum");
  assert.equal(parseBuildModeEnv("app_store"), "app_store");
  assert.equal(parseBuildModeEnv("appstore"), "app_store");
  assert.equal(parseBuildModeEnv("review"), "app_store");
  assert.equal(parseBuildModeEnv(null), null);
  assert.equal(parseBuildModeEnv(""), null);
});

test("parseBuildModeEnv rejects garbage", () => {
  assert.throws(() => parseBuildModeEnv("banana"), /invalid_litmo_build_mode/);
});

test("explicit env overrides platform heuristic", () => {
  assert.equal(
    resolveBuildMode({
      envMode: "maximum",
      appEnvironment: "production",
      platform: "ios",
    }),
    "maximum",
  );
  assert.equal(
    resolveBuildMode({
      envMode: "app_store",
      appEnvironment: "development",
      platform: "macos",
    }),
    "app_store",
  );
});

test("platform law: any iOS family → app_store when env unset", () => {
  for (const env of ["development", "staging", "production"] as const) {
    assert.equal(
      resolveBuildMode({
        envMode: undefined,
        appEnvironment: env,
        platform: "ios",
      }),
      "app_store",
      `ios + ${env}`,
    );
  }
  assert.equal(
    resolveBuildMode({
      envMode: undefined,
      appEnvironment: "development",
      platform: "iphonesimulator",
    }),
    "app_store",
  );
});

test("platform law: macos and linux → maximum when env unset", () => {
  assert.equal(
    resolveBuildMode({
      envMode: undefined,
      appEnvironment: "production",
      platform: "macos",
    }),
    "maximum",
  );
  assert.equal(
    resolveBuildMode({
      envMode: undefined,
      appEnvironment: "production",
      platform: "linux",
    }),
    "maximum",
  );
});

test("explicit maximum overrides ios app_store default (internal builds)", () => {
  assert.equal(
    resolveBuildMode({
      envMode: "maximum",
      appEnvironment: "production",
      platform: "ios",
    }),
    "maximum",
  );
});

test("safety core is true in both feature matrices", () => {
  for (const mode of ["maximum", "app_store"] as const) {
    const f = featuresForMode(mode);
    assert.equal(f.softSignalStop, true);
    assert.equal(f.consentDualSeal, true);
    assert.equal(f.ageGate, true);
    assert.equal(f.profileIsNotConsent, true);
    assert.equal(f.failClosedBoundaries, true);
  }
});

test("app store disables RF / NFC / hardware / demo surface", () => {
  assert.equal(FEATURES_APP_STORE.proximityRadar, false);
  assert.equal(FEATURES_APP_STORE.nfcCarefulConnect, false);
  assert.equal(FEATURES_APP_STORE.localMultipeerShare, false);
  assert.equal(FEATURES_APP_STORE.hardwareSoftSignal, false);
  assert.equal(FEATURES_APP_STORE.demoModeSurface, false);
  assert.equal(FEATURES_MAXIMUM.proximityRadar, true);
  assert.equal(FEATURES_MAXIMUM.nfcCarefulConnect, true);
});

test("featureDelta lists only differing keys", () => {
  const delta = featureDelta();
  assert.ok(delta.some((d) => d.key === "proximityRadar"));
  assert.ok(!delta.some((d) => d.key === "softSignalStop"));
});

test("both copy packs keep no-reason and not-emergency semantics", () => {
  for (const mode of ["maximum", "app_store"] as const) {
    const c = copyForMode(mode).softSignal;
    assert.match(c.hint, /no explanation|No explanation/i);
    assert.match(c.notEmergency, /not emergency/i);
    assert.ok(!/why did you stop/i.test(c.hint));
    assert.ok(!/swipe to (agree|consent)/i.test(c.button));
  }
});

test("maximum soft signal copy is sacred; app store is calmer", () => {
  const max = copyForMode("maximum").softSignal;
  const store = copyForMode("app_store").softSignal;
  assert.match(max.button, /Soft Signal/i);
  assert.match(store.button, /End session/i);
  assert.match(max.bannerBody, /sacred/i);
  assert.ok(!/sacred/i.test(store.bannerBody));
});

test("consent flow catalog keeps Soft Signal in both modes", () => {
  const { ok, errors } = assertSafetyCorePresentInFlowCatalog();
  assert.equal(ok, true, errors.join("; "));
});

test("MAXIMUM_MODE and APP_STORE_SAFE aliases are boolean duals", () => {
  assert.equal(MAXIMUM_MODE, !APP_STORE_SAFE || MAXIMUM_MODE === APP_STORE_SAFE);
  // Exactly one of the two is true for a given binary (xor).
  assert.equal(MAXIMUM_MODE !== APP_STORE_SAFE, true);
});
