/**
 * Compatibility surface for quiz scoring.
 * Model-heavy implementation lives in quizModel.ts.
 */
export {
  QUIZ_MODEL_VERSION,
  accumulateScores,
  confidenceCopy,
  mixToPercent,
  normalizeMix,
  rankArchetypes,
  runQuizModel,
  scoreQuiz,
  scoreQuizDetailed,
  topInsights,
  totalMass,
  type AnswerScores,
  type ArchetypeMix,
  type QuizInsight,
  type QuizModelResult,
  type ThemeProfile,
} from "./quizModel.ts";
