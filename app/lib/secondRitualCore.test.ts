import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SECOND_RITUAL_STEPS,
  defaultSecondRitualProgress,
  findSecondRitualStep,
  isRitualComplete,
  markStepComplete,
  nextIncompleteStep,
  parseSecondRitualProgress,
  sharedReassuranceLines,
} from "./secondRitualCore.ts";

describe("second ritual core", () => {
  it("starts with nothing completed and no forced order", () => {
    const p = defaultSecondRitualProgress();
    assert.equal(p.completedSteps.length, 0);
    assert.equal(isRitualComplete(p), false);
    assert.equal(nextIncompleteStep(p)?.id, "check_your_weather");
  });

  it("marking steps out of order is allowed — never a gate", () => {
    let p = defaultSecondRitualProgress();
    p = markStepComplete(p, "name_the_bond");
    assert.ok(p.completedSteps.includes("name_the_bond"));
    assert.equal(nextIncompleteStep(p)?.id, "check_your_weather");
    const again = markStepComplete(p, "name_the_bond");
    assert.equal(again.completedSteps.length, 1);
  });

  it("completes when all four steps are marked, in any order", () => {
    let p = defaultSecondRitualProgress();
    for (const step of [...SECOND_RITUAL_STEPS].reverse()) {
      p = markStepComplete(p, step.id);
    }
    assert.equal(isRitualComplete(p), true);
    assert.equal(nextIncompleteStep(p), null);
  });

  it("findSecondRitualStep returns a real step for every id, each with an href", () => {
    for (const step of SECOND_RITUAL_STEPS) {
      assert.equal(findSecondRitualStep(step.id).id, step.id);
      assert.ok(step.href.startsWith("/"));
    }
  });

  it("parseSecondRitualProgress rejects garbage without throwing", () => {
    assert.equal(parseSecondRitualProgress(null), null);
    assert.equal(parseSecondRitualProgress("nope"), null);
    assert.equal(parseSecondRitualProgress(42), null);
  });

  it("parseSecondRitualProgress drops invalid step ids", () => {
    const parsed = parseSecondRitualProgress({
      completedSteps: ["check_your_weather", "not_a_real_step"],
    });
    assert.ok(parsed);
    assert.deepEqual(parsed!.completedSteps, ["check_your_weather"]);
  });

  it("parseSecondRitualProgress round-trips valid data", () => {
    let p = defaultSecondRitualProgress();
    p = markStepComplete(p, "share_the_map");
    const parsed = parseSecondRitualProgress(JSON.parse(JSON.stringify(p)));
    assert.ok(parsed);
    assert.deepEqual(parsed!.completedSteps, ["share_the_map"]);
  });

  it("shared reassurance lines are generic — no real names", () => {
    const lines = sharedReassuranceLines();
    assert.ok(lines.length > 0);
    for (const line of lines) {
      assert.doesNotMatch(line, /\bRenn\b/);
    }
  });
});
