import assert from "node:assert/strict";
import test from "node:test";
import { scoreQuiz } from "./quizScoring.ts";
test("returns the strongest deterministic score", () =>
  assert.equal(
    scoreQuiz([
      { questionId: "1", answerId: "a", scores: { lantern: 2 } },
      { questionId: "2", answerId: "b", scores: { lantern: 1, hearth: 1 } },
    ]),
    "lantern",
  ));
test("uses a stable tie order", () =>
  assert.equal(
    scoreQuiz([
      { questionId: "1", answerId: "a", scores: { tidepool: 2 } },
      { questionId: "2", answerId: "b", scores: { hearth: 2 } },
    ]),
    "hearth",
  ));
test("empty and invalid values return the default", () => {
  assert.equal(scoreQuiz([]), "hearth");
  assert.equal(
    scoreQuiz([
      {
        questionId: "1",
        answerId: "a",
        scores: { lantern: Number.NaN, tidepool: -2 },
      },
    ]),
    "hearth",
  );
});
