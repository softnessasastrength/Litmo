/**
 * Hardware Soft Signal bridge — phone no-op / future native module.
 *
 * Firmware must implement SoftSignalHardwareCommand from softSignalCore
 * (preempt, localOnly, calm visualHint). Failures must never undo Soft Signal.
 *
 * SEE:
 * - app/lib/softSignalCore.ts (SoftSignalHardwareCommand)
 * - HARDWARE/HAPTICS.md
 * - docs/CODE_COMMENT_STANDARD.md
 */

import type { SoftSignalHardwareCommand } from "../lib/softSignalCore.ts";

/**
 * WHAT: Interface for physical Litmo Soft Signal actuators/LED bridge.
 * WHY: Decouple orchestration from native modules so phone ships without hardware
 *      while firmware can plug in without changing softSignalServiceCore.
 * CONSENT: emit is stop acknowledgment on device — same unilateral Soft Signal meaning.
 * EDGE CASES: isAvailable false → in-app haptics carry acknowledgment only.
 * NEVER: Throw from emit into the safety path (callers swallow; bridge should too).
 *        Block emit on network. Require peer device confirmation.
 */
export type SoftSignalHardwareBridge = {
  /**
   * WHAT: Fire Soft Signal pattern on device actuators/LED.
   * WHY: Embodied warm descent / breath leave on hardware control surface.
   * CONSENT: Hardware stop has full Soft Signal authority — no reason, no peer OK.
   * EDGE CASES: Must never throw into the safety path; failures are swallowed upstream.
   * NEVER: Wait on cloud. Emit alarm/siren as default Soft Signal.
   * SEE: SoftSignalHardwareCommand.preempt / localOnly
   */
  emit(command: SoftSignalHardwareCommand): Promise<void>;
  /**
   * WHAT: Report whether a physical Litmo Soft Signal control is present.
   * WHY: UI may later offer hardware-specific practice copy without false claims.
   * CONSENT: Availability is not consent and not a safety score.
   * EDGE CASES: Default false on phone builds without native module.
   * NEVER: Treat isAvailable true as “user is safer” or emergency-button capable.
   */
  isAvailable(): Promise<boolean>;
};

/**
 * WHAT: Default no-op hardware bridge when no physical device is bound.
 * WHY: Soft Signal must work fully in Expo Go / phone-only; hardware is optional.
 * CONSENT: No-op emit still allows app Soft Signal to complete (localEnded true).
 * EDGE CASES: emit ignores command; isAvailable always false.
 * NEVER: Throw from emit. Pretend emergency services hardware is attached.
 * SEE: setSoftSignalHardwareBridge for tests/native injection
 */
export const nullSoftSignalHardware: SoftSignalHardwareBridge = {
  async emit() {
    // Future: NativeModules.LitmoSoftSignal.emit(JSON.stringify(command))
    // Intentionally empty — phone Soft Signal must not depend on hardware presence.
  },
  async isAvailable() {
    // Fail closed toward “no hardware” — never claim a physical control falsely.
    return false;
  },
};

/**
 * Process-local active bridge. Default nullSoftSignalHardware until set.
 * WHY: Tests and future native bootstrap can swap without rebuilding service core.
 * NEVER: Persist bridge across insecure boundaries or share peer-side bridges.
 */
let bridge: SoftSignalHardwareBridge = nullSoftSignalHardware;

/**
 * WHAT: Replace the active Soft Signal hardware bridge implementation.
 * WHY: Tests inject spies; native bootstrap injects real module at app start.
 * CONSENT: Not a consent surface — wiring only; does not fire Soft Signal.
 * EDGE CASES: next must still honor localOnly/preempt semantics in real firmware.
 * NEVER: Set a bridge that blocks on network or requires peer acknowledgment.
 * SEE: getSoftSignalHardwareBridge; nullSoftSignalHardware
 */
export function setSoftSignalHardwareBridge(
  next: SoftSignalHardwareBridge,
): void {
  bridge = next;
}

/**
 * WHAT: Return the currently configured Soft Signal hardware bridge.
 * WHY: softSignalService emitHardware resolves bridge at call time so late inject works.
 * CONSENT: Not a consent surface — accessor only.
 * EDGE CASES: Always returns a bridge (never null); default is no-op.
 * NEVER: Construct a new bridge per call that loses test injection.
 * SEE: softSignalService production emitHardware
 */
export function getSoftSignalHardwareBridge(): SoftSignalHardwareBridge {
  return bridge;
}
