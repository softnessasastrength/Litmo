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
  isCloseBlend: boolean;
  blendLabel: string | null;
  insights: QuizInsight[];
  answeredCount: number;
  questionCount: number;
  /** 1–10 section completion based on answered dimensions. */
  themesTouched: number;
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
  const isCloseBlend =
    hasSecondary &&
    primaryScore > 0 &&
    (primaryScore - secondaryScore <= Math.max(6, primaryScore * 0.15) ||
      secondaryScore / primaryScore >= 0.8);

  const secondary = hasSecondary ? secondaryCandidate : null;
  const themes = new Set(
    answers
      .map((a) => quizQuestions.find((q) => q.id === a.questionId)?.dimension)
      .filter(Boolean),
  );

  return {
    primary,
    secondary,
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
    themesTouched: themes.size,
  };
}

/** Keep reveal light even with 100 answers. */
export function topInsights(result: QuizResult, limit = 5): QuizInsight[] {
  // Prefer one insight per dimension when possible.
  const seen = new Set<QuizDimension>();
  const diversified: QuizInsight[] = [];
  for (const insight of result.insights) {
    if (seen.has(insight.dimension)) continue;
    seen.add(insight.dimension);
    diversified.push(insight);
    if (diversified.length >= limit) return diversified;
  }
  for (const insight of result.insights) {
    if (diversified.includes(insight)) continue;
    diversified.push(insight);
    if (diversified.length >= limit) break;
  }
  return diversified;
}
