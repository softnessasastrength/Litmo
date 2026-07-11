import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCompatibility,
  consentDimensions,
  consentStates,
  previewProfileChange,
  type ConsentRule,
} from "./consentEngine.ts";

const ids = {
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  pa: "20000000-0000-4000-8000-000000000001",
  pb: "20000000-0000-4000-8000-000000000002",
};
const now = new Date("2026-07-11T12:00:00Z");
const rule = (state: string, extra = {}) => ({
  dimension: "body_zone",
  value: "shoulders",
  state,
  canReceive: true,
  canOffer: true,
  pressure: "firm",
  maxDurationMinutes: 30,
  ...extra,
});
const profile = (side: "a" | "b", rules: unknown[], extra = {}) => ({
  id: side === "a" ? ids.pa : ids.pb,
  userId: ids[side],
  version: 1,
  createdAt: "2026-07-11T10:00:00Z",
  rules,
  ...extra,
});

for (const left of consentStates)
  for (const right of consentStates)
    test(`${left} + ${right} resolves to the more restrictive state`, () => {
      const result = computeCompatibility(
        profile("a", [rule(left)]),
        profile("b", [rule(right)]),
        now,
      );
      const expected =
        consentStates[
          Math.min(consentStates.indexOf(left), consentStates.indexOf(right))
        ];
      if (expected === "off_limits")
        assert.equal(
          result.excluded.every((item) => item.reason === "off_limits"),
          true,
        );
      else
        assert.equal(
          (expected === "ask_first" ? result.askFirst : result.permitted)
            .length,
          2,
        );
      assert.equal(result.consentGranted, false);
    });
test("receive and offer asymmetry is directional and fail closed", () => {
  const result = computeCompatibility(
    profile("a", [rule("welcomed", { canOffer: false })]),
    profile("b", [rule("welcomed")]),
    now,
  );
  assert.equal(result.permitted.length, 1);
  assert.equal(result.excluded[0]?.reason, "cannot_offer");
});
test("missing, invalid, stale, and contradictory data are excluded", () => {
  assert.equal(
    computeCompatibility(
      profile("a", []),
      profile("b", [rule("welcomed")]),
      now,
    ).excluded[0]?.reason,
    "missing_preference",
  );
  assert.equal(
    computeCompatibility({}, profile("b", []), now).excluded[0]?.reason,
    "invalid_profile",
  );
  assert.equal(
    computeCompatibility(
      profile("a", [], { validUntil: "2026-07-11T11:00:00Z" }),
      profile("b", []),
      now,
    ).excluded[0]?.reason,
    "stale_profile",
  );
  assert.equal(
    computeCompatibility(
      profile("a", [rule("welcomed"), rule("off_limits")]),
      profile("b", [rule("welcomed")]),
      now,
    ).excluded[0]?.reason,
    "contradictory_preference",
  );
});
test("pressure and duration become no broader than either profile", () => {
  const result = computeCompatibility(
    profile("a", [
      rule("welcomed", { pressure: "light", maxDurationMinutes: 10 }),
    ]),
    profile("b", [
      rule("welcomed", { pressure: "firm", maxDurationMinutes: 60 }),
    ]),
    now,
  );
  assert.equal(result.permitted[0]?.pressure, "light");
  assert.equal(result.permitted[0]?.maxDurationMinutes, 10);
});
test("adding any state restriction never broadens overlap", () => {
  const counts = consentStates.map((state) => {
    const result = computeCompatibility(
      profile("a", [rule(state)]),
      profile("b", [rule("welcomed")]),
      now,
    );
    return result.permitted.length + result.askFirst.length;
  });
  assert.deepEqual(counts, [0, 2, 2]);
  assert.equal(
    (counts[0] ?? 0) <= (counts[1] ?? 0) &&
      (counts[1] ?? 0) <= (counts[2] ?? 0),
    true,
  );
});
test("output is deterministic regardless of rule order and contains no private notes", () => {
  const rules = [
    rule("welcomed"),
    { ...rule("welcomed"), dimension: "environment", value: "public_space" },
  ];
  const first = computeCompatibility(
    profile("a", rules, { privateNervousSystemNotes: "never disclose" }),
    profile("b", rules),
    now,
  );
  const second = computeCompatibility(
    profile("a", [...rules].reverse(), {
      privateNervousSystemNotes: "never disclose",
    }),
    profile("b", [...rules].reverse()),
    now,
  );
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first).includes("never disclose"), false);
});

