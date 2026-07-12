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
