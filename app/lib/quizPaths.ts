import {
  quizQuestions,
  type QuizDimension,
  type QuizQuestion,
} from "../data/quiz.ts";

/** One representative scene per major theme for a short, calm pass. */
const SHORT_VIBE_IDS = [
  "q001_environment_1",
  "q011_regulation_1",
  "q021_comfort_1",
  "q031_conversation_1",
  "q041_sensory_1",
  "q051_pacing_1",
  "q061_initiation_1",
  "q071_closeness_1",
  "q081_play_1",
  "q091_repair_1",
] as const;

/**
 * Resolve short vs deep Vibe question sets from the 100-scene bank.
 * Falls back gracefully if ids drift.
 */
export function vibeQuestionsForMode(mode: "short" | "deep"): QuizQuestion[] {
  if (mode === "deep") return quizQuestions;
  const byId = new Map(quizQuestions.map((q) => [q.id, q]));
  const selected = SHORT_VIBE_IDS.map((id) => byId.get(id)).filter(
    (q): q is QuizQuestion => Boolean(q),
  );
  if (selected.length >= 6) return selected;
  // Fallback: first question of each dimension.
  const seen = new Set<QuizDimension>();
  const fallback: QuizQuestion[] = [];
  for (const q of quizQuestions) {
    if (seen.has(q.dimension)) continue;
    seen.add(q.dimension);
    fallback.push(q);
    if (fallback.length >= 9) break;
  }
  return fallback;
}

export function vibeModeLabel(mode: "short" | "deep"): string {
  return mode === "short" ? "Short (about 10 scenes)" : "Deep (100 scenes)";
}
