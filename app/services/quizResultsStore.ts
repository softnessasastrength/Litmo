import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  parseQuizResultsMap,
  parseStoredQuizResult,
  type QuizResultsMap,
  type StoredQuizResult,
} from "./quizResultsRepositoryCore.ts";

const STORAGE_KEY = "litmo.quizzes.results.v1";
const SECURE_KEY = "litmo.quizzes.results.secure.v1";

export type { QuizResultsMap, StoredQuizResult };

/**
 * Prefer Secure Store for quiz summaries (real-device private).
 * Fall back to AsyncStorage when Secure Store is unavailable (web/tests).
 */
async function readRaw(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(SECURE_KEY);
    if (secure != null) return secure;
  } catch {
    // Secure Store may be unavailable in some environments.
  }
  return AsyncStorage.getItem(STORAGE_KEY);
}

async function writeRaw(value: string): Promise<void> {
  let secured = false;
  try {
    await SecureStore.setItemAsync(SECURE_KEY, value);
    secured = true;
  } catch {
    secured = false;
  }
  if (secured) {
    // Drop legacy plaintext once secured.
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
}

async function clearRaw(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Device-local layer. Prefer quizResultsRepository for callers. */
export const quizResultsStore = {
  async load(): Promise<QuizResultsMap> {
    return parseQuizResultsMap(await readRaw());
  },
  async saveResult(result: StoredQuizResult): Promise<QuizResultsMap> {
    const parsed = parseStoredQuizResult(result);
    if (!parsed) return this.load();
    const current = await this.load();
    const next = { ...current, [parsed.quizId]: parsed };
    await writeRaw(JSON.stringify(next));
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
      await clearRaw();
      return {};
    }
    await writeRaw(JSON.stringify(next));
    return next;
  },
  async clear(): Promise<void> {
    await clearRaw();
  },
};
