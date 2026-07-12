import * as Crypto from "expo-crypto";
import { mapExternalError } from "./errors.ts";
import { pendingSessionCompleteStorage } from "./secureSessionStorage.ts";
import { createSessionCompleteService } from "./sessionCompleteServiceCore.ts";
import { supabase } from "./supabase.ts";

export const sessionCompleteService = createSessionCompleteService({
  storage: pendingSessionCompleteStorage,
  newId: Crypto.randomUUID,
  isRetryable(error) {
    return mapExternalError(error).retryable;
  },
  async completeRemote(sessionId, idempotencyKey) {
    const { data, error } = await supabase.rpc("transition_session", {
      p_session_id: sessionId,
      p_to_state: "completed",
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data as string;
  },
});
