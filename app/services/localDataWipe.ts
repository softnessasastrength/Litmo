/**
 * Immediate device-local data wipe (GDPR user control).
 * Does not delete the server account. Prefer request_account_erasure for that queue.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const ASYNC_KEYS = [
  "litmo.quizzes.results.v1",
  "litmo.learning.progress.v1",
  "litmo.quiz.play.progress.v1",
  "litmo.neurodivergent.prefs.v1",
  "litmo.neurodivergent.prefs.v2",
  "litmo.haptics.enabled.v1",
  "litmo.theme.scheme.v1",
  "litmo.privacy.notice.accepted.v1",
];

const SECURE_KEYS = [
  "litmo.quizzes.invites.v2",
  "litmo.quiz.e2e.identity.v2",
  "litmo.quiz.e2e.identity.v3",
  "litmo.quiz.e2e.spk.v2",
  "litmo.quiz.e2e.spk.v3",
];

export type LocalWipeReport = {
  asyncCleared: string[];
  secureCleared: string[];
  errors: string[];
};

export async function wipeLocalLitmoData(): Promise<LocalWipeReport> {
  const report: LocalWipeReport = {
    asyncCleared: [],
    secureCleared: [],
    errors: [],
  };

  for (const key of ASYNC_KEYS) {
    try {
      await AsyncStorage.removeItem(key);
      report.asyncCleared.push(key);
    } catch {
      report.errors.push(`async:${key}`);
    }
  }

  // Best-effort: clear known secure keys + scan invite ratchet prefixes is not
  // possible without listing; clear identity/spk/invites and common prefixes.
  for (const key of SECURE_KEYS) {
    try {
      await SecureStore.deleteItemAsync(key);
      report.secureCleared.push(key);
    } catch {
      report.errors.push(`secure:${key}`);
    }
  }

  // Clear ratchet sessions if invite ids were known — try a short list from
  // residual invite storage already deleted; also wipe by pattern is N/A.
  // Additional secure leftovers fail soft.

  return report;
}
