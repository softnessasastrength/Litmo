import { PublicAppError, mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type MyDataExport = Record<string, unknown> & {
  generated_at?: string;
};

export function normalizeInviteCode(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidInviteCode(value: string): boolean {
  return /^[0-9a-f]{48}$/.test(normalizeInviteCode(value));
}

export const safetyOpsService = {
  async amIPrivateAlphaMember(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_private_alpha_member");
      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async redeemPrivateAlphaInvite(code: string): Promise<void> {
    const normalized = normalizeInviteCode(code);
    if (!isValidInviteCode(normalized)) {
      throw new PublicAppError(
        "validation_failed",
        "Enter the 48-character invitation code exactly as it was shared.",
      );
    }
    try {
      const { data, error } = await supabase.rpc(
        "redeem_private_alpha_invite",
        { p_code: normalized },
      );
      if (error) throw error;
      if (data !== true) throw new Error("Invitation was not redeemed.");
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async issuePrivateAlphaInvite(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc(
        "issue_private_alpha_invite",
      );
      if (error) throw error;
      if (typeof data !== "string" || !isValidInviteCode(data)) {
        throw new Error("Invitation code was not returned.");
      }
      return data;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async isMatchingPaused(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_matching_paused");
      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async setMatchingPaused(enabled: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("set_matching_paused", {
        p_enabled: enabled,
      });
      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async exportMyData(): Promise<MyDataExport> {
    try {
      const { data, error } = await supabase.rpc("export_my_data");
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Data export was not returned.");
      }
      return data as MyDataExport;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
