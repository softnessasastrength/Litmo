import * as Crypto from "expo-crypto";
import { runtimeConfig } from "../config/runtime.ts";
import { PublicAppError, mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type PersistedSnapshot = {
  id: string;
  fingerprint: string;
};

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
      if (data !== decision) {
        throw new PublicAppError(
          "validation_failed",
          "That request expired before you responded.",
        );
      }
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Advances a just-accepted session toward consent confirmation
   * (`accepted -> consent_pending`, migration 008/011). Either participant
   * may call this; it's idempotent (a retry against an already-
   * consent_pending session is a no-op, not an error).
   */
  async beginConsentReview(sessionId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("transition_session", {
        p_session_id: sessionId,
        p_to_state: "consent_pending",
        p_idempotency_key: `consent-pending-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Calls the privileged backend endpoint (backend/routes/sessionSnapshots.js)
   * that computes and persists a real canonical Consent Snapshot from both
   * participants' exact latest profile versions. Requires
   * EXPO_PUBLIC_BACKEND_URL to be configured and reachable (see
   * docs/LOCAL_DEVELOPMENT.md) -- there is no Supabase-only fallback.
   */
  async createSnapshot(sessionId: string): Promise<PersistedSnapshot> {
    if (!runtimeConfig.backendUrl) {
      throw new PublicAppError(
        "unexpected_error",
        "No backend service is configured. This step can't run right now.",
      );
    }
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken)
        throw new PublicAppError(
          "auth_session_expired",
          "Your session ended. Please sign in again.",
        );
      const response = await fetch(
        `${runtimeConfig.backendUrl}/api/sessions/${sessionId}/snapshot`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const body = (await response.json()) as {
        snapshot?: { id: string; fingerprint: string };
        error?: string;
      };
      if (!response.ok || !body.snapshot) throw new Error(body.error);
      return { id: body.snapshot.id, fingerprint: body.snapshot.fingerprint };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Records this participant's confirmation of an exact snapshot fingerprint
   * (migration 009/011). Returns "ready" once both participants have
   * confirmed (which also auto-transitions the session to `ready`), or
   * "consent_pending" while still waiting on the other participant.
   */
  async confirmSnapshot(
    snapshotId: string,
    fingerprint: string,
  ): Promise<"ready" | "consent_pending"> {
    try {
      const { data, error } = await supabase.rpc("confirm_session_snapshot", {
        p_snapshot_id: snapshotId,
        p_fingerprint: fingerprint,
      });
      if (error) throw error;
      return data as "ready" | "consent_pending";
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Transitions a `ready` session (both participants confirmed the same
   * snapshot) to `active`. Either participant may call this.
   */
  async activateSession(sessionId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("transition_session", {
        p_session_id: sessionId,
        p_to_state: "active",
        p_idempotency_key: `activate-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /** Current status and activation time of a session (migration 016). */
  async getSession(
    sessionId: string,
  ): Promise<{ status: string; startedAt: string | null }> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("status,started_at")
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return {
        status: data.status as string,
        startedAt: data.started_at as string | null,
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Subscribes to real-time changes on a session row (migration 016 adds
   * `sessions` to the `supabase_realtime` publication) so a participant sees
   * the other participant's actions -- soft signal, completion -- without
   * manually refreshing. Returns an unsubscribe function.
   */
  subscribeToSession(
    sessionId: string,
    onChange: (session: { status: string; startedAt: string | null }) => void,
  ): () => void {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: string;
            started_at: string | null;
          };
          onChange({ status: row.status, startedAt: row.started_at });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
  /**
   * Subscribes to session rows where this user is the recipient (`user_b`).
   * `request_session` always stores the recipient as user_b (migration 015).
   * Fires on INSERT (new request) and UPDATE (accept/decline/expire) so the
   * incoming-requests UI and home badge can refresh without a manual pull.
   * Uses the existing `sessions` Realtime publication (migration 016); RLS
   * still limits which rows this client can observe. Not push notifications —
   * in-app only. Returns an unsubscribe function.
   */
  subscribeToIncomingRequests(
    recipientId: string,
    onChange: (event: "INSERT" | "UPDATE") => void,
  ): () => void {
    const channel = supabase
      .channel(`incoming-requests-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `user_b=eq.${recipientId}`,
        },
        () => onChange("INSERT"),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `user_b=eq.${recipientId}`,
        },
        () => onChange("UPDATE"),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
  /** Incoming pending requests where the signed-in user is the recipient. */
  async listIncomingRequests(): Promise<
    Array<{
      id: string;
      requesterId: string;
      createdAt: string;
      expiresAt: string;
    }>
  > {
    try {
      const { data, error } = await supabase.rpc("list_incoming_requests");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          requester_id: string;
          created_at: string;
          expires_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id as string,
        requesterId: row.requester_id as string,
        createdAt: row.created_at as string,
        expiresAt: row.expires_at as string,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /** Outgoing pending requests where the signed-in user is the requester. */
  async listOutgoingRequests(): Promise<
    Array<{
      id: string;
      recipientId: string;
      createdAt: string;
      expiresAt: string;
    }>
  > {
    try {
      const { data, error } = await supabase.rpc("list_outgoing_requests");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          recipient_id: string;
          created_at: string;
          expires_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id as string,
        recipientId: row.recipient_id as string,
        createdAt: row.created_at as string,
        expiresAt: row.expires_at as string,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  /**
   * Cancels a pending `requested` session (migration 015 graph). Either
   * participant may cancel; only the recipient may accept/decline.
   */
  async cancelRequest(sessionId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("transition_session", {
        p_session_id: sessionId,
        p_to_state: "cancelled",
        p_idempotency_key: `cancel-${Crypto.randomUUID()}`,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
