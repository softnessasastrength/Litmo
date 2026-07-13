/**
 * Soft Signal orchestration — local stop first, then sync, log, haptic, hardware.
 * Never asks for a reason. Never blocks on haptic/hardware failure.
 */

import {
  buildHardwareCommand,
  createLogEntry,
  newSoftSignalId,
  userMessageForOutcome,
  type SoftSignalFireRequest,
  type SoftSignalFireResult,
  type SoftSignalOutcome,
} from "../lib/softSignalCore.ts";
import { emergencyStopService } from "./emergencyStopService.ts";
import { hapticService } from "./hapticService.ts";
import { getSoftSignalHardwareBridge } from "./softSignalHardware.ts";
import { softSignalLogStore } from "./softSignalLogStore.ts";

export const softSignalService = {
  /**
   * Fire Soft Signal.
   * Order: mark local end intent → optional remote stop → log → haptic → hardware.
   * Remote failure still returns localEnded: true.
   */
  async fire(request: SoftSignalFireRequest): Promise<SoftSignalFireResult> {
    const firedAt = new Date().toISOString();
    const id = newSoftSignalId();
    const sessionId = request.sessionId ?? null;
    const surface = request.surface ?? "mobile_app";
    const practiceOnly = Boolean(request.practiceOnly) || !sessionId;

    let outcome: SoftSignalOutcome = practiceOnly
      ? "practice_only"
      : "stopped_local";

    if (!practiceOnly && sessionId) {
      try {
        const remote = await emergencyStopService.stop(sessionId);
        if (remote.status === "stopped_pending_sync") {
          outcome = "pending_sync";
        } else if (remote.status === "stopped") {
          outcome = "stopped_synced";
        } else {
          outcome = "stopped_local";
        }
      } catch {
        outcome = "pending_sync";
      }
    }

    const logEntry = createLogEntry({
      id,
      firedAt,
      source: request.source,
      outcome,
      sessionId,
      privateJournalNote: null,
      surface,
    });

    try {
      await softSignalLogStore.append(logEntry);
    } catch {
      // Logging must never undo the stop.
    }

    // Acknowledgement only — never gates the stop.
    void hapticService.play("softSignal");

    const hardwareCommand = buildHardwareCommand(
      // Gentle if haptics sensory path later; primary default for now.
      "primary",
      firedAt,
    );
    void getSoftSignalHardwareBridge()
      .emit(hardwareCommand)
      .catch(() => undefined);

    return {
      localEnded: true,
      outcome,
      logEntry,
      hapticEvent: "softSignal",
      userMessage: userMessageForOutcome(outcome),
      hardwareCommand,
    };
  },

  async loadPersonalLog() {
    return softSignalLogStore.load();
  },

  async addJournalNote(id: string, note: string | null) {
    return softSignalLogStore.updateNote(id, note);
  },

  /** Practice fire — no session, no network, still logs as practice. */
  async practice(): Promise<SoftSignalFireResult> {
    return this.fire({
      source: "practice",
      practiceOnly: true,
      surface: "mobile_app",
    });
  },
};
