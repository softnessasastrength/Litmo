import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export const REPORT_CATEGORIES = [
  { id: "harassment", label: "Harassment or intimidation" },
  { id: "coercion_pressure", label: "Pressure or coercion around consent" },
  { id: "boundary_violation", label: "Boundary was crossed" },
  { id: "unsafe_behavior", label: "Unsafe or concerning behavior" },
  { id: "impersonation", label: "Impersonation or fake account" },
  { id: "underage_concern", label: "Possible underage account" },
  { id: "spam_scam", label: "Spam or scam" },
  { id: "other", label: "Something else" },
] as const;

export type ReportCategoryId = (typeof REPORT_CATEGORIES)[number]["id"];

export type ReporterVisibleStatus = "submitted" | "under_review" | "closed";
export type ClosedOutcome = "no_action" | "action_taken" | "info_needed";

export type MyReport = {
  id: string;
  reportedId: string;
  sessionId: string | null;
  category: ReportCategoryId;
  status: ReporterVisibleStatus;
  closedOutcome: ClosedOutcome | null;
  createdAt: string;
};

export const reportService = {
  async submitReport(input: {
    reportedId: string;
    category: ReportCategoryId;
    sessionId?: string | null;
    /** Must already be a litmo:encrypted:v1: envelope or null/omitted. */
    encryptedPrivateNote?: string | null;
    idempotencyKey?: string | null;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("submit_report", {
        p_reported_id: input.reportedId,
        p_category: input.category,
        p_session_id: input.sessionId ?? null,
        p_private_note: input.encryptedPrivateNote ?? null,
        p_idempotency_key: input.idempotencyKey ?? null,
      });
      if (error) throw error;
      if (typeof data !== "string" || data.length < 1) {
        throw new Error("Report was not accepted.");
      }
      return data;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async listMyReports(): Promise<MyReport[]> {
    try {
      const { data, error } = await supabase.rpc("list_my_reports");
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          reported_id: string;
          session_id: string | null;
          category: string;
          status: string;
          closed_outcome: string | null;
          created_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        reportedId: row.reported_id,
        sessionId: row.session_id,
        category: row.category as ReportCategoryId,
        status: row.status as ReporterVisibleStatus,
        closedOutcome: row.closed_outcome as ClosedOutcome | null,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
