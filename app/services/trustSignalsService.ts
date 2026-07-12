import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type MyTrustSignals = {
  accountAgeDays: number;
  profileComplete: boolean;
  adultEligible: boolean;
  completedSessions: number;
  softSignaledSessions: number;
  safetyEndedSessions: number;
};

export const trustSignalsService = {
  async myTrustSignals(): Promise<MyTrustSignals> {
    try {
      const { data, error } = await supabase.rpc("my_trust_signals");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") {
        throw new Error("Trust signals were unavailable.");
      }
      const r = row as {
        account_age_days: number;
        profile_complete: boolean;
        adult_eligible: boolean;
        completed_sessions: number;
        soft_signaled_sessions: number;
        safety_ended_sessions: number;
      };
      return {
        accountAgeDays: Number(r.account_age_days) || 0,
        profileComplete: Boolean(r.profile_complete),
        adultEligible: Boolean(r.adult_eligible),
        completedSessions: Number(r.completed_sessions) || 0,
        softSignaledSessions: Number(r.soft_signaled_sessions) || 0,
        safetyEndedSessions: Number(r.safety_ended_sessions) || 0,
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
