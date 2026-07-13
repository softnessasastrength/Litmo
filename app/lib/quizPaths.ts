/**
 * Quiz path selection for Vibe scenes (short vs deep).
 *
 * Product philosophy:
 * - Quiz results are for the user — not consent, not a safety score
 * - Short path is a calm subset; deep path is the full bank
 * - Fallback preserves one scene per dimension if curated ids drift
 *
 * SEE: app/data/quiz.ts · app/lib/clearLanguage.ts (quizSoftReminder)
 */

import {
  quizQuestions,
  type QuizDimension,
  type QuizQuestion,
} from "../data/quiz.ts";

/**
 * WHAT: Curated question ids for the short (~10 scene) Vibe pass.
 * WHY: One representative scene per major theme for a shorter, calmer path.
 * CONSENT: Completing short or deep path never grants touch or certifies safety.
 * NEVER: Use short-path completion as eligibility for contact.
 */
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
 * WHAT: Resolves short vs deep Vibe question sets from the 100-scene bank.
 * WHY: UI mode switch needs a stable list without re-implementing quiz data.
 * CONSENT: Not a consent surface — selects preference-learning scenes only.
 * EDGE CASES:
 *   - mode "deep" → full quizQuestions
 *   - short path maps SHORT_VIBE_IDS; missing ids filtered out
 *   - if fewer than 6 curated ids resolve → fallback: first question per dimension (max 9)
 * NEVER: Empty list without fallback; never treat results as consent or safety score.
 * SEE: vibeModeLabel · clearLanguage.quizSoftReminder
 */
export function vibeQuestionsForMode(mode: "short" | "deep"): QuizQuestion[] {
  if (mode === "deep") return quizQuestions;
  const byId = new Map(quizQuestions.map((q) => [q.id, q]));
  const selected = SHORT_VIBE_IDS.map((id) => byId.get(id)).filter(
    (q): q is QuizQuestion => Boolean(q),
  );
  // Enough curated hits → use short bank as designed.
  if (selected.length >= 6) return selected;
  // Fallback: first question of each dimension if ids drift after bank edits.
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

/**
 * WHAT: Human label for short vs deep quiz mode.
 * WHY: Settings/onboarding chrome without hardcoding copy in multiple screens.
 * CONSENT: Not a consent surface — display labels only.
 * EDGE CASES: only two modes; no default for other strings (type-narrowed).
 * NEVER: Label must not imply deep path is a safety certification.
 */
export function vibeModeLabel(mode: "short" | "deep"): string {
  return mode === "short" ? "Short (about 10 scenes)" : "Deep (100 scenes)";
}
