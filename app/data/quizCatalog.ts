import type { QuizQuestion } from "./quiz.ts";
import { selfQuizQuestions, type SelfQuizId } from "./selfQuizzes.ts";
import { vibeQuestionsForMode } from "../lib/quizPaths.ts";

export type QuizCatalogId = "vibe-short" | "vibe-deep" | SelfQuizId;

export type QuizCatalogEntry = {
  id: QuizCatalogId;
  family: "vibe" | "self";
  title: string;
  summary: string;
  minutes: number;
  shareable: boolean;
  /** Never used as consent, safety, or competence proof. */
  disclaimer: string;
  questions: () => QuizQuestion[];
};

const sharedDisclaimer =
  "Playful self-understanding only. Never a diagnosis, safety rating, or consent to touch.";

export const quizCatalog: QuizCatalogEntry[] = [
  {
    id: "vibe-short",
    family: "vibe",
    title: "Vibe Quiz — Short",
    summary:
      "About ten calm scenes — one soft pass across social weather themes, including mends.",
    minutes: 5,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => vibeQuestionsForMode("short"),
  },
  {
    id: "vibe-deep",
    family: "vibe",
    title: "Vibe Quiz — Deep",
    summary:
      "One hundred light scenes for a fuller weather mix. Save and resume anytime.",
    minutes: 35,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => vibeQuestionsForMode("deep"),
  },
  {
    id: "soft-capacity",
    family: "self",
    title: "Soft Capacity",
    summary: "How you notice energy, protect rest, and name “enough.”",
    minutes: 4,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => selfQuizQuestions["soft-capacity"],
  },
  {
    id: "boundary-voice",
    family: "self",
    title: "Boundary Voice",
    summary: "How you practice naming limits with warmth and clarity.",
    minutes: 4,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => selfQuizQuestions["boundary-voice"],
  },
  {
    id: "comfort-care",
    family: "self",
    title: "Comfort & Care",
    summary: "What settles you, and how you naturally offer care.",
    minutes: 4,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => selfQuizQuestions["comfort-care"],
  },
  {
    id: "connection-pace",
    family: "self",
    title: "Connection Pace",
    summary: "Your preferred tempo for closeness, texting, and reentry.",
    minutes: 4,
    shareable: true,
    disclaimer: sharedDisclaimer,
    questions: () => selfQuizQuestions["connection-pace"],
  },
];

export function getQuizEntry(id: string): QuizCatalogEntry | undefined {
  return quizCatalog.find((q) => q.id === id);
}
