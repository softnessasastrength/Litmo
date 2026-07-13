/**
 * Trauma-informed safety orchestration — panic, quick exit, timeout, verify, reflect.
 * Soft Signal remains the stop authority; this layer adds cover UI, time boundaries,
 * present-moment checks, and optional private reflection.
 */

import {
  createEmptyReflection,
  createVerificationRecord,
  type PartnerVerificationCheckId,
  type PartnerVerificationRecord,
  type SafetyExitKind,
  type SessionReflectionDocument,
  type TraumaSafetyPrefs,
  computeTimeoutPhase,
  upsertReflectionAnswer,
  type ReflectionAnswer,
} from "../lib/traumaSafetyCore.ts";
import { softSignalService } from "./softSignalService.ts";
import type { SoftSignalFireResult } from "../lib/softSignalCore.ts";
import { traumaSafetyStore } from "./traumaSafetyStore.ts";

export type SafetyExitResult = {
  localEnded: true;
  exitKind: SafetyExitKind;
  softSignal: SoftSignalFireResult;
  /** Prefer this navigation after exit. */
  navigateTo: "wrap-up" | "panic-cover" | "home";
  useCover: boolean;
};

export const traumaSafetyService = {
  loadPrefs: () => traumaSafetyStore.loadPrefs(),
  savePrefs: (prefs: TraumaSafetyPrefs) => traumaSafetyStore.savePrefs(prefs),

  /**
   * Soft Signal + quick leave path (wrap-up still available, not forced to stay).
   */
  async quickExit(sessionId?: string | null): Promise<SafetyExitResult> {
    const softSignal = await softSignalService.fire({
      source: "active_session",
      sessionId: sessionId ?? null,
      surface: "mobile_app",
      practiceOnly: !sessionId,
    });
    return {
      localEnded: true,
      exitKind: "quick_exit",
      softSignal,
      navigateTo: "wrap-up",
      useCover: false,
    };
  },

  /**
   * Panic: Soft Signal first (never delayed), then optional cover screen.
   */
  async panicExit(sessionId?: string | null): Promise<SafetyExitResult> {
    const prefs = await traumaSafetyStore.loadPrefs();
    const softSignal = await softSignalService.fire({
      source: "active_session",
      sessionId: sessionId ?? null,
      surface: "mobile_app",
      practiceOnly: !sessionId,
    });
    const useCover = prefs.panic.useCoverScreen;
    return {
      localEnded: true,
      exitKind: "panic_mode",
      softSignal,
      navigateTo: useCover ? "panic-cover" : "wrap-up",
      useCover,
    };
  },

  /**
   * Timeout-driven Soft Signal (auto or after prompt).
   */
  async timeoutExit(
    sessionId: string | null | undefined,
    auto: boolean,
  ): Promise<SafetyExitResult> {
    const softSignal = await softSignalService.fire({
      source: "active_session",
      sessionId: sessionId ?? null,
      surface: "mobile_app",
      practiceOnly: !sessionId,
    });
    return {
      localEnded: true,
      exitKind: auto ? "timeout_auto" : "timeout_prompted",
      softSignal,
      navigateTo: "wrap-up",
      useCover: false,
    };
  },

  timeoutPhase(prefs: TraumaSafetyPrefs, elapsedSeconds: number) {
    return computeTimeoutPhase(prefs.timeout, elapsedSeconds);
  },

  async saveVerification(
    checks: PartnerVerificationCheckId[],
    privateNote?: string | null,
  ): Promise<PartnerVerificationRecord> {
    const record = createVerificationRecord(checks, privateNote ?? null);
    return traumaSafetyStore.saveVerification(record);
  },

  loadLatestVerification: () => traumaSafetyStore.loadLatestVerification(),

  async startReflection(input: {
    sessionId?: string | null;
    softSignalLogId?: string | null;
    exitKind?: SessionReflectionDocument["exitKind"];
  }): Promise<SessionReflectionDocument> {
    const doc = createEmptyReflection({
      sessionId: input.sessionId ?? null,
      softSignalLogId: input.softSignalLogId ?? null,
      exitKind: input.exitKind ?? "unknown",
    });
    return traumaSafetyStore.saveCurrentReflection(doc);
  },

  async answerReflection(
    doc: SessionReflectionDocument,
    answer: ReflectionAnswer,
  ): Promise<SessionReflectionDocument> {
    const next = upsertReflectionAnswer(doc, answer);
    return traumaSafetyStore.saveCurrentReflection(next);
  },

  async completeReflection(
    doc: SessionReflectionDocument,
    aftercareNote?: string | null,
  ): Promise<SessionReflectionDocument> {
    const next = {
      ...doc,
      aftercareNote: aftercareNote?.trim().slice(0, 500) || null,
      completed: true,
      updatedAt: new Date().toISOString(),
      notTherapy: true as const,
      notRequired: true as const,
      notScore: true as const,
    };
    await traumaSafetyStore.archiveReflection(next);
    return next;
  },

  async skipReflection(
    doc: SessionReflectionDocument,
  ): Promise<SessionReflectionDocument> {
    const next = {
      ...doc,
      completed: true,
      answers: [
        ...doc.answers,
        // Mark enough_for_today skipped if missing — completing skip is success.
      ],
      updatedAt: new Date().toISOString(),
      notTherapy: true as const,
      notRequired: true as const,
      notScore: true as const,
    };
    await traumaSafetyStore.archiveReflection(next);
    return next;
  },

  loadCurrentReflection: () => traumaSafetyStore.loadCurrentReflection(),
  listReflections: () => traumaSafetyStore.listReflections(),
};
