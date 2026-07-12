import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type DiscoveryProfile = {
  userId: string;
  displayName: string;
  pronouns: string | null;
  bio: string | null;
  vibeArchetype: string | null;
  accountAgeDays: number;
  completedSessions: number;
};

const palette = [
  "#DDE9DF",
  "#F9E4D4",
  "#EEE2EC",
  "#E8EEF5",
  "#F5E8E4",
] as const;
const glyphs = ["≈", "☼", "✦", "○", "◇"] as const;

/** Stable cosmetic accent for repository-backed cards (not a trust signal). */
export function cosmeticForUserId(userId: string): {
  color: string;
  glyph: string;
} {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % 997;
  }
  return {
    color: palette[hash % palette.length] ?? palette[0],
    glyph: glyphs[hash % glyphs.length] ?? glyphs[0],
  };
}

export const discoveryService = {
  async listProfiles(): Promise<DiscoveryProfile[]> {
    try {
      const { data, error } = await supabase.rpc("discovery_profiles");
      if (error) throw error;
      return (
        (data as Array<{
          user_id: string;
          display_name: string;
          pronouns: string | null;
          bio: string | null;
          vibe_archetype: string | null;
          account_age_days: number;
          completed_sessions: number;
        }> | null) ?? []
      ).map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        pronouns: row.pronouns,
        bio: row.bio,
        vibeArchetype: row.vibe_archetype,
        accountAgeDays: Number(row.account_age_days) || 0,
        completedSessions: Number(row.completed_sessions) || 0,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
