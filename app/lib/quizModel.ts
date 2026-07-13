/**
 * Model-heavy vibe scoring (still playful, never clinical).
 *
 * Layers:
 * 1. Raw archetype weights from answers
 * 2. Per-theme (dimension) sub-profiles
 * 3. Normalized mix + blend geometry
 * 4. Coverage / confidence from how much of the bank was answered
 *
 * Explicit non-claims: not personality science, not safety, not consent.
 */

import {
  archetypes,
  quizDimensionLabels,
  quizQuestions,
  type ArchetypeId,
  type QuizDimension,
  type Scores,
} from "../data/quiz.ts";

export const QUIZ_MODEL_VERSION = "vibe-mix-1.0" as const;

export type AnswerScores = {
  questionId: string;
  answerId: string;
  scores: Partial<Scores>;
};

export type QuizInsight = {
  dimension: QuizDimension;
  questionId: string;
  answerId: string;
  text: string;
};

export type ThemeProfile = {
  dimension: QuizDimension;
  label: string;
  totals: Scores;
  /** Dominant lean within this theme, if any mass. */
  lean: ArchetypeId | null;
  /** 0–1 share of that lean within the theme. */
  leanShare: number;
  answeredInTheme: number;
  questionsInTheme: number;
};

export type ArchetypeMix = {
  hearth: number;
  lantern: number;
  tidepool: number;
};

export type QuizModelResult = {
  modelVersion: typeof QUIZ_MODEL_VERSION;
  /** Playful primary label (highest mass, stable ties). */
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  tertiary: ArchetypeId | null;
  totals: Scores;
  /** Unit mix (sums to 1 when any mass; else zeros). */
  mix: ArchetypeMix;
  /** Soft 0–100 display percents (sum ~100). */
  mixPercent: ArchetypeMix;
  isCloseBlend: boolean;
  isTriBlend: boolean;
  blendLabel: string | null;
  themes: ThemeProfile[];
  /** Strongest theme leans matching primary (for copy). */
  signatureThemes: ThemeProfile[];
  insights: QuizInsight[];
  answeredCount: number;
  questionCount: number;
  themesTouched: number;
  /** 0–1 bank coverage (answered / 100). */
  coverage: number;
  /**
   * 0–1 playful “model confidence” from coverage × theme spread.
   * Not statistical confidence — only “how much of the quiz informed this”.
   */
  modelConfidence: number;
  confidenceLabel: "sketch" | "partial" | "full-pass";
};

const tieOrder: ArchetypeId[] = ["hearth", "tidepool", "lantern"];
const allArchetypes = Object.keys(archetypes) as ArchetypeId[];

const emptyScores = (): Scores => ({ hearth: 0, lantern: 0, tidepool: 0 });

const questionsById = new Map(quizQuestions.map((q) => [q.id, q]));

const questionsByDimension = (() => {
  const map = new Map<QuizDimension, typeof quizQuestions>();
  for (const q of quizQuestions) {
    const list = map.get(q.dimension) ?? [];
    list.push(q);
    map.set(q.dimension, list);
  }
  return map;
})();

export function accumulateScores(answers: AnswerScores[]): Scores {
  const totals = emptyScores();
  for (const answer of answers) {
    for (const id of allArchetypes) {
      const points = answer.scores[id];
      if (typeof points === "number" && Number.isFinite(points) && points > 0) {
        totals[id] += points;
      }
    }
  }
  return totals;
}

export function totalMass(totals: Scores): number {
  return allArchetypes.reduce((sum, id) => sum + totals[id], 0);
}

export function normalizeMix(totals: Scores): ArchetypeMix {
  const mass = totalMass(totals);
  if (mass <= 0) return { hearth: 0, lantern: 0, tidepool: 0 };
  return {
    hearth: totals.hearth / mass,
    lantern: totals.lantern / mass,
    tidepool: totals.tidepool / mass,
  };
}

export function mixToPercent(mix: ArchetypeMix): ArchetypeMix {
  const mass = mix.hearth + mix.lantern + mix.tidepool;
  if (mass <= 0) return { hearth: 0, lantern: 0, tidepool: 0 };
  // Largest-remainder so display integers sum to 100.
  const raw = allArchetypes.map((id) => ({
    id,
    value: (mix[id] / mass) * 100,
  }));
  const floors = raw.map((r) => ({
    id: r.id,
    floor: Math.floor(r.value),
    frac: r.value - Math.floor(r.value),
  }));
  let used = floors.reduce((s, r) => s + r.floor, 0);
  const byFrac = [...floors].sort((a, b) => b.frac - a.frac);
  const out: Scores = emptyScores();
  for (const row of floors) out[row.id] = row.floor;
  let i = 0;
  while (used < 100 && i < byFrac.length) {
    out[byFrac[i]!.id] += 1;
    used += 1;
    i += 1;
  }
  return out;
}

export function rankArchetypes(totals: Scores): ArchetypeId[] {
  return [...tieOrder].sort((a, b) => {
    if (totals[b] !== totals[a]) return totals[b] - totals[a];
    return tieOrder.indexOf(a) - tieOrder.indexOf(b);
  });
}

function dominantLean(totals: Scores): {
  lean: ArchetypeId | null;
  share: number;
} {
  const mass = totalMass(totals);
  if (mass <= 0) return { lean: null, share: 0 };
  const ranked = rankArchetypes(totals);
  const lean = ranked[0]!;
  return { lean, share: totals[lean] / mass };
}

