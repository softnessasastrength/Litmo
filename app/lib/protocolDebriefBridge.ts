/**
 * Protocol → Private Debrief Lab auto-ingest.
 * Maps each containment history entry into a unified local debrief.
 * Precision without creep: no partner data, controlled tags, wipeable.
 */
import {
  createManualDebrief,
  type DebriefSource,
  type UnifiedDebriefEntry,
} from "./privateDebriefCore.ts";
import type { SpoonHistoryEntry } from "./spooningCore.ts";
import type { MorningHistoryEntry } from "./morningCuddleCore.ts";
import type { ConflictHistoryEntry } from "./conflictSimCore.ts";
import type { TooMuchHistoryEntry } from "./tooMuchCore.ts";
import type { NeedScaredHistoryEntry } from "./needScaredCore.ts";
import type { InterestHistoryEntry } from "./interestReCore.ts";
import type { RepairHistoryEntry } from "./attachmentRepairCore.ts";
import type { NotReadyHistoryEntry } from "./notReadyYetCore.ts";
import type { ReconcileEntry } from "./reconcileCore.ts";
import type { ParallelEntry } from "./parallelPlayCore.ts";

function softFromReason(reason: string): boolean {
  return reason === "soft_signal";
}

/** Map optional 1–10 scale down to regulation 1–5 */
function scale10to5(n: number | null | undefined): 1 | 2 | 3 | 4 | 5 | null {
  if (n == null || !Number.isFinite(n)) return null;
  const v = Math.max(1, Math.min(10, Math.round(n)));
  return Math.max(1, Math.min(5, Math.ceil(v / 2))) as 1 | 2 | 3 | 4 | 5;
}

function baseReg(endReason: string, soft: boolean): 1 | 2 | 3 | 4 | 5 {
  if (soft) return 3;
  if (endReason === "abandoned") return 2;
  return 4;
}

export function debriefFromSpoon(e: SpoonHistoryEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["hold"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.namedNeedForHold) tags.push("attachment");
  if (e.debrief?.nonTraumaticClosenessPlusOne) tags.push("clear_yes");
  return createManualDebrief({
    title: `Spoon · ${e.endReason}`,
    regulation: baseReg(e.endReason, soft),
    worked: e.debrief?.worked ?? "",
    didnt: e.debrief?.didntWork ?? "",
    tags,
    softSignalUsed: soft,
    source: "spooning",
    again: e.endReason === "completed" || e.endReason === "hot_or_pee",
  });
}

export function debriefFromMorning(e: MorningHistoryEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["morning"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerReceivedWithoutSpiral) tags.push("hold");
  return createManualDebrief({
    title: `Morning cuddle · ${e.endReason}`,
    regulation: scale10to5(e.debrief?.safetyFeel) ?? baseReg(e.endReason, soft),
    worked: e.debrief?.note ?? "",
    didnt: "",
    tags,
    softSignalUsed: soft || e.endReason === "exit_protocol",
    source: "morning_cuddle",
    again: e.endReason === "completed" || e.endReason === "graceful_timer",
  });
}

export function debriefFromConflict(
  e: ConflictHistoryEntry,
): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["conflict"];
  if (soft) tags.push("soft_signal");
  if (e.endReason === "reschedule") tags.push("space");
  if (e.debrief?.ledgerSoftSignalOk) tags.push("soft_signal");
  return createManualDebrief({
    title: `Conflict sim · ${e.endReason}`,
    regulation: baseReg(e.endReason, soft || e.endReason === "reschedule"),
    worked: e.iStatement || e.debrief?.note || "",
    didnt: "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalOk),
    source: "conflict_sim",
    again: e.endReason === "completed" || e.endReason === "reschedule",
  });
}

export function debriefFromTooMuch(e: TooMuchHistoryEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["too_much_story"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerNamedStory) tags.push("clear_yes");
  if (e.debrief?.ledgerDidNotDumpRaw) tags.push("space");
  return createManualDebrief({
    title: `Too much · ${e.endReason}`,
    regulation: baseReg(e.endReason, soft),
    worked:
      e.debrief?.note ??
      `containment ${e.containmentStepsDone} · reas ${e.reassuranceStepsDone}`,
    didnt: "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalOk),
    source: "too_much",
    again: e.endReason === "completed",
  });
}

