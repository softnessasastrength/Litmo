/**
 * WHAT: Mode-aware copy façade — screens import from here, never hardcode packs.
 * WHY:  Compile-time mode selects maximum vs app_store strings; Maximum source
 *       stays in the repo for non-store builds.
 * CONSENT: Both packs forbid reason-to-stop and safety-score language.
 * SEE: docs/BUILD_MODES.md, maximumCopy.ts, appStoreCopy.ts.
 */

import { IS_APP_STORE_BUILD, type LitmoBuildMode } from "../buildMode.ts";
import { appStoreCopy } from "./appStoreCopy.ts";
import { maximumCopy } from "./maximumCopy.ts";
import type { ModeCopyPack } from "./types.ts";

export type { ModeCopyPack, SoftSignalCopyPack, EntryCopyPack, WelcomeCopyPack } from "./types.ts";
export { maximumCopy, appStoreCopy };

/**
 * WHAT: Active copy pack for this binary.
 * WHY:  SoftSignalButton, entry, welcome read one object.
 */
export const modeCopy: ModeCopyPack = IS_APP_STORE_BUILD
  ? appStoreCopy
  : maximumCopy;

/** Soft Signal strings for the active mode. */
export const softSignalCopy = modeCopy.softSignal;

/** Entry screen strings for the active mode. */
export const entryCopy = modeCopy.entry;

/** Welcome screen strings for the active mode. */
export const welcomeCopy = modeCopy.welcome;

/**
 * WHAT: Select copy pack by mode (tests / previews).
 * WHY:  Snapshot tests can assert both voices without rebuilding.
 */
export function copyForMode(mode: LitmoBuildMode): ModeCopyPack {
  return mode === "app_store" ? appStoreCopy : maximumCopy;
}
