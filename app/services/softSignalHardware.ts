/**
 * Hardware Soft Signal bridge — phone no-op / future native module.
 * Firmware must implement SoftSignalHardwareCommand from softSignalCore.
 */

import type { SoftSignalHardwareCommand } from "../lib/softSignalCore.ts";

export type SoftSignalHardwareBridge = {
  /**
   * Fire Soft Signal pattern on device actuators/LED.
   * Must never throw into the safety path; failures are swallowed.
   */
  emit(command: SoftSignalHardwareCommand): Promise<void>;
  /** True when a physical Litmo device Soft Signal control is present. */
  isAvailable(): Promise<boolean>;
};

/** Default: no hardware; in-app haptics carry acknowledgement. */
export const nullSoftSignalHardware: SoftSignalHardwareBridge = {
  async emit() {
    // Future: NativeModules.LitmoSoftSignal.emit(JSON.stringify(command))
  },
  async isAvailable() {
    return false;
  },
};

let bridge: SoftSignalHardwareBridge = nullSoftSignalHardware;

export function setSoftSignalHardwareBridge(
  next: SoftSignalHardwareBridge,
): void {
  bridge = next;
}

export function getSoftSignalHardwareBridge(): SoftSignalHardwareBridge {
  return bridge;
}
