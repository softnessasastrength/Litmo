/**
 * Soft Signal orchestration core — injectable for offline/chaos unit tests.
 *
 * Product invariants:
 * - Local end intent is authoritative; result always includes localEnded: true.
 * - Never ask for a reason (request type has no reason field; never prompt here).
 * - Log / haptic / hardware failures never undo the stop.
 * - practiceOnly or missing sessionId → no remote withdrawal.
 * - Remote failure → pending_sync, not “session still active.”
 *
 * SEE:
 * - app/lib/softSignalCore.ts
 * - app/services/softSignalService.ts (production wiring)
 * - app/services/emergencyStopServiceCore.ts (remote withdraw + offline queue)
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical)
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

/**
 * WHAT: Normalized remote stop result statuses from emergency-stop / withdraw path.
 * WHY: Core maps backend-ish statuses into SoftSignalOutcome without importing
 *      emergencyStopService (testable pure orchestration).
 * CONSENT: Remote status is plumbing after local end — never re-grants contact.
 * EDGE CASES:
 *   - stopped_pending_sync → Soft Signal outcome pending_sync
 *   - stopped → stopped_synced
 *   - stopped_local / idle / other → stopped_local (local authority preserved)
 * NEVER: Treat idle as “continue session.” Require peer acknowledgment.
 */
export type SoftSignalRemoteStop =
  | { status: "stopped"; resultingState?: string }
  | { status: "stopped_pending_sync" }
  | { status: "stopped_local" }
  | { status: "idle" };

/**
 * WHAT: Injectable side effects for Soft Signal fire (test + production).
 * WHY: Unit tests can chaos-fail log/haptic/hardware/remote without real vault or
 *      network; production wires emergencyStop + vault + haptics + hardware bridge.
 * CONSENT: Dependencies execute after/alongside stop; none may reverse localEnded.
 * EDGE CASES: appendLog/playHaptic/emitHardware throws are swallowed in fire.
 * NEVER: Inject stopRemote that blocks local return until peer accepts (forbidden).
 * SEE: softSignalService.ts production deps
 */
export type SoftSignalServiceDependencies = {
  /** Remote withdraw; may throw or return pending — must not gate localEnded. */
  stopRemote: (sessionId: string) => Promise<SoftSignalRemoteStop>;
  /** Persist private log entry; failure must not undo stop. */
  appendLog: (entry: SoftSignalLogEntry) => Promise<void>;
  /** Semantic haptic play; failure must not undo stop. */
  playHaptic: () => void;
  /** Hardware Soft Signal command; failure must not undo stop. */
  emitHardware: (command: SoftSignalHardwareCommand) => Promise<void>;
  /** Optional id factory for deterministic tests. */
  newId?: () => string;
  /** Optional clock for deterministic tests (ISO string). */
  now?: () => string;
};

/**
 * WHAT: Factory for Soft Signal service { fire, practice } with injected deps.
 * WHY: Keeps product order (remote attempt → log → haptic → hardware) testable
 *      while guaranteeing localEnded: true and no reason collection.
 * CONSENT: fire is unilateral withdraw/practice. practice() never starts a session
 *      or notifies peers. Soft Signal is never emergency services.
 * EDGE CASES:
 *   - practiceOnly or !sessionId → skip remote entirely (practice_only outcome)
 *   - remote stopped_pending_sync / throw → pending_sync
 *   - remote stopped → stopped_synced
 *   - remote other → stopped_local
 *   - log/haptic/hardware throw → ignored; return still localEnded true
 * NEVER: Undo stop because side effects failed. Ask for explanation. Wait on peer.
 * SEE: SoftSignalFireRequest/Result; emergencyStopService.stop
 */
export function createSoftSignalService(deps: SoftSignalServiceDependencies) {
  /**
   * WHAT: Execute Soft Signal fire for a request; always return localEnded: true.
   * WHY: Single orchestration path so UI, practice, and hardware sim share invariants.
   * CONSENT: Unilateral stop — no reason, no peer OK, no grant-arm. Local authority
   *      is independent of remote success (stop faster than grant).
   * EDGE CASES:
   *   - practiceOnly || !sessionId → practice_only, no stopRemote call
   *   - stopRemote throw → pending_sync (session cannot resume; sync later)
   *   - appendLog/playHaptic/emitHardware fail → catch and continue
   *   - privateJournalNote always null at fire time (notes are post-hoc only)
   * NEVER: Return localEnded false. Prompt for reason. Block return on haptic/hardware.
   *        Treat this as crisis dispatch or emergency services.
   * SEE: userMessageForOutcome; createLogEntry; buildHardwareCommand
   */
  const fire = async (
    request: SoftSignalFireRequest,
  ): Promise<SoftSignalFireResult> => {
    // Local clock of the stop *decision* — authoritative even if network is down.
    const firedAt = (deps.now ?? (() => new Date().toISOString()))();
    const id = (deps.newId ?? newSoftSignalId)();
    const sessionId = request.sessionId ?? null;
    const surface = request.surface ?? "mobile_app";
    // Fail closed toward practice: no session id means no remote withdraw attempt.
    // Explicit practiceOnly also skips remote even if a session id was passed.
    const practiceOnly = Boolean(request.practiceOnly) || !sessionId;

    // Default outcome: practice vs local stop before remote attempt.
    let outcome: SoftSignalOutcome = practiceOnly
      ? "practice_only"
      : "stopped_local";

    // Order: optional remote after local outcome default — remote never blocks
    // constructing localEnded result; failures become pending_sync.
    if (!practiceOnly && sessionId) {
      try {
        const remote = await deps.stopRemote(sessionId);
        if (remote.status === "stopped_pending_sync") {
          // Offline queue path: local already cleared sensitive runtime upstream.
          outcome = "pending_sync";
        } else if (remote.status === "stopped") {
          outcome = "stopped_synced";
        } else {
          // idle / stopped_local / unexpected: keep local authority, not “resume.”
          outcome = "stopped_local";
        }
      } catch {
        // Network or RPC failure: stop still succeeded locally; sync later.
        outcome = "pending_sync";
      }
    }

    // Journal note intentionally null at fire — never collect reason at stop time.
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
      // Logging must never undo the stop — vault failure ≠ session continues.
    }

    try {
      deps.playHaptic();
    } catch {
      // Haptic never gates stop — acknowledgment is nice, freedom is mandatory.
    }

    // Primary intensity for real/practice fire path from service (gentle is hardware/API choice elsewhere).
    const hardwareCommand = buildHardwareCommand("primary", firedAt);
    try {
      await deps.emitHardware(hardwareCommand);
    } catch {
      // Hardware never gates stop — phone no-op or future firmware both safe.
    }

    // Always localEnded: true — UI must treat session as ended immediately.
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
    /**
     * WHAT: Fire Soft Signal in practice-only mode (no session, no remote).
     * WHY: Muscle memory for freedom without peer notify or session lifecycle.
     * CONSENT: Practice never seals consent, starts a session, or implies peer contact.
     * EDGE CASES: Still logs as practice; still plays haptic/hardware best-effort.
     * NEVER: Treat practice log as evidence against a peer or as a public score.
     * SEE: SoftSignalSource "practice"; SOFT_SIGNAL_COPY.practiceBody
     */
    async practice(): Promise<SoftSignalFireResult> {
      return fire({
        source: "practice",
        practiceOnly: true,
        surface: "mobile_app",
      });
    },
  };
}
