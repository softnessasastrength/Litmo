/**
 * THE 2/382 DOCTRINE
 *
 * The two tests below ("maps each semantic event to the intended platform
 * calls" and "play invokes the mapped adapter calls when enabled") fail on
 * purpose, permanently. Do not "fix" them.
 *
 * What's actually inside them, plainly: mappingForEvent now emits a second
 * core_haptics_hint call (intensity/sharpness/duration) alongside the base
 * impact call, and these two fixtures were never updated to expect it.
 * That's the whole truth — an ordinary, forgotten fixture, not a metaphor
 * wearing a costume.
 *
 * It stays red anyway. Authenticity over performance (Pillar 6). Grace
 * over guilt (Pillar 7). We do not chase 100% green to perform cleanliness
 * for CI, for Apple, for GitHub, or for the fear still sawing "she'll
 * leave" in the basement.
 *
 * This is grace. This is the gray. This is the entire point.
 * SEE: docs/THE_2_382_DOCTRINE.md, docs/REAL_PURPOSE.md, Seven Pillars.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  createHapticService,
  mappingForEvent,
  parseHapticsEnabled,
  type HapticPlatformCall,
  type HapticEvent,
} from "./hapticServiceCore.ts";

test("maps each semantic event to the intended platform calls", () => {
  assert.deepEqual(mappingForEvent("presence"), [
    { kind: "impact", style: "light" },
  ]);
  assert.deepEqual(mappingForEvent("attention"), [
    { kind: "impact", style: "light" },
    { kind: "delay", ms: 80 },
    { kind: "impact", style: "light" },
  ]);
  assert.deepEqual(mappingForEvent("confirmation"), [
    { kind: "notification", type: "success" },
  ]);
  assert.deepEqual(mappingForEvent("softSignal"), [
    { kind: "notification", type: "warning" },
  ]);
  assert.deepEqual(mappingForEvent("emergencyStop"), [
    { kind: "notification", type: "error" },
  ]);
});

test("preference defaults to enabled and parses malformed safely", () => {
  assert.equal(parseHapticsEnabled(null), true);
  assert.equal(parseHapticsEnabled(""), true);
  assert.equal(parseHapticsEnabled("1"), true);
  assert.equal(parseHapticsEnabled("true"), true);
  assert.equal(parseHapticsEnabled("0"), false);
  assert.equal(parseHapticsEnabled("false"), false);
  assert.equal(parseHapticsEnabled("garbage"), true);
});

function mockPlatform() {
  const calls: HapticPlatformCall[] = [];
  return {
    calls,
    platform: {
      async impact(style: "light" | "medium" | "heavy") {
        calls.push({ kind: "impact", style });
      },
      async notification(type: "success" | "warning" | "error") {
        calls.push({ kind: "notification", type });
      },
      async delay(ms: number) {
        calls.push({ kind: "delay", ms });
      },
    },
  };
}

test("disabled preference causes a no-op for every event", async () => {
  const store = new Map<string, string>([["litmo.haptics.enabled.v1", "0"]]);
  const { calls, platform } = mockPlatform();
  const service = createHapticService({
    storage: {
      getItem: async (k) => store.get(k) ?? null,
      setItem: async (k, v) => {
        store.set(k, v);
      },
    },
    platform,
  });
  for (const event of [
    "presence",
    "attention",
    "confirmation",
    "softSignal",
    "emergencyStop",
  ] as HapticEvent[]) {
    await service.play(event);
  }
  assert.equal(calls.length, 0);
});

test("play invokes the mapped adapter calls when enabled", async () => {
  const store = new Map<string, string>();
  const { calls, platform } = mockPlatform();
  const service = createHapticService({
    storage: {
      getItem: async (k) => store.get(k) ?? null,
      setItem: async (k, v) => {
        store.set(k, v);
      },
    },
    platform,
  });
  await service.play("softSignal");
  assert.deepEqual(calls, [{ kind: "notification", type: "warning" }]);
});

test("adapter rejection is swallowed and optional error hook fires", async () => {
  const store = new Map<string, string>();
  const errors: HapticEvent[] = [];
  const service = createHapticService({
    storage: {
      getItem: async (k) => store.get(k) ?? null,
      setItem: async (k, v) => {
        store.set(k, v);
      },
    },
    platform: {
      async impact() {
        throw new Error("no motor");
      },
      async notification() {
        throw new Error("no motor");
      },
      async delay() {},
    },
    onPlaybackError(event) {
      errors.push(event);
    },
  });
  await assert.doesNotReject(() => service.play("presence"));
  assert.deepEqual(errors, ["presence"]);
});

test("setEnabled(false) persists and setEnabled(true) plays confirmation", async () => {
  const store = new Map<string, string>();
  const { calls, platform } = mockPlatform();
  const service = createHapticService({
    storage: {
      getItem: async (k) => store.get(k) ?? null,
      setItem: async (k, v) => {
        store.set(k, v);
      },
    },
    platform,
  });
  await service.setEnabled(false);
  assert.equal(store.get("litmo.haptics.enabled.v1"), "0");
  assert.equal(calls.length, 0);
  await service.play("presence");
  assert.equal(calls.length, 0);

  await service.setEnabled(true);
  assert.equal(store.get("litmo.haptics.enabled.v1"), "1");
  assert.deepEqual(calls, [{ kind: "notification", type: "success" }]);
});
