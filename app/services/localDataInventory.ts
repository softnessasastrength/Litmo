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
import { summarizeRepairHistory } from "../lib/attachmentRepairCore.ts";
import { attachmentRepairStore } from "./attachmentRepairStore.ts";
import { summarizeConflictHistory } from "../lib/conflictSimCore.ts";
import { conflictSimStore } from "./conflictSimStore.ts";
import { summarizeInterestHistory } from "../lib/interestReCore.ts";
import { interestReStore } from "./interestReStore.ts";
import { summarizeNotReadyHistory } from "../lib/notReadyYetCore.ts";
import { notReadyYetStore } from "./notReadyYetStore.ts";
import { summarizePatterns } from "../lib/tooMuchCore.ts";
import { tooMuchStore } from "./tooMuchStore.ts";
import { summarizeNeedScared } from "../lib/needScaredCore.ts";
import { needScaredStore } from "./needScaredStore.ts";
import { summarizeWeather } from "../lib/weatherCore.ts";
import { weatherStore } from "./weatherStore.ts";
import { summarizePreRenn } from "../lib/preRennGateCore.ts";
import { preRennGateStore } from "./preRennGateStore.ts";
import { summarizeAftercare } from "../lib/aftercareCore.ts";
import { aftercareStore } from "./aftercareStore.ts";
import { summarizeFlood } from "../lib/floodProtocolCore.ts";
import { floodProtocolStore } from "./floodProtocolStore.ts";
import { summarizeApology } from "../lib/apologyCraftCore.ts";
import { apologyCraftStore } from "./apologyCraftStore.ts";
import { summarizeFieldNotes } from "../lib/fieldNotesCore.ts";
import { fieldNotesStore } from "./fieldNotesStore.ts";
import { summarizeReconcile } from "../lib/reconcileCore.ts";
import { reconcileStore } from "./reconcileStore.ts";
import { summarizeParallel } from "../lib/parallelPlayCore.ts";
import { parallelPlayStore } from "./parallelPlayStore.ts";
import { summarizeDebriefs } from "../lib/privateDebriefCore.ts";
import { privateDebriefStore } from "./privateDebriefStore.ts";
import {
  relationshipConstitutionStore,
  REL_CONSTITUTION_KEY,
} from "./relationshipConstitutionStore.ts";
import {
  masochistModeStore,
  MASOCHIST_MODE_KEY,
} from "./masochistModeStore.ts";
import { relationshipModelStore } from "./relationshipModelStore.ts";
import { firstRitualStore } from "./firstRitualStore.ts";
import { secondRitualStore } from "./secondRitualStore.ts";
import { lettersToHimStore } from "./lettersToHimStore.ts";
import { traumaSafetyStore } from "./traumaSafetyStore.ts";

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
  attachment_repair: {
    history_present: boolean;
    session_count: number;
    soft_signal_exits: number;
  };
  conflict_sim: {
    history_present: boolean;
    session_count: number;
    soft_signal_exits: number;
    reschedule_count: number;
  };
  interest_re: {
    history_present: boolean;
    session_count: number;
    performing_count: number;
    soft_signal_exits: number;
  };
  not_ready_yet: {
    history_present: boolean;
    session_count: number;
    soft_signal_exits: number;
    im_up_count: number;
  };
  too_much: {
    history_present: boolean;
    session_count: number;
    flooded_count: number;
    soft_signal_exits: number;
  };
  need_scared: {
    history_present: boolean;
    session_count: number;
    held_both: number;
    soft_signal_exits: number;
  };
  weather: {
    history_present: boolean;
    total: number;
    avg_anxiety: number | null;
    avg_capacity: number | null;
  };
  pre_renn: {
    history_present: boolean;
    total: number;
    honored_delay: number;
    soft_signal: number;
  };
  aftercare: {
    history_present: boolean;
    total: number;
    soft_signal: number;
    settled: number;
  };
  flood_protocol: {
    history_present: boolean;
    total: number;
    soft_signal: number;
  };
  apology_craft: {
    history_present: boolean;
    total: number;
    completed: number;
    scrapped: number;
  };
  /** Tag counts only — never the free-text note body. */
  field_notes: {
    history_present: boolean;
    total: number;
  };
  reconcile: {
    history_present: boolean;
    total: number;
    soft_signal: number;
  };
  parallel_play: {
    history_present: boolean;
    total: number;
    felt_connected_rate: number;
  };
  /** Counts/rates only — never debrief free-text or tags-as-content. */
  private_debrief: {
    history_present: boolean;
    total: number;
    soft_signal_rate: number;
  };
  /** Article/amendment counts only — never article or amendment body text. */
  relationship_constitution: {
    present: boolean;
    version: number;
    article_count: number;
    amendment_count: number;
    pending_proposal_present: boolean;
  };
  /** Preference booleans only — no free text exists in this domain. */
  masochist_mode: {
    enabled: boolean;
    denser_scripts: boolean;
    prefer_edge: boolean;
  } | null;
  /** Bond-map shape only — never the operating notes free text or bond label. */
  relationship_model: {
    present: boolean;
    phase: string;
    closeness_style: string;
    attachment_weather: string;
    event_count: number;
  } | null;
  first_ritual: {
    started: boolean;
    completed_steps: number;
    is_complete: boolean;
  };
  second_ritual: {
    started: boolean;
    completed_steps: number;
    is_complete: boolean;
  };
  /** Counts only — regret/didn't-know-yet/grace text is never exported. */
  letters_to_him: {
    total: number;
    released_count: number;
  };
  /** Counts only — reflection answers and aftercare notes are never exported. */
  trauma_safety_reflections: {
    total: number;
    completed_count: number;
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

  let attachment_repair: LocalInventory["attachment_repair"] = {
    history_present: false,
    session_count: 0,
    soft_signal_exits: 0,
  };
  try {
    const repairs = await attachmentRepairStore.load();
    const r = summarizeRepairHistory(repairs);
    attachment_repair = {
      history_present: r.total > 0,
      session_count: r.total,
      soft_signal_exits: r.soft_signal_exits,
    };
  } catch {
    notes.push("attachment_repair_history_unreadable");
  }

  let conflict_sim: LocalInventory["conflict_sim"] = {
    history_present: false,
    session_count: 0,
    soft_signal_exits: 0,
    reschedule_count: 0,
  };
  try {
    const conflicts = await conflictSimStore.load();
    const c = summarizeConflictHistory(conflicts);
    conflict_sim = {
      history_present: c.total > 0,
      session_count: c.total,
      soft_signal_exits: c.soft_signal,
      reschedule_count: c.reschedule,
    };
  } catch {
    notes.push("conflict_sim_history_unreadable");
  }

  let interest_re: LocalInventory["interest_re"] = {
    history_present: false,
    session_count: 0,
    performing_count: 0,
    soft_signal_exits: 0,
  };
  try {
    const interests = await interestReStore.load();
    const ir = summarizeInterestHistory(interests);
    interest_re = {
      history_present: ir.total > 0,
      session_count: ir.total,
      performing_count: ir.performing,
      soft_signal_exits: ir.soft_signal,
    };
  } catch {
    notes.push("interest_re_history_unreadable");
  }

  let not_ready_yet: LocalInventory["not_ready_yet"] = {
    history_present: false,
    session_count: 0,
    soft_signal_exits: 0,
    im_up_count: 0,
  };
  try {
    const nry = await notReadyYetStore.load();
    const n = summarizeNotReadyHistory(nry);
    not_ready_yet = {
      history_present: n.total > 0,
      session_count: n.total,
      soft_signal_exits: n.soft_signal,
      im_up_count: n.im_up,
    };
  } catch {
    notes.push("not_ready_yet_history_unreadable");
  }

  let too_much: LocalInventory["too_much"] = {
    history_present: false,
    session_count: 0,
    flooded_count: 0,
    soft_signal_exits: 0,
  };
  try {
    const tm = await tooMuchStore.load();
    const p = summarizePatterns(tm);
    too_much = {
      history_present: p.total > 0,
      session_count: p.total,
      flooded_count: p.flooded_count,
      soft_signal_exits: p.soft_signal_count,
    };
  } catch {
    notes.push("too_much_history_unreadable");
  }

  let need_scared: LocalInventory["need_scared"] = {
    history_present: false,
    session_count: 0,
    held_both: 0,
    soft_signal_exits: 0,
  };
  try {
    const ns = await needScaredStore.load();
    const s = summarizeNeedScared(ns);
    need_scared = {
      history_present: s.total > 0,
      session_count: s.total,
      held_both: s.held_both,
      soft_signal_exits: s.soft_signal,
    };
  } catch {
    notes.push("need_scared_history_unreadable");
  }

  let weather: LocalInventory["weather"] = {
    history_present: false,
    total: 0,
    avg_anxiety: null,
    avg_capacity: null,
  };
  try {
    const entries = await weatherStore.load();
    const w = summarizeWeather(entries);
    weather = {
      history_present: w.total > 0,
      total: w.total,
      avg_anxiety: w.avg_anxiety,
      avg_capacity: w.avg_capacity,
    };
  } catch {
    notes.push("weather_history_unreadable");
  }

  let pre_renn: LocalInventory["pre_renn"] = {
    history_present: false,
    total: 0,
    honored_delay: 0,
    soft_signal: 0,
  };
  try {
    const entries = await preRennGateStore.load();
    const p = summarizePreRenn(entries);
    pre_renn = {
      history_present: p.total > 0,
      total: p.total,
      honored_delay: p.honored_delay,
      soft_signal: p.soft_signal,
    };
  } catch {
    notes.push("pre_renn_history_unreadable");
  }

  let aftercare: LocalInventory["aftercare"] = {
    history_present: false,
    total: 0,
    soft_signal: 0,
    settled: 0,
  };
  try {
    const entries = await aftercareStore.load();
    const a = summarizeAftercare(entries);
    aftercare = {
      history_present: a.total > 0,
      total: a.total,
      soft_signal: a.soft_signal,
      settled: a.settled,
    };
  } catch {
    notes.push("aftercare_history_unreadable");
  }

  let flood_protocol: LocalInventory["flood_protocol"] = {
    history_present: false,
    total: 0,
    soft_signal: 0,
  };
  try {
    const entries = await floodProtocolStore.load();
    const f = summarizeFlood(entries);
    flood_protocol = {
      history_present: f.total > 0,
      total: f.total,
      soft_signal: f.soft_signal,
    };
  } catch {
    notes.push("flood_protocol_history_unreadable");
  }

  let apology_craft: LocalInventory["apology_craft"] = {
    history_present: false,
    total: 0,
    completed: 0,
    scrapped: 0,
  };
  try {
    const entries = await apologyCraftStore.load();
    const a = summarizeApology(entries);
    apology_craft = {
      history_present: a.total > 0,
      total: a.total,
      completed: a.completed,
      scrapped: a.scrapped,
    };
  } catch {
    notes.push("apology_craft_history_unreadable");
  }

  let field_notes: LocalInventory["field_notes"] = {
    history_present: false,
    total: 0,
  };
  try {
    const entries = await fieldNotesStore.load();
    const f = summarizeFieldNotes(entries);
    field_notes = { history_present: f.total > 0, total: f.total };
  } catch {
    notes.push("field_notes_unreadable");
  }
  notes.push(
    "Field Notes inventory is a count only; note text is wiped with litmo.field_notes.v1.",
  );

  let reconcile: LocalInventory["reconcile"] = {
    history_present: false,
    total: 0,
    soft_signal: 0,
  };
  try {
    const entries = await reconcileStore.load();
    const r = summarizeReconcile(entries);
    reconcile = {
      history_present: r.total > 0,
      total: r.total,
      soft_signal: r.soft_signal,
    };
  } catch {
    notes.push("reconcile_history_unreadable");
  }

  let parallel_play: LocalInventory["parallel_play"] = {
    history_present: false,
    total: 0,
    felt_connected_rate: 0,
  };
  try {
    const entries = await parallelPlayStore.load();
    const p = summarizeParallel(entries);
    parallel_play = {
      history_present: p.total > 0,
      total: p.total,
      felt_connected_rate: p.felt_connected_rate,
    };
  } catch {
    notes.push("parallel_play_history_unreadable");
  }

  let private_debrief: LocalInventory["private_debrief"] = {
    history_present: false,
    total: 0,
    soft_signal_rate: 0,
  };
  try {
    const entries = await privateDebriefStore.load();
    const d = summarizeDebriefs(entries);
    private_debrief = {
      history_present: d.total > 0,
      total: d.total,
      soft_signal_rate: d.soft_signal_rate,
    };
  } catch {
    notes.push("private_debrief_unreadable");
  }
  notes.push(
    "Private Debrief inventory is counts/rates only; debrief free-text is wiped with litmo.private_debrief.log.v1.",
  );

  let relationship_constitution: LocalInventory["relationship_constitution"] = {
    present: false,
    version: 0,
    article_count: 0,
    amendment_count: 0,
    pending_proposal_present: false,
  };
  try {
    const raw = await AsyncStorage.getItem(REL_CONSTITUTION_KEY);
    if (raw) {
      const doc = await relationshipConstitutionStore.load();
      relationship_constitution = {
        present: true,
        version: doc.version,
        article_count: doc.articles.length,
        amendment_count: doc.amendments.length,
        pending_proposal_present: doc.pendingProposal !== null,
      };
    }
  } catch {
    notes.push("relationship_constitution_unreadable");
  }
  notes.push(
    "Relationship Constitution inventory is counts only; article and amendment text are wiped with litmo.relationship_constitution.v1.",
  );

  let masochist_mode: LocalInventory["masochist_mode"] = null;
  try {
    const raw = await AsyncStorage.getItem(MASOCHIST_MODE_KEY);
    if (raw) {
      const prefs = await masochistModeStore.load();
      masochist_mode = {
        enabled: prefs.enabled,
        denser_scripts: prefs.denserScripts,
        prefer_edge: prefs.preferEdge,
      };
    }
  } catch {
    notes.push("masochist_mode_unreadable");
  }

  let relationship_model: LocalInventory["relationship_model"] = null;
  try {
    const bundle = await relationshipModelStore.load();
    if (bundle?.model) {
      relationship_model = {
        present: true,
        phase: bundle.model.phase,
        closeness_style: bundle.model.closenessStyle,
        attachment_weather: bundle.model.attachmentWeather,
        event_count: bundle.events.length,
      };
    }
  } catch {
    notes.push("relationship_model_unreadable");
  }
  notes.push(
    "Relationship Model inventory is phase/axes shape only; the bond label and operating notes are wiped with litmo.relationship_model.v1, never exported.",
  );

  let first_ritual: LocalInventory["first_ritual"] = {
    started: false,
    completed_steps: 0,
    is_complete: false,
  };
  try {
    const p = await firstRitualStore.load();
    first_ritual = {
      started: p.completedSteps.length > 0,
      completed_steps: p.completedSteps.length,
      is_complete: p.completedSteps.length >= 4,
    };
  } catch {
    notes.push("first_ritual_unreadable");
  }

  let second_ritual: LocalInventory["second_ritual"] = {
    started: false,
    completed_steps: 0,
    is_complete: false,
  };
  try {
    const p = await secondRitualStore.load();
    second_ritual = {
      started: p.completedSteps.length > 0,
      completed_steps: p.completedSteps.length,
      is_complete: p.completedSteps.length >= 4,
    };
  } catch {
    notes.push("second_ritual_unreadable");
  }

  let letters_to_him: LocalInventory["letters_to_him"] = {
    total: 0,
    released_count: 0,
  };
  try {
    const entries = await lettersToHimStore.load();
    letters_to_him = {
      total: entries.length,
      released_count: entries.filter((e) => e.released).length,
    };
  } catch {
    notes.push("letters_to_him_unreadable");
  }
  notes.push(
    "Letters To Him inventory is counts only; regret, what-he-didn't-know-yet, and grace text are never exported — wiped with litmo.letters_to_him.v1.",
  );

  let trauma_safety_reflections: LocalInventory["trauma_safety_reflections"] = {
    total: 0,
    completed_count: 0,
  };
  try {
    const reflections = await traumaSafetyStore.listReflections();
    trauma_safety_reflections = {
      total: reflections.length,
      completed_count: reflections.filter((r) => r.completed).length,
    };
  } catch {
    notes.push("trauma_safety_reflections_unreadable");
  }
  notes.push(
    "Trauma-safety reflection inventory is counts only; reflection answers and aftercare notes are wiped with litmo.trauma_safety.reflections.v1 / .secure.v1.",
  );

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
    attachment_repair,
    conflict_sim,
    interest_re,
    not_ready_yet,
    too_much,
    need_scared,
    weather,
    pre_renn,
    aftercare,
    flood_protocol,
    apology_craft,
    field_notes,
    reconcile,
    parallel_play,
    private_debrief,
    relationship_constitution,
    masochist_mode,
    relationship_model,
    first_ritual,
    second_ritual,
    letters_to_him,
    trauma_safety_reflections,
    notes,
  };
}
