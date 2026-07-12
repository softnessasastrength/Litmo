import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type ActiveRestriction = {
  id: string;
  kind: "matching_hold" | "permanent_ban";
  startsAt: string;
  endsAt: string | null;
  hasOpenAppeal: boolean;
};

export type MyAppeal = {
  id: string;
  restrictionId: string;
  restrictionKind: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type OpenAppeal = {
  id: string;
  restrictionId: string;
  appellantId: string;
  restrictionKind: string;
  statement: string;
  status: string;
  createdAt: string;
};

export const appealService = {
  async listMyActiveRestrictions(): Promise<ActiveRestriction[]> {
    try {
      const { data, error } = await supabase.rpc("list_my_active_restrictions");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          kind: string;
          starts_at: string;
          ends_at: string | null;
          has_open_appeal: boolean;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        kind: row.kind as ActiveRestriction["kind"],
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        hasOpenAppeal: Boolean(row.has_open_appeal),
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async submitAppeal(
    restrictionId: string,
    statement: string,
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("submit_restriction_appeal", {
        p_restriction_id: restrictionId,
        p_statement: statement,
      });
      if (error) throw error;
      if (typeof data !== "string" || data.length < 1) {
        throw new Error("Appeal was not accepted.");
      }
      return data;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async listMyAppeals(): Promise<MyAppeal[]> {
    try {
      const { data, error } = await supabase.rpc("list_my_appeals");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          restriction_id: string;
          restriction_kind: string;
          status: string;
          created_at: string;
          resolved_at: string | null;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        restrictionId: row.restriction_id,
        restrictionKind: row.restriction_kind,
        status: row.status,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async listOpenAppeals(): Promise<OpenAppeal[]> {
    try {
      const { data, error } = await supabase.rpc("list_open_appeals");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          restriction_id: string;
          appellant_id: string;
          restriction_kind: string;
          statement: string;
          status: string;
          created_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        restrictionId: row.restriction_id,
        appellantId: row.appellant_id,
        restrictionKind: row.restriction_kind,
        statement: row.statement,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async resolveAppeal(
    appealId: string,
    outcome: "upheld" | "lifted",
    staffNote?: string | null,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("resolve_restriction_appeal", {
        p_appeal_id: appealId,
        p_outcome: outcome,
        p_staff_note: staffNote ?? null,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
