/**
 * Hybrid quiz-result persistence: device-local always; optional owner-only
 * Supabase backup when authenticated and configured.
 *
 * Partner comparison, seal keys, and invite packages stay device-local only.
 * Server failures never invent results and never block local save.
 */

import { mapExternalError } from "./errors.ts";
import { safeLog } from "./logger.ts";
import {
  mergeQuizResults,
  parseStoredQuizResult,
  resultToServerPayload,
  resultsMapsEqual,
  rowsToQuizResultsMap,
  type QuizResultsMap,
  type StoredQuizResult,
} from "./quizResultsRepositoryCore.ts";
import { quizResultsStore } from "./quizResultsStore.ts";
import { environmentError, supabase } from "./supabase.ts";

const TIMEOUT_MS = 10_000;

async function withTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("request_timeout")),
          TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function tryAuthenticatedUserId(): Promise<string | null> {
  if (environmentError) return null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getSession());
    if (error) return null;
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchOwnRemoteSummaries(): Promise<QuizResultsMap> {
  const { data, error } = await withTimeout(
    supabase
      .from("quiz_result_summaries")
      .select(
        "quiz_id,primary_archetype,secondary_archetype,mix_hearth,mix_lantern,mix_tidepool,insight_notes,mode_label,completed_at",
      ),
  );
  if (error) throw error;
  return rowsToQuizResultsMap(
    (data ?? []) as Parameters<typeof rowsToQuizResultsMap>[0],
  );
}

async function backupResult(result: StoredQuizResult): Promise<void> {
  const payload = resultToServerPayload(result);
  const { error } = await withTimeout(
    supabase.rpc("upsert_own_quiz_result_summary", payload),
  );
  if (error) throw error;
}

async function persistMapLocally(map: QuizResultsMap): Promise<void> {
  // Atomic rewrite so restored remote-only quizzes survive offline.
  await quizResultsStore.replaceAll(map);
}

export type { QuizResultsMap, StoredQuizResult };

export const quizResultsRepository = {
  /**
   * Load local results first. When authenticated + configured, merge any
   * owner-only remote summaries. Invalid remote rows are dropped, never invented.
   */
  async load(): Promise<QuizResultsMap> {
    const local = await quizResultsStore.load();
    const userId = await tryAuthenticatedUserId();
    if (!userId) return local;

    try {
      const remote = await fetchOwnRemoteSummaries();
      const merged = mergeQuizResults(local, remote);
      if (!resultsMapsEqual(local, merged)) {
        await persistMapLocally(merged);
      }
      return merged;
    } catch (error) {
      safeLog("quiz_result_remote_load_failed", {
        errorCode: mapExternalError(error).code,
      });
      return local;
    }
  },

  /**
   * Always saves locally. Best-effort owner backup when signed in; local
   * success is not blocked by remote failure.
   */
  async saveResult(result: StoredQuizResult): Promise<QuizResultsMap> {
    const parsed = parseStoredQuizResult(result);
    if (!parsed) {
      // Fail closed: refuse to persist an invalid summary shape.
      return quizResultsStore.load();
    }

    const next = await quizResultsStore.saveResult(parsed);
    const userId = await tryAuthenticatedUserId();
    if (!userId) return next;

    try {
      await backupResult(parsed);
    } catch (error) {
      safeLog("quiz_result_backup_failed", {
        errorCode: mapExternalError(error).code,
      });
    }
    return next;
  },

  async clearLocal(): Promise<void> {
    await quizResultsStore.clear();
  },
};
