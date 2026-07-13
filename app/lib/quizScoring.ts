import {
  archetypes,
  quizQuestions,
  type ArchetypeId,
  type QuizDimension,
  type Scores,
} from "../data/quiz.ts";

export type AnswerScores = {
  questionId: string;
  answerId: string;
  scores: Partial<Scores>;
};

/** Stable tie-break: hearth > tidepool > lantern when totals are equal. */
const tieOrder: ArchetypeId[] = ["hearth", "tidepool", "lantern"];

const emptyScores = (): Scores => ({ hearth: 0, lantern: 0, tidepool: 0 });

export type QuizInsight = {
  dimension: QuizDimension;
  questionId: string;
  answerId: string;
  text: string;
};

export type QuizResult = {
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  totals: Scores;
  /** True when primary leads secondary by a thin margin. */
  isCloseBlend: boolean;
  blendLabel: string | null;
  insights: QuizInsight[];
  answeredCount: number;
  questionCount: number;
};

export function accumulateScores(answers: AnswerScores[]): Scores {
  const totals = emptyScores();
  for (const answer of answers) {
    for (const id of Object.keys(archetypes) as ArchetypeId[]) {
      const points = answer.scores[id];
      if (typeof points === "number" && Number.isFinite(points) && points > 0) {
        totals[id] += points;
      }
    }
  }
  return totals;
}

export function rankArchetypes(totals: Scores): ArchetypeId[] {
  return [...tieOrder].sort((a, b) => {
    if (totals[b] !== totals[a]) return totals[b] - totals[a];
    return tieOrder.indexOf(a) - tieOrder.indexOf(b);
  });
}

export function scoreQuiz(answers: AnswerScores[]): ArchetypeId {
  return scoreQuizDetailed(answers).primary;
}

function blendLabelFor(
  primary: ArchetypeId,
  secondary: ArchetypeId | null,
  isCloseBlend: boolean,
): string | null {
  if (!secondary || !isCloseBlend) return null;
  return `${archetypes[primary].name} with a ${archetypes[secondary].name.replace(/^The\s+/, "")} undercurrent`;
}

function insightsFor(answers: AnswerScores[]): QuizInsight[] {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const insights: QuizInsight[] = [];
  for (const question of quizQuestions) {
    const chosen = byQuestion.get(question.id);
    if (!chosen) continue;
    const answer = question.answers.find((item) => item.id === chosen.answerId);
    if (!answer?.insight) continue;
    insights.push({
      dimension: question.dimension,
      questionId: question.id,
      answerId: answer.id,
      text: answer.insight,
    });
  }
  return insights;
}

/**
 * Full quiz result for richer reveal UI.
 * Still non-clinical: totals are playful weights, not measurements of character.
 */
export function scoreQuizDetailed(answers: AnswerScores[]): QuizResult {
  const totals = accumulateScores(answers);
  const ranked = rankArchetypes(totals);
  const primary = ranked[0] ?? "hearth";
  const secondaryCandidate = ranked[1] ?? null;
  const primaryScore = totals[primary];
  const secondaryScore = secondaryCandidate ? totals[secondaryCandidate] : 0;
  const hasSecondary =
    secondaryCandidate !== null &&
    secondaryScore > 0 &&
    secondaryCandidate !== primary;
  /** Close if secondary is within 25% of primary, or absolute gap ≤ 3 with both > 0. */
  const isCloseBlend =
    hasSecondary &&
    primaryScore > 0 &&
    (primaryScore - secondaryScore <= 3 ||
      secondaryScore / primaryScore >= 0.75);

  const secondary = hasSecondary ? secondaryCandidate : null;

  return {
    primary,
    secondary: isCloseBlend ? secondary : secondaryScore > 0 ? secondary : null,
    totals,
    isCloseBlend,
    blendLabel: blendLabelFor(
      primary,
      isCloseBlend ? secondary : null,
      isCloseBlend,
    ),
    insights: insightsFor(answers),
    answeredCount: new Set(answers.map((a) => a.questionId)).size,
    questionCount: quizQuestions.length,
  };
}

/** Top insights for display (cap keeps the reveal scannable). */
export function topInsights(result: QuizResult, limit = 5): QuizInsight[] {
  return result.insights.slice(0, limit);
}
