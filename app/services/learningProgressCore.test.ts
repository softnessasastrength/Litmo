import assert from "node:assert/strict";
import test from "node:test";
import {
  clampStepIndex,
  completeModule,
  completionCount,
  parseLearningProgress,
  recordStep,
} from "./learningProgressCore.ts";

test("clamps resume position to the available lesson steps", () => {
  assert.equal(clampStepIndex(-4, 3), 0);
  assert.equal(clampStepIndex(9, 3), 2);
  assert.equal(clampStepIndex(1, 3), 1);
});

test("records progress without erasing other modules", () => {
  const progress = recordStep(
    { first: { stepIndex: 1, completed: true, updatedAt: "earlier" } },
    "second",
    2,
    4,
    "now",
  );
  assert.equal(progress.first.completed, true);
  assert.deepEqual(progress.second, { stepIndex: 2, completed: false, updatedAt: "now" });
});

test("completion is durable and counted", () => {
  const progress = completeModule({}, "soft-signal", 3, "now");
  assert.equal(progress["soft-signal"].stepIndex, 2);
  assert.equal(progress["soft-signal"].completed, true);
  assert.equal(completionCount(progress), 1);
});

test("invalid persisted state fails safely to empty progress", () => {
  assert.deepEqual(parseLearningProgress("not-json"), {});
  assert.deepEqual(parseLearningProgress("[]"), {});
  assert.deepEqual(parseLearningProgress(null), {});
});
