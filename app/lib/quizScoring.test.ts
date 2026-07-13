import assert from "node:assert/strict";
import test from "node:test";
import { quizQuestions } from "../data/quiz.ts";
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

test("quiz content covers the intended preference dimensions", () => {
  assert.ok(
    quizQuestions.length >= 14,
    "expected a comprehensive question set",
  );
  const dimensions = new Set(quizQuestions.map((q) => q.dimension));
  for (const required of [
    "environment",
    "regulation",
    "comfort",
    "conversation",
    "sensory",
    "pacing",
    "initiation",
    "closeness",
    "play",
    "repair",
  ] as const) {
    assert.ok(dimensions.has(required), `missing dimension ${required}`);
  }
  for (const question of quizQuestions) {
    assert.ok(question.answers.length >= 3, `${question.id} needs options`);
    for (const answer of question.answers) {
      assert.ok(answer.insight.trim().length > 0, `${answer.id} needs insight`);
      const total = Object.values(answer.scores).reduce(
        (sum, n) => sum + (n ?? 0),
        0,
      );
      assert.ok(total > 0, `${answer.id} must score at least one archetype`);
    }
  }
});

test("detailed scoring reports secondary blend when close", () => {
  const answers = [
    { questionId: "a", answerId: "1", scores: { hearth: 4 } },
    { questionId: "b", answerId: "2", scores: { lantern: 3 } },
    { questionId: "c", answerId: "3", scores: { hearth: 1, lantern: 1 } },
  ];
  const result = scoreQuizDetailed(answers);
  assert.equal(result.primary, "hearth");
  assert.equal(result.secondary, "lantern");
  assert.equal(result.isCloseBlend, true);
  assert.ok(result.blendLabel?.includes("Gentle Hearth"));
  assert.equal(accumulateScores(answers).hearth, 5);
});

test("detailed scoring still returns secondary when not a close blend", () => {
  const result = scoreQuizDetailed([
    { questionId: "a", answerId: "1", scores: { tidepool: 10 } },
    { questionId: "b", answerId: "2", scores: { hearth: 1 } },
  ]);
  assert.equal(result.primary, "tidepool");
  assert.equal(result.secondary, "hearth");
  assert.equal(result.isCloseBlend, false);
  assert.equal(result.blendLabel, null);
});

test("insights resolve from real quiz answer ids", () => {
  const sample = quizQuestions.slice(0, 3).map((question) => {
    const answer = question.answers[0]!;
    return {
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    };
  });
  const result = scoreQuizDetailed(sample);
  assert.equal(result.insights.length, 3);
  assert.equal(topInsights(result, 2).length, 2);
  assert.ok(result.insights.every((item) => item.text.length > 0));
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
});
