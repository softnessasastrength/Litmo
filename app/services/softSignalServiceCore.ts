/**
 * Soft Signal orchestration core — injectable for offline/chaos unit tests.
 * Product invariants: local end first; never ask for a reason; log/haptic/hardware
 * failures never undo the stop.
 */

import {
  buildHardwareCommand,
  createLogEntry,
  newSoftSignalId,
  userMessageForOutcome,
  type SoftSignalFireRequest,
  type SoftSignalFireResult,
  type SoftSignalHardwareCommand,
  type SoftSignalLogEntry,
  type SoftSignalOutcome,
} from "../lib/softSignalCore.ts";

export type SoftSignalRemoteStop =
  | { status: "stopped"; resultingState?: string }
  | { status: "stopped_pending_sync" }
  | { status: "stopped_local" }
  | { status: "idle" };

export type SoftSignalServiceDependencies = {
  stopRemote: (sessionId: string) => Promise<SoftSignalRemoteStop>;
  appendLog: (entry: SoftSignalLogEntry) => Promise<void>;
  playHaptic: () => void;
  emitHardware: (command: SoftSignalHardwareCommand) => Promise<void>;
  newId?: () => string;
  now?: () => string;
};

export function createSoftSignalService(deps: SoftSignalServiceDependencies) {
  const fire = async (
    request: SoftSignalFireRequest,
  ): Promise<SoftSignalFireResult> => {
    const firedAt = (deps.now ?? (() => new Date().toISOString()))();
    const id = (deps.newId ?? newSoftSignalId)();
    const sessionId = request.sessionId ?? null;
    const surface = request.surface ?? "mobile_app";
    const practiceOnly = Boolean(request.practiceOnly) || !sessionId;

    let outcome: SoftSignalOutcome = practiceOnly
      ? "practice_only"
      : "stopped_local";

    if (!practiceOnly && sessionId) {
      try {
        const remote = await deps.stopRemote(sessionId);
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
      await deps.appendLog(logEntry);
    } catch {
      // Logging must never undo the stop.
    }

    try {
      deps.playHaptic();
    } catch {
      // Haptic never gates stop.
    }

    const hardwareCommand = buildHardwareCommand("primary", firedAt);
    try {
      await deps.emitHardware(hardwareCommand);
    } catch {
      // Hardware never gates stop.
    }

    return {
      localEnded: true,
      outcome,
      logEntry,
      hapticEvent: "softSignal",
      userMessage: userMessageForOutcome(outcome),
      hardwareCommand,
    };
  };

  return {
    fire,
    async practice(): Promise<SoftSignalFireResult> {
      return fire({
        source: "practice",
        practiceOnly: true,
        surface: "mobile_app",
      });
    },
  };
}
