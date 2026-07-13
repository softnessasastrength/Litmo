/**
 * Staff moderation console service — queue, evidence, holds, HITL bans.
 *
 * WHAT: Thin RPC client over Chapter 5 + ADR 0061 safety-ops RPCs.
 * WHY: UI must not invent permanent bans or auto-punish from case counts.
 * CONSENT: Staff actions never grant participant consent; Soft Signal stays
 *          free for remaining participants.
 * NEVER: Client-side staff check is hide/show only; server is_staff_moderator
 *        is authoritative. Do not treat prior report counts as a safety score.
 * SEE: app/lib/safetyOpsCore.ts · docs/SAFETY_OPS_RUNTIME.md · ADR 0061
 */
import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";
import {
  validateRestrictionShape,
  type RestrictionReasonCode,
} from "../lib/safetyOpsCore.ts";

export type QueueStatus = "open" | "in_progress" | "escalated" | "resolved";
export type ClosedOutcome = "no_action" | "action_taken" | "info_needed";

export type PermanentBanPolicySnapshot = {
  twoPersonRequired: boolean;
  namedSecondOwnerConfigured: boolean;
  completionAllowed: boolean;
  distinctStaffCount: number;
};

export type PendingPermanentBanRequest = {
  id: string;
  targetUserId: string;
  reasonCode: string;
  caseId: string | null;
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
};

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

export type CaseEvidenceSession = {
  id: string;
  status: string;
  userA: string;
  userB: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

export type CaseEvidence = {
  caseId: string;
  reportId: string;
  priority: string;
  queueStatus: QueueStatus;
  assignedTo: string | null;
  category: string;
  reportStatus: string;
  reportCreatedAt: string;
  reporterId: string;
  reportedId: string;
  sessionId: string | null;
  staffSharedMessage: string | null;
  hasDevicePrivateNote: boolean;
  reportedActiveRestrictionKind: string | null;
  priorOpenCasesForReported: number;
  priorOtherReportsForReported: number;
  session: CaseEvidenceSession | null;
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

  async getCaseEvidence(caseId: string): Promise<CaseEvidence> {
    try {
      const { data, error } = await supabase.rpc(
        "get_moderation_case_evidence",
        { p_case_id: caseId },
      );
      if (error) throw error;
      const row = data as {
        case_id: string;
        report_id: string;
        priority: string;
        queue_status: string;
        assigned_to: string | null;
        category: string;
        report_status: string;
        report_created_at: string;
        reporter_id: string;
        reported_id: string;
        session_id: string | null;
        staff_shared_message: string | null;
        has_device_private_note: boolean;
        reported_active_restriction_kind: string | null;
        prior_open_cases_for_reported: number;
        prior_other_reports_for_reported: number;
        session: {
          id: string;
          status: string;
          user_a: string;
          user_b: string;
          created_at: string;
          started_at: string | null;
          ended_at: string | null;
        } | null;
      } | null;
      if (!row || typeof row.case_id !== "string") {
        throw new Error("Case evidence was not returned.");
      }
      return {
        caseId: row.case_id,
        reportId: row.report_id,
        priority: row.priority,
        queueStatus: row.queue_status as QueueStatus,
        assignedTo: row.assigned_to,
        category: row.category,
        reportStatus: row.report_status,
        reportCreatedAt: row.report_created_at,
        reporterId: row.reporter_id,
        reportedId: row.reported_id,
        sessionId: row.session_id,
        staffSharedMessage: row.staff_shared_message,
        hasDevicePrivateNote: Boolean(row.has_device_private_note),
        reportedActiveRestrictionKind: row.reported_active_restriction_kind,
        priorOpenCasesForReported: Number(
          row.prior_open_cases_for_reported ?? 0,
        ),
        priorOtherReportsForReported: Number(
          row.prior_other_reports_for_reported ?? 0,
        ),
        session: row.session
          ? {
              id: row.session.id,
              status: row.session.status,
              userA: row.session.user_a,
              userB: row.session.user_b,
              createdAt: row.session.created_at,
              startedAt: row.session.started_at,
              endedAt: row.session.ended_at,
            }
          : null,
      };
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
    reasonCode: RestrictionReasonCode,
    endsAtIso: string | null,
    internalNote: string | null,
  ): Promise<void> {
    const shape = validateRestrictionShape({
      kind: "matching_hold",
      reasonCode,
      endsAtIso,
    });
    if (!shape.ok) {
      throw new Error(shape.message);
    }
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

  /**
   * WHAT: Load fail-closed permanent-ban HITL policy for the console.
   * WHY: UI must show blocked dual-confirm until named second owner exists.
   * NEVER: Treat completionAllowed as legal approval — only engineering gate.
   */
  async getPermanentBanPolicy(): Promise<PermanentBanPolicySnapshot> {
    try {
      const { data, error } = await supabase.rpc("my_permanent_ban_policy");
      if (error) throw error;
      const row = (
        Array.isArray(data) ? data[0] : data
      ) as {
        two_person_required?: boolean;
        named_second_owner_configured?: boolean;
        completion_allowed?: boolean;
        distinct_staff_count?: number;
      } | null;
      return {
        twoPersonRequired: Boolean(row?.two_person_required ?? true),
        namedSecondOwnerConfigured: Boolean(
          row?.named_second_owner_configured ?? false,
        ),
        completionAllowed: Boolean(row?.completion_allowed ?? false),
        distinctStaffCount: Number(row?.distinct_staff_count ?? 0),
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  /**
   * WHAT: First-staff request for permanent ban (does not apply yet).
   * WHY: Article VII irreversible actions require dual human confirmation.
   * NEVER: Self-confirm; auto-apply from report volume.
   */
  async requestPermanentBan(
    userId: string,
    reasonCode: RestrictionReasonCode,
    internalNote: string | null,
    caseId: string | null,
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc("request_permanent_ban", {
        p_user_id: userId,
        p_reason_code: reasonCode,
        p_internal_note: internalNote,
        p_case_id: caseId,
      });
      if (error) throw error;
      if (typeof data !== "string" || data.length < 1) {
        throw new Error("Permanent ban request was not accepted.");
      }
      return data;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async listPendingPermanentBans(): Promise<PendingPermanentBanRequest[]> {
    try {
      const { data, error } = await supabase.rpc(
        "list_pending_permanent_ban_requests",
      );
      if (error) throw error;
      return (
        (data as Array<{
          id: string;
          target_user_id: string;
          reason_code: string;
          case_id: string | null;
          requested_by: string;
          requested_at: string;
          expires_at: string;
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        targetUserId: row.target_user_id,
        reasonCode: row.reason_code,
        caseId: row.case_id,
        requestedBy: row.requested_by,
        requestedAt: row.requested_at,
        expiresAt: row.expires_at,
      }));
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  /**
   * WHAT: Second distinct staff confirms a pending permanent ban.
   * WHY: Two-person HITL (founder S10). Requester cannot confirm own request.
   */
  async confirmPermanentBan(requestId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("confirm_permanent_ban", {
        p_request_id: requestId,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  async cancelPermanentBanRequest(requestId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("cancel_permanent_ban_request", {
        p_request_id: requestId,
      });
      if (error) throw error;
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
