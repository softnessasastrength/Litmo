import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type PeerPublicSignals = {
  userId: string;
  accountAgeDays: number;
  completedSessions: number;
  profileComplete: boolean;
};

export const peerSignalsService = {
  async getPeerPublicSignals(userId: string): Promise<PeerPublicSignals> {
    try {
      const { data, error } = await supabase.rpc("peer_public_signals", {
        p_user_id: userId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") {
        throw new Error("Peer signals were unavailable.");
      }
      const r = row as {
        user_id: string;
        account_age_days: number;
        completed_sessions: number;
        profile_complete: boolean;
      };
      return {
        userId: r.user_id,
        accountAgeDays: Number(r.account_age_days) || 0,
        completedSessions: Number(r.completed_sessions) || 0,
        profileComplete: Boolean(r.profile_complete),
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
