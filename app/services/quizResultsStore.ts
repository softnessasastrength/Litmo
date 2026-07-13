import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QuizCatalogId } from "../data/quizCatalog.ts";
import type { ArchetypeId } from "../data/quiz.ts";

const STORAGE_KEY = "litmo.quizzes.results.v1";

export type StoredQuizResult = {
  quizId: QuizCatalogId;
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  mixPercent: { hearth: number; lantern: number; tidepool: number };
  notes: string[];
  completedAt: string;
  modeLabel?: string;
};

export type QuizResultsMap = Partial<Record<QuizCatalogId, StoredQuizResult>>;

function parse(raw: string | null): QuizResultsMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as QuizResultsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const quizResultsStore = {
  async load(): Promise<QuizResultsMap> {
    return parse(await AsyncStorage.getItem(STORAGE_KEY));
  },
  async saveResult(result: StoredQuizResult): Promise<QuizResultsMap> {
    const current = await this.load();
    const next = { ...current, [result.quizId]: result };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