test("preview reports no change when the proposed profile is identical", () => {
  const preview = previewProfileChange(
    profile("a", [rule("welcomed")]),
    profile("a", [rule("welcomed")]),
    profile("b", [rule("welcomed")]),
    now,
  );
  assert.deepEqual(preview, {
    gainedPermitted: [],
    lostPermitted: [],
    gainedAskFirst: [],
    lostAskFirst: [],
  });
});
test("preview reports a loosened rule as newly permitted, not granted consent", () => {
  const preview = previewProfileChange(
    profile("a", [rule("ask_first")]),
    profile("a", [rule("welcomed")]),
    profile("b", [rule("welcomed")]),
    now,
  );
  assert.equal(preview.gainedPermitted.length, 2);
  assert.equal(preview.lostAskFirst.length, 2);
  assert.equal(preview.gainedAskFirst.length, 0);
});
test("preview reports a tightened rule as lost permission", () => {
  const preview = previewProfileChange(
    profile("a", [rule("welcomed")]),
    profile("a", [rule("off_limits")]),
    profile("b", [rule("welcomed")]),
    now,
  );
  assert.equal(preview.lostPermitted.length, 2);
  assert.equal(preview.gainedPermitted.length, 0);
  assert.equal(preview.gainedAskFirst.length, 0);
});
test("preview never reports a gain when the proposed profile is invalid", () => {
  const preview = previewProfileChange(
    profile("a", [rule("welcomed")]),
    { not: "a profile" },
    profile("b", [rule("welcomed")]),
    now,
  );
  assert.equal(preview.lostPermitted.length, 2);
  assert.equal(preview.gainedPermitted.length, 0);
  assert.equal(preview.gainedAskFirst.length, 0);
});

// Property-based coverage required by docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md:
// "Use property-based tests where useful to prove that adding a restriction
// can never broaden the computed overlap." Seeded PRNG keeps runs reproducible.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(random: () => number, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)]!;
}
const values = ["north", "south", "east"] as const;
function randomRule(random: () => number): ConsentRule {
  return {
    dimension: pick(random, consentDimensions),
    value: pick(random, values),
    state: pick(random, consentStates),
    canReceive: random() > 0.2,
    canOffer: random() > 0.2,
    pressure: null,
    maxDurationMinutes: null,
  };
}
function keyOf(item: { dimension: string; value: string; direction?: string }) {
  return `${item.dimension}:${item.value}:${item.direction ?? ""}`;
}
/** Only ever moves a rule toward a stricter, never a looser, boundary. */
function restrictRule(random: () => number, rule: ConsentRule): ConsentRule {
  const stateIndex = consentStates.indexOf(rule.state);
  const moves: Array<() => ConsentRule> = [
    () =>
      stateIndex > 0
        ? { ...rule, state: consentStates[stateIndex - 1]! }
        : rule,
    () => (rule.canReceive ? { ...rule, canReceive: false } : rule),
    () => (rule.canOffer ? { ...rule, canOffer: false } : rule),
  ];
  return pick(random, moves)();
}
test("restricting any rule never broadens permitted or ask-first overlap (property-based)", () => {
  const random = mulberry32(42);
  for (let iteration = 0; iteration < 200; iteration++) {
    const ruleCount = 1 + Math.floor(random() * 5);
    const baseRulesA = Array.from({ length: ruleCount }, () =>
      randomRule(random),
    );
    const rulesB = Array.from({ length: ruleCount }, () => randomRule(random));
    const restrictedRulesA = baseRulesA.map((rule) =>
      restrictRule(random, rule),
    );
    const baseline = computeCompatibility(
      profile("a", baseRulesA),
      profile("b", rulesB),
      now,
    );
    const restricted = computeCompatibility(
      profile("a", restrictedRulesA),
      profile("b", rulesB),
      now,
    );
    const baselineCount = baseline.permitted.length + baseline.askFirst.length;
    const restrictedCount =
      restricted.permitted.length + restricted.askFirst.length;
    assert.ok(
      restrictedCount <= baselineCount,
      `iteration ${iteration}: restricted overlap (${restrictedCount}) exceeded baseline (${baselineCount})`,
    );
    const baselineKeys = new Set(
      [...baseline.permitted, ...baseline.askFirst].map(keyOf),
    );
    for (const item of [...restricted.permitted, ...restricted.askFirst])
      assert.ok(
        baselineKeys.has(keyOf(item)),
        `iteration ${iteration}: restricted overlap introduced a new permission at ${keyOf(item)}`,
      );
  }
});
