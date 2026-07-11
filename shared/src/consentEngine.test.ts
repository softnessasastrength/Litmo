import assert from "node:assert/strict";
import test from "node:test";
import { computeCompatibility, consentStates } from "./consentEngine.ts";

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
