/**
 * Mid-quiz save/resume for Neurodivergent Mode and anyone who needs a pause.
 * Device-local only. Never uploaded. Never treated as a completed result.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuizCatalogId } from "../data/quizCatalog.ts";
import type { AnswerScores } from "../lib/quizScoring.ts";

const KEY = "litmo.quiz.play.progress.v1";

export type QuizPlayProgress = {
  quizId: QuizCatalogId;
  index: number;
  answers: AnswerScores[];
  updatedAt: string;
};

type ProgressMap = Record<string, QuizPlayProgress>;

async function loadMap(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveMap(map: ProgressMap): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Fail soft — quiz still works without resume.
  }
}

export const quizPlayProgress = {
  async get(quizId: string): Promise<QuizPlayProgress | null> {
    const map = await loadMap();
    const row = map[quizId];
    if (!row || !Array.isArray(row.answers)) return null;
    if (typeof row.index !== "number" || row.index < 0) return null;
    return row;
  },

  async save(progress: QuizPlayProgress): Promise<void> {
    const map = await loadMap();
    map[progress.quizId] = progress;
    await saveMap(map);
  },

  async clear(quizId: string): Promise<void> {
    const map = await loadMap();
    delete map[quizId];
    await saveMap(map);
  },
};
