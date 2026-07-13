import {
  parseQuizResultsMap,
  parseStoredQuizResult,
  type QuizResultsMap,
  type StoredQuizResult,
} from "./quizResultsRepositoryCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";

export type { QuizResultsMap, StoredQuizResult };

/** Device-local quiz summaries via local vault (offline first). */
export const quizResultsStore = {
  async load(): Promise<QuizResultsMap> {
    const raw = await localVault.getRaw("quiz_results");
    return parseQuizResultsMap(raw);
  },
  async saveResult(result: StoredQuizResult): Promise<QuizResultsMap> {
    const parsed = parseStoredQuizResult(result);
    if (!parsed) return this.load();
    const current = await this.load();
    const next = { ...current, [parsed.quizId]: parsed };
    await localVault.setJson("quiz_results", next);
    void localFirstCoordinator.afterLocalWrite("quiz_results");
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
      await localVault.remove("quiz_results");
      return {};
    }
    await localVault.setJson("quiz_results", next);
    void localFirstCoordinator.afterLocalWrite("quiz_results");
    return next;
  },
  async clear(): Promise<void> {
    await localVault.remove("quiz_results");
  },
};
