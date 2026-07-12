import * as Crypto from "expo-crypto";
import { sensitiveDataService } from "./sensitiveDataService.ts";
import { pendingSafetyActionStorage } from "./secureSessionStorage.ts";
import { supabase } from "./supabase.ts";
import { createEmergencyStopService } from "./emergencyStopServiceCore.ts";

export const emergencyStopService = createEmergencyStopService({
  storage: pendingSafetyActionStorage,
  clearProtectedRuntime: () => sensitiveDataService.lock(),
  newId: Crypto.randomUUID,
  async stopRemote(sessionId, idempotencyKey) {
    const { data, error } = await supabase.rpc("withdraw_session_consent", {
      p_session_id: sessionId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data;
  },
});
