/**
 * Device-local categories for export/portability transparency.
 * Never includes E2E private keys or raw Keychain secrets.
 * Never includes Exorcism Dojo urge fear text — counts/flags only.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  summarizeDojoForInventory,
  type DojoInventorySummary,
} from "../lib/dojoCore.ts";
import { localVault } from "./localVault.ts";
import { encryptedCloudBackupService } from "./encryptedCloudBackupService.ts";
import {
  DOJO_STATE_STORAGE_KEY,
  dojoStore,
} from "./dojoStore.ts";
import { summarizeHistory } from "../lib/spooningCore.ts";
import { spooningStore } from "./spooningStore.ts";
import { summarizeMorningHistory } from "../lib/morningCuddleCore.ts";
import { morningCuddleStore } from "./morningCuddleStore.ts";

export type LocalInventory = {
  collected_at: string;
  offline_ready: true;
  local_first: true;
  vault_domains_present: string[];
  quiz_results_present: boolean;
  quiz_result_count: number;
  learning_modules_with_progress: number;
  learning_modules_completed: number;
  mid_quiz_progress_keys: number;
  partner_invites_present: boolean;
  touch_language_present: boolean;
  consent_declaration_present: boolean;
  consent_mutual_present: boolean;
  soft_signal_log_present: boolean;
  private_history_present: boolean;
  encrypted_backup_enabled: boolean;
  neurodivergent_mode_enabled: boolean | null;
  nearby_share_enabled: boolean | null;
  privacy_notice_local: { version: string; acceptedAt: string } | null;
  /** Dojo ritual state — flags/counts only; never urge free-text. */
  dojo: DojoInventorySummary;
  /** Spooning history — counts only; never anxiety/debrief free-text. */
  spooning: {
    history_present: boolean;
    spoon_count: number;
    soft_signal_exits: number;
  };
  /** Morning cuddle history — counts only. */
  morning_cuddle: {
    history_present: boolean;
    session_count: number;
    soft_signal_exits: number;
    no_spiral_plus: number;
  };
  notes: string[];
};

export async function collectLocalInventory(): Promise<LocalInventory> {
  const notes: string[] = [
    "Local-first: personal data is authoritative on this device.",
    "Device-local only in this inventory. Private encryption keys are never exported.",
    "Partner E2E ratchet secrets are not included.",
    "Optional cloud backup stores opaque ciphertext only when you enable it.",
  ];

  const vaultInv = await localVault.inventory();
  const vault_domains_present = vaultInv
    .filter((v) => v.present)
    .map((v) => v.domain);

  let quiz_result_count = 0;
  try {
    const raw = await localVault.getJson<Record<string, unknown>>("quiz_results");
    if (raw && typeof raw === "object") {
      quiz_result_count = Object.keys(raw).length;
    }
  } catch {
    notes.push("quiz_results_unreadable");
  }

  let learning_modules_with_progress = 0;
  let learning_modules_completed = 0;
  try {
    const raw = await localVault.getJson<
      Record<string, { completed?: boolean }>
    >("learning_progress");
    if (raw) {
      const keys = Object.keys(raw);
      learning_modules_with_progress = keys.length;
      learning_modules_completed = keys.filter((k) => raw[k]?.completed).length;
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

  let nearby_share_enabled: boolean | null = null;
  try {
    const raw = await AsyncStorage.getItem("@litmo/nearby_share_enabled_v1");
    if (raw === null) nearby_share_enabled = false;
    else nearby_share_enabled = raw === "1" || raw === "true";
  } catch {
    notes.push("nearby_share_pref_unreadable");
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

  let encrypted_backup_enabled = false;
  try {
    const status = await encryptedCloudBackupService.status();
    encrypted_backup_enabled = status.enabled;
  } catch {
    notes.push("backup_status_unreadable");
  }

  let dojo: DojoInventorySummary = summarizeDojoForInventory(null);
  try {
    const present = await dojoStore.hasStoredState();
    if (present) {
      const state = await dojoStore.load();
      dojo = summarizeDojoForInventory(state);
    }
  } catch {
    notes.push("dojo_state_unreadable");
    try {
      const raw = await AsyncStorage.getItem(DOJO_STATE_STORAGE_KEY);
      if (raw) {
        notes.push("dojo_state_key_present_but_unparsed");
      }
    } catch {
      /* ignore secondary */
    }
  }

  notes.push(
    "Nearby share payloads are ephemeral and never stored in this inventory.",
  );
  notes.push(
    "Dojo inventory is flags/counts only; urge fear sentences stay on-device and are wiped with litmo.dojo.state.v1.",
  );

  let spooning: LocalInventory["spooning"] = {
    history_present: false,
    spoon_count: 0,
    soft_signal_exits: 0,
  };
  try {
    const spoons = await spooningStore.load();
    const s = summarizeHistory(spoons);
    spooning = {
      history_present: s.total > 0,
      spoon_count: s.total,
      soft_signal_exits: s.soft_signal_exits,
    };
  } catch {
    notes.push("spooning_history_unreadable");
  }
  notes.push(
    "Spooning inventory is counts only; anxiety/debrief free-text wiped with litmo.spooning.history.v1.",
  );

  let morning_cuddle: LocalInventory["morning_cuddle"] = {
    history_present: false,
    session_count: 0,
    soft_signal_exits: 0,
    no_spiral_plus: 0,
  };
  try {
    const mornings = await morningCuddleStore.load();
    const m = summarizeMorningHistory(mornings);
    morning_cuddle = {
      history_present: m.total > 0,
      session_count: m.total,
      soft_signal_exits: m.soft_signal_exits,
      no_spiral_plus: m.no_spiral_plus,
    };
  } catch {
    notes.push("morning_cuddle_history_unreadable");
  }

  return {
    collected_at: new Date().toISOString(),
    offline_ready: true,
    local_first: true,
    vault_domains_present,
    quiz_results_present: quiz_result_count > 0,
    quiz_result_count,
    learning_modules_with_progress,
    learning_modules_completed,
    mid_quiz_progress_keys,
    partner_invites_present,
    touch_language_present: vault_domains_present.includes("touch_language"),
    consent_declaration_present: vault_domains_present.includes(
      "consent_declaration",
    ),
    consent_mutual_present: vault_domains_present.includes("consent_mutual"),
    soft_signal_log_present: vault_domains_present.includes("soft_signal_log"),
    private_history_present: vault_domains_present.includes("private_history"),
    encrypted_backup_enabled,
    neurodivergent_mode_enabled,
    nearby_share_enabled,
    privacy_notice_local,
    dojo,
    spooning,
    morning_cuddle,
    notes,
  };
}
