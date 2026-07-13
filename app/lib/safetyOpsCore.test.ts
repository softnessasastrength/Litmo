/**
 * Safety operations pure-core unit tests.
 * SEE: safetyOpsCore.ts · docs/SAFETY_OPS_RUNTIME.md · ADR 0061
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PRIVATE_ALPHA_BAN_POLICY,
  MATCHING_PAUSE_PRESERVES,
  RATE_LIMIT_BUDGETS,
  SAFETY_OPS_CONSTITUTION_MAP,
  canResolveAppeal,
  canSubmitAppeal,
  canTransitionQueue,
  evaluateSafetyOpsFeature,
  isForbiddenTrustDisplayPattern,
  isQueueActionable,
  isRestrictionActive,
  isRoutineMatchingPauseScopeSafe,
  isUnderRateLimit,
  permanentBanCompletionAllowed,
  priorityForReportCategory,
  staffMayPerform,
  validatePermanentBanDualConfirm,
  validateRestrictionShape,
  validateTrustEventAppend,
} from "./safetyOpsCore.ts";

describe("safetyOpsCore — queue", () => {
  it("maps underage concern to urgent priority", () => {
    assert.equal(priorityForReportCategory("underage_concern"), "urgent");
    assert.equal(priorityForReportCategory("spam_scam"), "low");
    assert.equal(priorityForReportCategory("unknown"), "normal");
  });

  it("blocks transitions out of resolved", () => {
    assert.equal(canTransitionQueue("resolved", "open"), false);
    assert.equal(canTransitionQueue("open", "in_progress"), true);
    assert.equal(canTransitionQueue("escalated", "resolved"), true);
    assert.equal(isQueueActionable("resolved"), false);
    assert.equal(isQueueActionable("open"), true);
  });
});

describe("safetyOpsCore — restrictions", () => {
  it("rejects permanent ban with ends_at", () => {
    const r = validateRestrictionShape({
      kind: "permanent_ban",
      reasonCode: "policy_violation",
      endsAtIso: new Date(Date.now() + 86400000).toISOString(),
    });
    assert.equal(r.ok, false);
  });

  it("accepts matching hold with future ends_at", () => {
    const r = validateRestrictionShape({
      kind: "matching_hold",
      reasonCode: "safety_review",
      endsAtIso: new Date(Date.now() + 86400000).toISOString(),
    });
    assert.equal(r.ok, true);
  });

  it("detects active vs lifted restrictions", () => {
    const now = Date.parse("2026-07-13T12:00:00.000Z");
    assert.equal(
      isRestrictionActive({
        liftedAt: null,
        startsAt: "2026-07-12T00:00:00.000Z",
        endsAt: null,
        nowMs: now,
      }),
      true,
    );
    assert.equal(
      isRestrictionActive({
        liftedAt: "2026-07-13T01:00:00.000Z",
        startsAt: "2026-07-12T00:00:00.000Z",
        endsAt: null,
        nowMs: now,
      }),
      false,
    );
  });
});

describe("safetyOpsCore — appeals", () => {
  it("requires active restriction and statement", () => {
    assert.equal(
      canSubmitAppeal({
        restrictionActive: false,
        hasOpenAppeal: false,
        statement: "please reconsider",
      }).ok,
      false,
    );
    assert.equal(
      canSubmitAppeal({
        restrictionActive: true,
        hasOpenAppeal: true,
        statement: "please reconsider",
      }).ok,
      false,
    );
    assert.equal(
      canSubmitAppeal({
        restrictionActive: true,
        hasOpenAppeal: false,
        statement: "please reconsider",
      }).ok,
      true,
    );
  });

  it("only open appeals resolve", () => {
    assert.equal(
      canResolveAppeal({ status: "submitted", outcome: "lifted" }),
      true,
    );
    assert.equal(
      canResolveAppeal({ status: "upheld", outcome: "lifted" }),
      false,
    );
  });
});

describe("safetyOpsCore — rate limits", () => {
  it("enforces session_request budget of 20/hour", () => {
    const now = 1_000_000;
    const events = Array.from({ length: 20 }, (_, i) => now - i * 1000);
    assert.equal(
      isUnderRateLimit({
        action: "session_request",
        eventTimestampsMs: events,
        nowMs: now,
      }).allowed,
      false,
    );
    assert.equal(
      isUnderRateLimit({
        action: "session_request",
        eventTimestampsMs: events.slice(1),
        nowMs: now,
      }).allowed,
      true,
    );
    assert.equal(RATE_LIMIT_BUDGETS.appeal.max, 5);
  });
});

describe("safetyOpsCore — trust ledger", () => {
  it("rejects unknown types and non-object metadata", () => {
    assert.equal(
      validateTrustEventAppend({ eventType: "account_restricted" }).ok,
      true,
    );
    assert.equal(
      validateTrustEventAppend({ eventType: "public_score_updated" }).ok,
      false,
    );
    assert.equal(
      validateTrustEventAppend({
        eventType: "session_completed",
        metadata: [],
      }).ok,
      false,
    );
    assert.equal(isForbiddenTrustDisplayPattern("public_safety_score"), true);
  });
});

describe("safetyOpsCore — HITL permanent ban", () => {
  it("fails closed when second owner not named", () => {
    const gate = permanentBanCompletionAllowed(DEFAULT_PRIVATE_ALPHA_BAN_POLICY);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.code, "named_second_owner_missing");
    }
  });

  it("requires distinct staff when two-person required", () => {
    const policy = {
      twoPersonRequired: true,
      namedSecondOwnerConfigured: true,
      distinctStaffCount: 2,
    };
    assert.equal(permanentBanCompletionAllowed(policy).allowed, true);
    const same = validatePermanentBanDualConfirm({
      targetUserId: "u1",
      requestedBy: "staffA",
      confirmedBy: "staffA",
      policy,
    });
    assert.equal(same.ok, false);
    const ok = validatePermanentBanDualConfirm({
      targetUserId: "u1",
      requestedBy: "staffA",
      confirmedBy: "staffB",
      policy,
    });
    assert.equal(ok.ok, true);
  });

  it("allows single-staff path only when two-person not required", () => {
    const policy = {
      twoPersonRequired: false,
      namedSecondOwnerConfigured: false,
      distinctStaffCount: 1,
    };
    assert.equal(permanentBanCompletionAllowed(policy).allowed, true);
  });
});

describe("safetyOpsCore — staff matrix and pause", () => {
  it("denies non-staff console actions", () => {
    assert.equal(staffMayPerform("none", "list_queue"), false);
    assert.equal(staffMayPerform("moderator", "apply_matching_hold"), true);
    assert.equal(staffMayPerform("admin", "confirm_permanent_ban"), true);
  });

  it("routine matching pause must preserve Soft Signal", () => {
    assert.ok(MATCHING_PAUSE_PRESERVES.includes("soft_signal"));
    assert.equal(
      isRoutineMatchingPauseScopeSafe({
        blocksDiscovery: true,
        blocksNewRequests: true,
        removesSoftSignal: false,
        forceEndsActiveSessions: false,
      }),
      true,
    );
    assert.equal(
      isRoutineMatchingPauseScopeSafe({
        blocksDiscovery: true,
        blocksNewRequests: true,
        removesSoftSignal: true,
        forceEndsActiveSessions: false,
      }),
      false,
    );
  });
});

describe("safetyOpsCore — constitution gate", () => {
  it("maps subsystems to Living Constitution articles", () => {
    assert.ok(
      SAFETY_OPS_CONSTITUTION_MAP.permanentBanHitl.includes("VII_irreversible"),
    );
    assert.ok(
      SAFETY_OPS_CONSTITUTION_MAP.trustLedger.includes(
        "II_4_trust_not_safety_cert",
      ),
    );
  });

  it("evaluateSafetyOpsFeature fails closed on auto-punish and scores", () => {
    const bad = evaluateSafetyOpsFeature({
      autoPunishesFromReports: true,
      createsPublicSafetyScore: true,
      impliesEmergencyServices: false,
      permanentBanWithoutHitlWhenRequired: true,
      removesSoftSignalOnMatchingPause: false,
      documentsConstitutionArticles: true,
    });
    assert.equal(bad.ok, false);
    const good = evaluateSafetyOpsFeature({
      autoPunishesFromReports: false,
      createsPublicSafetyScore: false,
      impliesEmergencyServices: false,
      permanentBanWithoutHitlWhenRequired: false,
      removesSoftSignalOnMatchingPause: false,
      documentsConstitutionArticles: true,
    });
    assert.equal(good.ok, true);
  });
});
