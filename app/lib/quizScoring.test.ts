import assert from "node:assert/strict";
import test from "node:test";
import { quizQuestions, QUIZ_QUESTION_COUNT } from "../data/quiz.ts";
import {
  accumulateScores,
  scoreQuiz,
  scoreQuizDetailed,
  topInsights,
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
  for (const q of quizQuestions) {
    assert.equal(q.answers.length, 3, q.id);
    for (const a of q.answers) {
      assert.ok(a.insight.length > 0, a.id);
      assert.ok(a.label.length > 0);
    }
  }
  const ids = new Set(quizQuestions.map((q) => q.id));
  assert.equal(ids.size, 100, "question ids must be unique");
});

test("detailed scoring and light insight diversify", () => {
  const sample = quizQuestions.map((q) => ({
    questionId: q.id,
    answerId: q.answers[0]!.id,
    scores: q.answers[0]!.scores,
  }));
  const result = scoreQuizDetailed(sample);
  assert.equal(result.answeredCount, 100);
  assert.equal(result.questionCount, 100);
  assert.equal(result.themesTouched, 10);
  const tops = topInsights(result, 5);
  assert.equal(tops.length, 5);
  const topDims = new Set(tops.map((t) => t.dimension));
  assert.ok(topDims.size >= 4, "insights should spread across themes");
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
  assert.equal(scoreQuiz(lanternHeavy), "lantern");
  assert.ok(accumulateScores(lanternHeavy).lantern > 0);
});