export function debriefFromNeedScared(
  e: NeedScaredHistoryEntry,
): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["dual_bind"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerHeldBoth) tags.push("hold");
  if (e.debrief?.ledgerDidNotPreAbandon) tags.push("clear_yes");
  if (e.debrief?.ledgerDidNotFawnOnly) tags.push("clear_no");
  return createManualDebrief({
    title: `Need ∧ leave-fear · ${e.endReason}`,
    regulation: baseReg(e.endReason, soft),
    worked: e.debrief?.note ?? "",
    didnt: "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalOk),
    source: "need_scared",
    again: e.endReason === "completed",
  });
}

export function debriefFromInterest(
  e: InterestHistoryEntry,
): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["clear_yes"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerNamedShould) tags.push("fawn");
  if (e.debrief?.ledgerAllowedDontKnow) tags.push("space");
  return createManualDebrief({
    title: `Interest RE · ${e.endReason}`,
    regulation: scale10to5(e.debrief?.clarity) ?? baseReg(e.endReason, soft),
    worked: e.debrief?.note ?? "",
    didnt: "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalOk),
    source: "interest_re",
    again: e.endReason === "completed",
  });
}

export function debriefFromRepair(e: RepairHistoryEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["attachment"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerNamedMommyIssues) tags.push("hold");
  if (e.debrief?.ledgerCaughtMasochistLoop) tags.push("ceremony");
  if (e.endReason === "yellow_pause_exit") tags.push("space");
  return createManualDebrief({
    title: `Attachment repair · ${e.snapshot.modeId} · ${e.endReason}`,
    regulation:
      scale10to5(e.debrief?.flooded != null ? 11 - e.debrief.flooded : null) ??
      baseReg(e.endReason, soft),
    worked: e.debrief?.woundActuallyFor ?? "",
    didnt: e.debrief?.usedPartnerAsStandInWithoutConsent
      ? "named stand-in risk"
      : "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalRemembered),
    source: "attachment_repair",
    again: e.endReason === "completed",
  });
}

export function debriefFromNotReady(
  e: NotReadyHistoryEntry,
): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["morning", "rest"];
  if (soft) tags.push("soft_signal");
  if (e.debrief?.ledgerNoSelfHate) tags.push("clear_yes");
  return createManualDebrief({
    title: `Not ready yet · ${e.endReason}`,
    regulation:
      scale10to5(e.debrief?.guilt != null ? 11 - e.debrief.guilt : null) ??
      baseReg(e.endReason, soft),
    worked: e.debrief?.note ?? "",
    didnt: "",
    tags,
    softSignalUsed: soft || Boolean(e.debrief?.ledgerSoftSignalOk),
    source: "not_ready_yet",
    again: e.endReason === "im_up" || e.endReason === "completed",
  });
}

export function debriefFromReconcile(e: ReconcileEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["repair", "conflict"];
  if (soft) tags.push("soft_signal");
  if (e.snapshot.denser) tags.push("ceremony");
  return createManualDebrief({
    title: `Reconcile: ${e.snapshot.archetypeId}`,
    regulation: baseReg(e.endReason, soft),
    worked: e.note || e.snapshot.fightNote,
    didnt: "",
    tags,
    softSignalUsed: soft,
    source: "reconcile",
    again: e.endReason === "completed",
  });
}

export function debriefFromParallel(e: ParallelEntry): UnifiedDebriefEntry {
  const soft = softFromReason(e.endReason);
  const tags = ["parallel"];
  if (soft) tags.push("soft_signal");
  if (e.snapshot.ceremonial) tags.push("ceremony");
  if (e.feltConnected) tags.push("hold");
  return createManualDebrief({
    title: `Parallel: ${e.snapshot.modeId}`,
    regulation: e.feltConnected ? 4 : baseReg(e.endReason, soft),
    worked: e.note || e.snapshot.intention,
    didnt: "",
    tags,
    softSignalUsed: soft,
    source: "parallel_play",
    again: e.feltConnected,
  });
}

export const DEBRIEF_BRIDGE_SOURCES: readonly DebriefSource[] = [
  "spooning",
  "morning_cuddle",
  "conflict_sim",
  "too_much",
  "need_scared",
  "interest_re",
  "attachment_repair",
  "not_ready_yet",
  "reconcile",
  "parallel_play",
] as const;
