import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type QueueStatus = "open" | "in_progress" | "escalated" | "resolved";
export type ClosedOutcome = "no_action" | "action_taken" | "info_needed";

export type ModerationQueueRow = {
  caseId: string;
  reportId: string;
  priority: string;
  queueStatus: QueueStatus;
  assignedTo: string | null;
  category: string;
  reportedId: string;
  sessionId: string | null;
  reportStatus: string;
  reportCreatedAt: string;
  caseCreatedAt: string;
};

export type ModerationNote = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export const moderationService = {
  async amIStaffModerator(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_staff_moderator");
      if (error) throw error;
      return Boolean(data);
    } catch {
      // Fail closed: non-staff or network errors hide the console.
      return false;
    }
  },

  async listQueue(
    queueStatus?: QueueStatus | null,
  ): Promise<ModerationQueueRow[]> {
    try {
      const { data, error } = await supabase.rpc("list_moderation_queue", {
        p_queue_status: queueStatus ?? null,
      });
      if (error) throw error;
      return (
        (data as Array<{
          case_id: string;
          report_id: string;
          priority: string;
          queue_status: string;
          assigned_to: string | null;
          category: string;
          reported_id: string;
          session_id: string | null;
          report_status: string;
          report_created_at: string;
          case_created_at: string;
        }> | null) ?? []
      ).map((row) => ({
        caseId: row.case_id,
        reportId: row.report_id,
        priority: row.priority,
        queueStatus: row.queue_status as QueueStatus,
        assignedTo: row.assigned_to,
        category: row.category,
        reportedId: row.reported_id,
        sessionId: row.session_id,
        reportStatus: row.report_status,
        reportCreatedAt: row.report_created_at,
        caseCreatedAt: row.case_created_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async claimCase(caseId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("claim_moderation_case", {
        p_case_id: caseId,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async addNote(caseId: string, body: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("add_moderation_note", {
        p_case_id: caseId,
        p_body: body,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async listNotes(caseId: string): Promise<ModerationNote[]> {
    try {
      const { data, error } = await supabase.rpc("list_moderation_case_notes", {
        p_case_id: caseId,
      });
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          author_id: string;
          body: string;
          created_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        authorId: row.author_id,
        body: row.body,
        createdAt: row.created_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async resolveCase(
    caseId: string,
    closedOutcome: ClosedOutcome,
    queueStatus: "resolved" | "escalated" = "resolved",
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("resolve_moderation_case", {
        p_case_id: caseId,
        p_closed_outcome: closedOutcome,
        p_queue_status: queueStatus,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async applyMatchingHold(
    userId: string,
    reasonCode:
      | "policy_violation"
      | "safety_review"
      | "underage_concern"
      | "harassment"
      | "impersonation"
      | "spam_abuse"
      | "legal_request"
      | "other",
    endsAtIso: string | null,
    internalNote: string | null,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("apply_account_restriction", {
        p_user_id: userId,
        p_kind: "matching_hold",
        p_reason_code: reasonCode,
        p_ends_at: endsAtIso,
        p_internal_note: internalNote,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
