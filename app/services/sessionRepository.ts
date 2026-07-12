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
  /**
   * Creates a session request (migration 015, ADR 0015), or returns the
   * existing non-terminal session if one already exists between the same
   * two people in either direction.
   */
  async requestSession(recipientId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("request_session", {
        p_recipient_id: recipientId,
        p_idempotency_key: `request-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /** Recipient-only response to a `requested` session (migration 015). */
  async respondToRequest(
    sessionId: string,
    decision: "accepted" | "declined",
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("transition_session", {
        p_session_id: sessionId,
        p_to_state: decision,
        p_idempotency_key: `${decision}-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /** Incoming pending requests where the signed-in user is the recipient. */
  async listIncomingRequests(userId: string): Promise<
    Array<{
      id: string;
      requesterId: string;
      createdAt: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("id,user_a,created_at")
        .eq("user_b", userId)
        .eq("status", "requested")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id as string,
        requesterId: row.user_a as string,
        createdAt: row.created_at as string,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
