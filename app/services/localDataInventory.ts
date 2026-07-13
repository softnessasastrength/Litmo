/**
 * Device-local categories for export/portability transparency.
 * Never includes E2E private keys or raw Keychain secrets.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type LocalInventory = {
  collected_at: string;
  quiz_results_present: boolean;
  quiz_result_count: number;
  learning_modules_with_progress: number;
  learning_modules_completed: number;
  mid_quiz_progress_keys: number;
  partner_invites_present: boolean;
  neurodivergent_mode_enabled: boolean | null;
  privacy_notice_local: { version: string; acceptedAt: string } | null;
  notes: string[];
};

export async function collectLocalInventory(): Promise<LocalInventory> {
  const notes: string[] = [
    "Device-local only. Private encryption keys are never exported.",
    "Partner E2E ratchet secrets are not included.",
  ];

  let quiz_results_present = false;
  let quiz_result_count = 0;
  try {
    const raw = await AsyncStorage.getItem("litmo.quizzes.results.v1");
    if (raw) {
      const map = JSON.parse(raw) as Record<string, unknown>;
      quiz_result_count = Object.keys(map).length;
      quiz_results_present = quiz_result_count > 0;
    }
  } catch {
    notes.push("quiz_results_unreadable");
  }

  let learning_modules_with_progress = 0;
  let learning_modules_completed = 0;
  try {
    const raw = await AsyncStorage.getItem("litmo.learning.progress.v1");
    if (raw) {
      const map = JSON.parse(raw) as Record<
        string,
        { completed?: boolean }
      >;
      const keys = Object.keys(map);
      learning_modules_with_progress = keys.length;
      learning_modules_completed = keys.filter((k) => map[k]?.completed).length;
    }
  } catch {
    notes.push("learning_progress_unreadable");
  }

  let mid_quiz_progress_keys = 0;
  try {
    const raw = await AsyncStorage.getItem("litmo.quiz.play.progress.v1");
    if (raw) {
      const map = JSON.parse(raw) as Record<string, unknown>;
      mid_quiz_progress_keys = Object.keys(map).length;
    }
  } catch {
    notes.push("play_progress_unreadable");
  }

  let partner_invites_present = false;
  try {
    const raw = await SecureStore.getItemAsync("litmo.quizzes.invites.v2");
    if (raw) {
      const list = JSON.parse(raw) as unknown[];
      partner_invites_present = Array.isArray(list) && list.length > 0;
    }
  } catch {
    notes.push("invites_unreadable");
  }

  let neurodivergent_mode_enabled: boolean | null = null;
  try {
    const raw =
      (await AsyncStorage.getItem("litmo.neurodivergent.prefs.v2")) ??
      (await AsyncStorage.getItem("litmo.neurodivergent.prefs.v1"));
    if (raw) {
      const p = JSON.parse(raw) as { enabled?: boolean };
      neurodivergent_mode_enabled = Boolean(p.enabled);
    }
  } catch {
    notes.push("nd_prefs_unreadable");
  }

  let privacy_notice_local: LocalInventory["privacy_notice_local"] = null;
  try {
    const raw = await AsyncStorage.getItem("litmo.privacy.notice.accepted.v1");
    if (raw) {
      const p = JSON.parse(raw) as { version?: string; acceptedAt?: string };
      if (p.version && p.acceptedAt) {
        privacy_notice_local = {
          version: p.version,
          acceptedAt: p.acceptedAt,
        };
      }
    }
  } catch {
    notes.push("privacy_notice_unreadable");
  }

  return {
    collected_at: new Date().toISOString(),
    quiz_results_present,
    quiz_result_count,
    learning_modules_with_progress,
    learning_modules_completed,
    mid_quiz_progress_keys,
    partner_invites_present,
    neurodivergent_mode_enabled,
    privacy_notice_local,
    notes,
  };
}
