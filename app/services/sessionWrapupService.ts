import * as Crypto from "expo-crypto";
import { sensitiveDataService } from "./sensitiveDataService.ts";
import { pendingWrapupStorage } from "./secureSessionStorage.ts";
import { supabase } from "./supabase.ts";
import { createSessionWrapupService } from "./sessionWrapupServiceCore.ts";

export const sessionWrapupService = createSessionWrapupService({
  newId: Crypto.randomUUID,
  storage: pendingWrapupStorage,
  async encryptNote(sessionId, note) {
    const envelope = await sensitiveDataService.encryptText(
      note,
      `session:${sessionId}:wrapup-note`,
    );
    if (envelope === null) throw new Error("encryption_failed");
    return envelope;
  },
  async submitRemote({ sessionId, outcome, encryptedNote, idempotencyKey }) {
    const { data, error } = await supabase.rpc("submit_session_wrapup", {
      p_session_id: sessionId,
      p_outcome: outcome,
      p_private_note: encryptedNote,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data as string;
  },
});
