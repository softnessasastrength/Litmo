import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIRST_RITUAL_STEPS,
  defaultFirstRitualProgress,
  findFirstRitualStep,
  firstReassuranceClosing,
  isRitualComplete,
  markStepComplete,
  nextIncompleteStep,
  parseFirstRitualProgress,
  setChosenTrigger,
} from "./firstRitualCore.ts";

describe("first ritual core", () => {
  it("starts with nothing completed and no forced order", () => {
    const p = defaultFirstRitualProgress();
    assert.equal(p.completedSteps.length, 0);
    assert.equal(isRitualComplete(p), false);
    assert.equal(nextIncompleteStep(p)?.id, "name_it");
  });

  it("marking steps out of order is allowed — never a gate", () => {
    let p = defaultFirstRitualProgress();
    p = markStepComplete(p, "the_armor");
    assert.ok(p.completedSteps.includes("the_armor"));
    assert.equal(nextIncompleteStep(p)?.id, "name_it");
    // re-marking is a no-op, not an error
    const again = markStepComplete(p, "the_armor");
    assert.equal(again.completedSteps.length, 1);
  });

  it("completes when all four steps are marked, in any order", () => {
    let p = defaultFirstRitualProgress();
    for (const step of [...FIRST_RITUAL_STEPS].reverse()) {
      p = markStepComplete(p, step.id);
    }
    assert.equal(isRitualComplete(p), true);
    assert.equal(nextIncompleteStep(p), null);
  });

  it("chosen trigger is optional and settable", () => {
    let p = defaultFirstRitualProgress();
    assert.equal(p.chosenTriggerId, null);
    p = setChosenTrigger(p, "after_conflict");
    assert.equal(p.chosenTriggerId, "after_conflict");
    p = setChosenTrigger(p, null);
    assert.equal(p.chosenTriggerId, null);
  });

  it("findFirstRitualStep returns a real step for every id", () => {
    for (const step of FIRST_RITUAL_STEPS) {
      assert.equal(findFirstRitualStep(step.id).id, step.id);
    }
  });

  it("parseFirstRitualProgress rejects garbage without throwing", () => {
    assert.equal(parseFirstRitualProgress(null), null);
    assert.equal(parseFirstRitualProgress("nope"), null);
    assert.equal(parseFirstRitualProgress(42), null);
  });

  it("parseFirstRitualProgress drops invalid step ids and trigger ids", () => {
    const parsed = parseFirstRitualProgress({
      completedSteps: ["name_it", "not_a_real_step", "the_armor"],
      chosenTriggerId: "not_a_real_trigger",
    });
    assert.ok(parsed);
    assert.deepEqual(parsed!.completedSteps, ["name_it", "the_armor"]);
    assert.equal(parsed!.chosenTriggerId, null);
  });

  it("parseFirstRitualProgress round-trips valid data", () => {
    let p = defaultFirstRitualProgress();
    p = markStepComplete(p, "name_it");
    p = setChosenTrigger(p, "delayed_reply");
    const parsed = parseFirstRitualProgress(JSON.parse(JSON.stringify(p)));
    assert.ok(parsed);
    assert.deepEqual(parsed!.completedSteps, ["name_it"]);
    assert.equal(parsed!.chosenTriggerId, "delayed_reply");
  });

  it("closing line never hardcodes a real person's name", () => {
    const generic = firstReassuranceClosing("your partner");
    assert.match(generic, /your partner/);
    assert.doesNotMatch(generic, /\bRenn\b/);
  });
});
