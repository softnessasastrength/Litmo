/**
 * Soft Signal orchestration — production wiring over softSignalServiceCore.
 *
 * Order of product meaning: local end intent (core result localEnded) → optional
 * remote stop via emergencyStopService → private log → haptic → hardware.
 * Never asks for a reason. Never blocks freedom on haptic/hardware failure.
 *
 * SEE:
 * - app/services/softSignalServiceCore.ts
 * - app/lib/softSignalCore.ts
 * - app/services/emergencyStopService.ts
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical)
 */

import type {
  SoftSignalFireRequest,
  SoftSignalFireResult,
} from "../lib/softSignalCore.ts";
import { emergencyStopService } from "./emergencyStopService.ts";
import { hapticService } from "./hapticService.ts";
import { getSoftSignalHardwareBridge } from "./softSignalHardware.ts";
import { softSignalLogStore } from "./softSignalLogStore.ts";
import { createSoftSignalService } from "./softSignalServiceCore.ts";
import { watchHapticBridge } from "./watchHapticBridge.ts";

/**
 * WHAT: Production Soft Signal core with real stop/log/haptic/hardware deps.
 * WHY: Single singleton wiring so screens call softSignalService, not ad-hoc RPC.
 * CONSENT: stopRemote is emergencyStopService.stop — withdraw path, local-first.
 * EDGE CASES: playHaptic is fire-and-forget void; emit uses current hardware bridge.
 * NEVER: Wire a remote that requires peer confirmation before return.
 */
const core = createSoftSignalService({
  /**
   * WHAT: Map session id to emergency stop / consent withdraw service.
   * WHY: Soft Signal remote side is the same authoritative withdraw path as
   *      emergency stop (local clear + pending sync), not a separate “soft” API.
   * CONSENT: Unilateral withdraw — match/profile history never re-grants.
   * EDGE CASES: emergencyStopService may return pending_sync on network failure.
   * NEVER: Call this for practice-only fires (core skips when practiceOnly).
   */
  async stopRemote(sessionId) {
    return emergencyStopService.stop(sessionId);
  },
  /**
   * WHAT: Append private Soft Signal log entry to vault-backed store.
   * WHY: Personal history only; core ignores append failures so stop cannot undo.
   * CONSENT: Logging is not consent and not peer-visible score input.
   * EDGE CASES: append returns list; we discard to Promise<void> for core contract.
   * NEVER: Log private journal bodies to analytics or console here.
   */
  appendLog: (entry) => softSignalLogStore.append(entry).then(() => undefined),
  /**
   * WHAT: Play semantic softSignal haptic pattern.
   * WHY: Embodied acknowledgment of stop without blocking or requiring success.
   * CONSENT: Haptic is not a grant; does not notify peer of emotional content.
   * EDGE CASES: void fire-and-forget; core also try/catches playHaptic.
   * NEVER: Gate session end on haptic engine availability.
   */
  playHaptic: () => {
    // Soft Signal sacred: raise interrupt first so all other patterns die,
    // then play descend_warm / triple-decay phrase (hapticLanguageNuclear v0.1).
    hapticService.raiseInterrupt("soft_signal");
    void hapticService.play("softSignal");
    // Best-effort wrist mirror — never blocks stop (ADR 0064).
    void watchHapticBridge
      .softSignalFromWrist({
        watchDeviceId: "phone-originated",
        sessionId: null,
      })
      .catch(() => undefined);
  },
  /**
   * WHAT: Emit SoftSignalHardwareCommand to current hardware bridge.
   * WHY: Future Litmo device parity; default null bridge no-ops safely.
   * CONSENT: Hardware Soft Signal same unilateral stop authority as app.
   * EDGE CASES: bridge may be null implementation (isAvailable false).
   * NEVER: Block local end waiting for BLE/network hardware ack.
   */
  emitHardware: (command) => getSoftSignalHardwareBridge().emit(command),
});

/**
 * WHAT: Public Soft Signal service API for app screens and session flows.
 * WHY: Stable facade over core + log store helpers (load, journal note, practice).
 * CONSENT: fire/practice are withdraw/practice only — never grant contact.
 * EDGE CASES: loadPersonalLog / addJournalNote are post-hoc private history only.
 * NEVER: Expose public scoring APIs or required-reason collection methods.
 * SEE: softSignalLogStore; createSoftSignalService
 */
export const softSignalService = {
  /**
   * WHAT: Fire Soft Signal for a real or practice request.
   * WHY: Entry point for active session / pre-activation / review UI.
   * CONSENT: Unilateral stop. Remote failure still returns localEnded: true via core.
   * EDGE CASES: See createSoftSignalService.fire — practiceOnly, pending_sync, etc.
   * NEVER: Await peer; require explanation; treat as emergency services.
   * SEE: SoftSignalFireRequest; emergencyStopService.stop · ADR 0064 watch kill
   */
  async fire(request: SoftSignalFireRequest): Promise<SoftSignalFireResult> {
    const result = await core.fire(request);
    // After local stop authority, best-effort Watch kill with session id when known.
    // Must never block or reverse localEnded.
    if (!request.practiceOnly && request.sessionId) {
      void watchHapticBridge
        .softSignalFromWrist({
          watchDeviceId: "phone-originated",
          sessionId: request.sessionId,
        })
        .catch(() => undefined);
    }
    return result;
  },

  /**
   * WHAT: Load private Soft Signal log entries from local vault (newest first).
   * WHY: Personal log screen and any self-history without network dependency.
   * CONSENT: Not a consent surface; private device history only.
   * EDGE CASES: corrupt vault → empty array via store parse fail-closed.
   * NEVER: Sync this list to peers or public profiles. Never treat as trust score.
   * SEE: softSignalLogStore.load; SOFT_SIGNAL_COPY.logPrivacy
   */
  async loadPersonalLog() {
    return softSignalLogStore.load();
  },

  /**
   * WHAT: Attach/update optional private journal note after a Soft Signal.
   * WHY: Reflection is allowed *after* stop; never a gate at fire time.
   * CONSENT: Optional, private, post-hoc — not an explanation demanded by product.
   * EDGE CASES: note trimmed/sliced to 500 in store; null clears note.
   * NEVER: Prompt for this during Soft Signal fire. Share note with peer.
   * SEE: softSignalLogStore.updateNote
   */
  async addJournalNote(id: string, note: string | null) {
    return softSignalLogStore.updateNote(id, note);
  },

  /**
   * WHAT: Practice Soft Signal fire — no session, no network withdraw.
   * WHY: Muscle memory for freedom; practice screen entry point.
   * CONSENT: Never starts a session, seals snapshot, or notifies anyone.
   * EDGE CASES: Still writes practice log + best-effort haptic/hardware.
   * NEVER: Count practice as peer-facing trust history or penalty.
   * SEE: soft-signal/practice.tsx; core.practice
   */
  async practice(): Promise<SoftSignalFireResult> {
    return core.practice();
  },
};