function buildThemeProfiles(answers: AnswerScores[]): ThemeProfile[] {
  const byDimAnswers = new Map<QuizDimension, AnswerScores[]>();
  for (const answer of answers) {
    const q = questionsById.get(answer.questionId);
    if (!q) continue;
    const list = byDimAnswers.get(q.dimension) ?? [];
    list.push(answer);
    byDimAnswers.set(q.dimension, list);
  }

  const dims = Object.keys(quizDimensionLabels) as QuizDimension[];
  return dims.map((dimension) => {
    const dimAnswers = byDimAnswers.get(dimension) ?? [];
    const totals = accumulateScores(dimAnswers);
    const { lean, share } = dominantLean(totals);
    const bank = questionsByDimension.get(dimension) ?? [];
    return {
      dimension,
      label: quizDimensionLabels[dimension],
      totals,
      lean,
      leanShare: share,
      answeredInTheme: new Set(dimAnswers.map((a) => a.questionId)).size,
      questionsInTheme: bank.length,
    };
  });
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

function blendLabelFor(
  primary: ArchetypeId,
  secondary: ArchetypeId | null,
  tertiary: ArchetypeId | null,
  isCloseBlend: boolean,
  isTriBlend: boolean,
): string | null {
  if (isTriBlend && secondary && tertiary) {
    return `A three-way weather: ${archetypes[primary].name.replace(/^The\s+/, "")}, ${archetypes[secondary].name.replace(/^The\s+/, "")}, and ${archetypes[tertiary].name.replace(/^The\s+/, "")}`;
  }
  if (!secondary || !isCloseBlend) return null;
  return `${archetypes[primary].name} with a ${archetypes[secondary].name.replace(/^The\s+/, "")} undercurrent`;
}

function confidenceFrom(
  coverage: number,
  themesTouched: number,
): {
  modelConfidence: number;
  confidenceLabel: QuizModelResult["confidenceLabel"];
} {
  const themeFactor = themesTouched / 10;
  const modelConfidence = Math.min(1, coverage * 0.7 + themeFactor * 0.3);
  let confidenceLabel: QuizModelResult["confidenceLabel"] = "sketch";
  if (coverage >= 0.85 && themesTouched >= 8) confidenceLabel = "full-pass";
  else if (coverage >= 0.25 && themesTouched >= 3) confidenceLabel = "partial";
  return { modelConfidence, confidenceLabel };
}

/**
 * Full model pass over answer set.
 * Safe with partial quizzes: only answered items contribute mass.
 */
export function runQuizModel(answers: AnswerScores[]): QuizModelResult {
  // Totals accept any answer scores (tests + forward-compatible payloads).
  // Theme/insight/coverage layers only count questions present in the bank.
  const known = answers.filter((a) => questionsById.has(a.questionId));
  const totals = accumulateScores(answers);
  const mix = normalizeMix(totals);
  const mixPercent = mixToPercent(mix);
  const ranked = rankArchetypes(totals);
  const primary = ranked[0] ?? "hearth";
  const secondary = totals[ranked[1]!] > 0 ? ranked[1]! : null;
  const tertiary = ranked[2] && totals[ranked[2]] > 0 ? ranked[2]! : null;

  const primaryScore = totals[primary];
  const secondaryScore = secondary ? totals[secondary] : 0;
  const tertiaryScore = tertiary ? totals[tertiary] : 0;
  const mass = totalMass(totals);

  const isCloseBlend =
    secondary !== null &&
    primaryScore > 0 &&
    (primaryScore - secondaryScore <= Math.max(6, primaryScore * 0.15) ||
      secondaryScore / primaryScore >= 0.8);

  const isTriBlend =
    mass > 0 &&
    secondary !== null &&
    tertiary !== null &&
    mix[primary] < 0.5 &&
    mix[secondary] >= 0.22 &&
    mix[tertiary] >= 0.18;

  const themes = buildThemeProfiles(known);
  const signatureThemes = themes
    .filter((t) => t.lean === primary && t.answeredInTheme > 0)
    .sort(
      (a, b) =>
        b.leanShare - a.leanShare || b.answeredInTheme - a.answeredInTheme,
    )
    .slice(0, 3);

  const answeredCount = new Set(known.map((a) => a.questionId)).size;
  const questionCount = quizQuestions.length;
  const themesTouched = themes.filter((t) => t.answeredInTheme > 0).length;
  const coverage = questionCount > 0 ? answeredCount / questionCount : 0;
  const { modelConfidence, confidenceLabel } = confidenceFrom(
    coverage,
    themesTouched,
  );

  return {
    modelVersion: QUIZ_MODEL_VERSION,
    primary,
    secondary,
    tertiary,
    totals,
    mix,
    mixPercent,
    isCloseBlend: isCloseBlend || isTriBlend,
    isTriBlend,
    blendLabel: blendLabelFor(
      primary,
      secondary,
      tertiary,
      isCloseBlend,
      isTriBlend,
    ),
    themes,
    signatureThemes,
    insights: insightsFor(known),
    answeredCount,
    questionCount,
    themesTouched,
    coverage,
    modelConfidence,
    confidenceLabel,
  };
}

export function scoreQuiz(answers: AnswerScores[]): ArchetypeId {
  return runQuizModel(answers).primary;
}

/** @deprecated Prefer runQuizModel; kept for call-site compatibility. */
export function scoreQuizDetailed(answers: AnswerScores[]): QuizModelResult {
  return runQuizModel(answers);
}

export function topInsights(result: QuizModelResult, limit = 5): QuizInsight[] {
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

export function confidenceCopy(
  label: QuizModelResult["confidenceLabel"],
): string {
  switch (label) {
    case "sketch":
      return "Early sketch — only a little of the bank informed this weather.";
    case "partial":
      return "Partial pass — several themes spoke; more scenes would refine the mix.";
    case "full-pass":
      return "Full-ish pass — most of the bank informed this playful mix.";
  }
}
