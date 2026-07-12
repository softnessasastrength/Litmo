import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export const blockService = {
  async blockUser(blockedId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("block_user", {
        p_blocked_id: blockedId,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  async unblockUser(blockedId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("unblock_user", {
        p_blocked_id: blockedId,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  async listBlockedUsers(): Promise<
    Array<{ blockedId: string; createdAt: string }>
  > {
    try {
      const { data, error } = await supabase.rpc("list_blocked_users");
      if (error) throw error;
      return (
        (data as Array<{ blocked_id: string; created_at: string }> | null) ?? []
      ).map((row) => ({
        blockedId: row.blocked_id as string,
        createdAt: row.created_at as string,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
