/**
 * Soft Signal orchestration — local stop first, then sync, log, haptic, hardware.
 * Never asks for a reason. Never blocks on haptic/hardware failure.
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

const core = createSoftSignalService({
  async stopRemote(sessionId) {
    return emergencyStopService.stop(sessionId);
  },
  appendLog: (entry) => softSignalLogStore.append(entry).then(() => undefined),
  playHaptic: () => {
    void hapticService.play("softSignal");
  },
  emitHardware: (command) => getSoftSignalHardwareBridge().emit(command),
});

export const softSignalService = {
  /**
   * Fire Soft Signal.
   * Order: mark local end intent → optional remote stop → log → haptic → hardware.
   * Remote failure still returns localEnded: true.
   */
  async fire(request: SoftSignalFireRequest): Promise<SoftSignalFireResult> {
    return core.fire(request);
  },

  async loadPersonalLog() {
    return softSignalLogStore.load();
  },

  async addJournalNote(id: string, note: string | null) {
    return softSignalLogStore.updateNote(id, note);
  },

  /** Practice fire — no session, no network, still logs as practice. */
  async practice(): Promise<SoftSignalFireResult> {
    return core.practice();
  },
};
