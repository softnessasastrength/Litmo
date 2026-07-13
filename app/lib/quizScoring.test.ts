import assert from "node:assert/strict";
import test from "node:test";
import { quizQuestions, QUIZ_QUESTION_COUNT } from "../data/quiz.ts";
import {
  QUIZ_MODEL_VERSION,
  accumulateScores,
  mixToPercent,
  normalizeMix,
  runQuizModel,
  scoreQuiz,
  topInsights,
  totalMass,
} from "./quizScoring.ts";

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

test("quiz bank is exactly 100 questions across 10 themes", () => {
  assert.equal(QUIZ_QUESTION_COUNT, 100);
  assert.equal(quizQuestions.length, 100);
  const dims = new Set(quizQuestions.map((q) => q.dimension));
  assert.equal(dims.size, 10);
  const ids = new Set(quizQuestions.map((q) => q.id));
  assert.equal(ids.size, 100);
});

test("normalizeMix and mixToPercent are well-formed", () => {
  const mix = normalizeMix({ hearth: 3, lantern: 1, tidepool: 0 });
  assert.ok(Math.abs(mix.hearth + mix.lantern + mix.tidepool - 1) < 1e-9);
  assert.ok(mix.hearth > mix.lantern);
  const pct = mixToPercent(mix);
  assert.equal(pct.hearth + pct.lantern + pct.tidepool, 100);
});

test("model-heavy full pass produces mix, themes, confidence", () => {
  const sample = quizQuestions.map((q) => ({
    questionId: q.id,
    answerId: q.answers[0]!.id,
    scores: q.answers[0]!.scores,
  }));
  const result = runQuizModel(sample);
  assert.equal(result.modelVersion, QUIZ_MODEL_VERSION);
  assert.equal(result.answeredCount, 100);
  assert.equal(result.themesTouched, 10);
  assert.equal(result.themes.length, 10);
  assert.equal(result.coverage, 1);
  assert.equal(result.confidenceLabel, "full-pass");
  assert.ok(result.modelConfidence >= 0.9);
  assert.equal(
    result.mixPercent.hearth +
      result.mixPercent.lantern +
      result.mixPercent.tidepool,
    100,
  );
  assert.ok(result.primary);
  assert.equal(topInsights(result, 5).length, 5);
  assert.ok(totalMass(result.totals) > 0);
});

test("partial answers lower confidence to sketch or partial", () => {
  const few = quizQuestions.slice(0, 5).map((q) => ({
    questionId: q.id,
    answerId: q.answers[0]!.id,
    scores: q.answers[0]!.scores,
  }));
  const sketch = runQuizModel(few);
  assert.ok(sketch.coverage < 0.1);
  assert.equal(sketch.confidenceLabel, "sketch");

  const mid = quizQuestions.slice(0, 40).map((q) => ({
    questionId: q.id,
    answerId: q.answers[1]!.id,
    scores: q.answers[1]!.scores,
  }));
  const partial = runQuizModel(mid);
  assert.ok(partial.coverage >= 0.25);
  assert.ok(
    partial.confidenceLabel === "partial" ||
      partial.confidenceLabel === "full-pass",
  );
});

test("all-lantern path through every question stays lantern", () => {
  const lanternHeavy = quizQuestions.map((question) => {
    const best =
      question.answers.find((a) => (a.scores.lantern ?? 0) >= 2) ??
      question.answers.reduce((winner, answer) =>
        (answer.scores.lantern ?? 0) > (winner.scores.lantern ?? 0)
          ? answer
          : winner,
      );
    return {
      questionId: question.id,
      answerId: best.id,
      scores: best.scores,
    };
  });
  const result = runQuizModel(lanternHeavy);
  assert.equal(result.primary, "lantern");
  assert.ok(result.mix.lantern >= 0.5);
  assert.ok(accumulateScores(lanternHeavy).lantern > 0);
});

test("unknown question ids still score totals but skip theme coverage", () => {
  const result = runQuizModel([
    {
      questionId: "not-a-real-question",
      answerId: "x",
      scores: { lantern: 99 },
    },
  ]);
  assert.equal(result.primary, "lantern");
  assert.equal(result.answeredCount, 0);
  assert.equal(result.themesTouched, 0);
  assert.ok(totalMass(result.totals) > 0);
});
