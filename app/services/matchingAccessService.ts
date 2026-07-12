import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type MatchingAccess = {
  matchingAllowed: boolean;
  restrictionKind: "matching_hold" | "permanent_ban" | null;
  endsAt: string | null;
};

export const matchingAccessService = {
  async myMatchingAccess(): Promise<MatchingAccess> {
    try {
      const { data, error } = await supabase.rpc("my_matching_access");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || typeof row !== "object") {
        throw new Error("Matching access status was unavailable.");
      }
      const r = row as {
        matching_allowed: boolean;
        restriction_kind: string | null;
        ends_at: string | null;
      };
      const kind =
        r.restriction_kind === "matching_hold" ||
        r.restriction_kind === "permanent_ban"
          ? r.restriction_kind
          : null;
      return {
        matchingAllowed: Boolean(r.matching_allowed),
        restrictionKind: kind,
        endsAt: r.ends_at ?? null,
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
