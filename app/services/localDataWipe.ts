/**
 * Immediate device-local data wipe (GDPR user control).
 * Does not delete the server account. Prefer request_account_erasure for that queue.
 * Uses the local vault registry so personal domains stay complete.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { localVault, VAULT_SECRET_KEYS } from "./localVault.ts";

/** Preference keys outside the personal vault registry. */
const EXTRA_ASYNC_KEYS = [
  "litmo.quiz.play.progress.v1",
  "litmo.neurodivergent.prefs.v1",
  "litmo.neurodivergent.prefs.v2",
  "litmo.haptics.enabled.v1",
  "litmo.theme.scheme.v1",
  "litmo.privacy.notice.accepted.v1",
  "@litmo/nearby_share_enabled_v1",
  "litmo.proximity.prefs.v1",
  "litmo.trauma_safety.prefs.v1",
  "litmo.trauma_safety.verify.v1",
  "litmo.trauma_safety.reflection.v1",
  "litmo.trauma_safety.reflections.v1",
  /** Exorcism Dojo urge log + burn gates (device-local only; D23 surface). */
  "litmo.dojo.state.v1",
  /** Spooning Protocol history (local practice seals; not skill scores). */
  "litmo.spooning.history.v1",
  /** Morning Cuddle Protocol history (7:42am spiral containment). */
  "litmo.morning_cuddle.history.v1",
  /** Attachment Repair Cathedral history (mommy issues / masochist circuit). */
  "litmo.attachment_repair.history.v1",
];

const EXTRA_SECURE_KEYS = [
  "litmo.quizzes.invites.v2",
  "litmo.quiz.e2e.identity.v2",
  "litmo.quiz.e2e.identity.v3",
  "litmo.quiz.e2e.spk.v2",
  "litmo.quiz.e2e.spk.v3",
  VAULT_SECRET_KEYS.backupMaster,
  "litmo.trauma_safety.prefs.secure.v1",
  "litmo.trauma_safety.verify.secure.v1",
  "litmo.trauma_safety.reflection.secure.v1",
  "litmo.trauma_safety.reflections.secure.v1",
];

export type LocalWipeReport = {
  asyncCleared: string[];
  secureCleared: string[];
  vaultDomainsCleared: string[];
  errors: string[];
};

export async function wipeLocalLitmoData(): Promise<LocalWipeReport> {
  const report: LocalWipeReport = {
    asyncCleared: [],
    secureCleared: [],
    vaultDomainsCleared: [],
    errors: [],
  };

  const vault = await localVault.wipeAllDomains();
  report.vaultDomainsCleared = vault.cleared;
  report.errors.push(...vault.errors.map((d) => `vault:${d}`));

  for (const key of EXTRA_ASYNC_KEYS) {
    try {
      await AsyncStorage.removeItem(key);
      report.asyncCleared.push(key);
    } catch {
      report.errors.push(`async:${key}`);
    }
  }

  for (const key of EXTRA_SECURE_KEYS) {
    try {
      await SecureStore.deleteItemAsync(key);
      report.secureCleared.push(key);
    } catch {
      report.errors.push(`secure:${key}`);
    }
  }

  return report;
}
