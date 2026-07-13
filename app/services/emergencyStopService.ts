/**
 * Emergency stop service — production wiring for unilateral session consent withdraw.
 *
 * Used by Soft Signal remote path. “Emergency stop” is product language for
 * immediate local+remote withdraw, NOT civic emergency services or crisis lines.
 * Local sensitive runtime is locked first; pending withdraw survives offline.
 *
 * SEE:
 * - app/services/emergencyStopServiceCore.ts
 * - app/services/softSignalService.ts
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical)
 */

import * as Crypto from "expo-crypto";
import { sensitiveDataService } from "./sensitiveDataService.ts";
import { pendingSafetyActionStorage } from "./secureSessionStorage.ts";
import { supabase } from "./supabase.ts";
import { createEmergencyStopService } from "./emergencyStopServiceCore.ts";

/**
 * WHAT: Production emergency-stop / Soft Signal remote withdraw service.
 * WHY: Bind secure pending storage, sensitive data lock, UUID idempotency, and
 *      Supabase withdraw_session_consent RPC into the shared core algorithm.
 * CONSENT: Unilateral withdraw via RPC — match/history never re-grants contact.
 *          Soft Signal remains not emergency services.
 * EDGE CASES:
 *   - RPC error → core throws path → stopped_pending_sync
 *   - lock() runs before network on every stop/reconcile
 * NEVER: Skip lock for convenience. Pass user “reason” into RPC from Soft Signal.
 *        Claim this dials emergency services.
 * SEE: createEmergencyStopService; withdraw_session_consent RPC
 */
export const emergencyStopService = createEmergencyStopService({
  // Durable pending withdraw blob (secure session storage) for offline retry.
  storage: pendingSafetyActionStorage,
  /**
   * WHAT: Lock sensitive/protected runtime data on this device at stop.
   * WHY: Order-matters privacy — local end clears protected material even if RPC fails.
   * CONSENT: Lock is not a penalty; it is fail-closed privacy after withdraw intent.
   * EDGE CASES: Called on stop and on reconcile when pending exists.
   * NEVER: Log contents of sensitive vault during lock.
   */
  clearProtectedRuntime: () => sensitiveDataService.lock(),
  // Cryptographic UUID for withdraw idempotency keys (not Soft Signal log ids).
  newId: Crypto.randomUUID,
  /**
   * WHAT: Call backend withdraw_session_consent with session + idempotency key.
   * WHY: Server-side session consent withdrawal for Soft Signal remote path.
   * CONSENT: Unilateral server withdraw — peer is not asked to approve stop.
   * EDGE CASES: error → throw → core returns stopped_pending_sync; data returned as resultingState.
   * NEVER: Attach private journal notes or required explanations to this RPC.
   *        Treat RPC success as emergency dispatch confirmation.
   * SEE: supabase.rpc withdraw_session_consent
   */
  async stopRemote(sessionId, idempotencyKey) {
    const { data, error } = await supabase.rpc("withdraw_session_consent", {
      p_session_id: sessionId,
      p_idempotency_key: idempotencyKey,
    });
    // Fail closed: any RPC error propagates so core keeps pending_sync.
    if (error) throw error;
    return data;
  },
});
