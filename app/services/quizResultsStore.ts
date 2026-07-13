import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseQuizResultsMap,
  parseStoredQuizResult,
  type QuizResultsMap,
  type StoredQuizResult,
} from "./quizResultsRepositoryCore.ts";

const STORAGE_KEY = "litmo.quizzes.results.v1";

export type { QuizResultsMap, StoredQuizResult };

/** Device-local AsyncStorage layer. Prefer quizResultsRepository for callers. */
export const quizResultsStore = {
  async load(): Promise<QuizResultsMap> {
    return parseQuizResultsMap(await AsyncStorage.getItem(STORAGE_KEY));
  },
  async saveResult(result: StoredQuizResult): Promise<QuizResultsMap> {
    const parsed = parseStoredQuizResult(result);
    if (!parsed) return this.load();
    const current = await this.load();
    const next = { ...current, [parsed.quizId]: parsed };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },
  /** Atomic full-map replace after fail-closed parse of every entry. */
  async replaceAll(map: QuizResultsMap): Promise<QuizResultsMap> {
    const next: QuizResultsMap = {};
    for (const value of Object.values(map)) {
      const parsed = parseStoredQuizResult(value);
      if (parsed) next[parsed.quizId] = parsed;
    }
    if (Object.keys(next).length === 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return {};
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
