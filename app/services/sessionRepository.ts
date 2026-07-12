import * as Crypto from "expo-crypto";
import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export const sessionRepository = {
  /**
   * Transitions an active session to `completed` via the sole authenticated
   * write boundary (`transition_session`, migration 008). Required before
   * `submit_session_wrapup` will accept a wrap-up for this session, since
   * that function only accepts sessions already in a terminal state.
   */
  async completeSession(sessionId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("transition_session", {
        p_session_id: sessionId,
        p_to_state: "completed",
        p_idempotency_key: `complete-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
