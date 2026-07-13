/**
 * Nuclear session lifecycle + Consent Snapshot authority machine.
 *
 * WHAT: Second-level pure product law over ADR 0005 coarse lifecycle and
 *       Chapter 3 Consent Snapshot: immutability/verification, dual seal,
 *       revocation propagation, offline conflict resolution, wrap-up.
 * WHY:  Coarse states alone are not enough for second-by-second safety.
 *       Agents and servers need one fail-closed machine so UI cannot invent
 *       reopen, silent re-seal, or offline-wins-over-Soft-Signal paths.
 * CONSENT (Living Constitution):
 *   - I: specific, mutual, revocable; match ≠ consent; Soft Signal free
 *   - II: safety is product logic; stop easier than continue
 *   - VII: fail closed on uncertainty / conflict
 *   - X: honest about offline and terminal outcomes
 * EDGE CASES: dual Soft Signal, complete vs soft_signal race, confirm after
 *             revoke, material invalidation, offline queue replay, wrap-up
 *             after any terminal path.
 * NEVER: Silence = yes; Soft Signal reopen; confirm withdrawn fingerprint;
 *        offline complete beats server Soft Signal; forge mutual seal from
 *        one party; mutate fingerprint after create.
 * SEE: sessionLifecycle.ts · consentSnapshot.ts · continuousConsent (app) ·
 *      docs/CONTINUOUS_CONSENT_SYSTEM.md · ADR 0005 · ADR 0006 · ADR 0062
 */

import {
  type ConsentLifecycleState,
  type ConsentSnapshotRecord,
  stableFingerprint,
  withdrawConsent,
} from "./consentSnapshot.ts";
import {
  canTransition,
  isTerminalState,
  transition,
  type TransitionResult,
} from "./sessionLifecycle.ts";

export const SESSION_CONSENT_NUCLEAR_VERSION = 1 as const;

// ── Second-level phases & microstates ──────────────────────────────────────

/**
 * WHAT: Coarse phase buckets over the ADR 0005 lifecycle graph.
 * WHY: UI and offline queues reason about phase before microstate detail.
 * CONSENT: Phase alone never authorizes touch.
 */
export const SESSION_PHASES = [
  "drafting",
  "matching",
  "consent_seal",
  "active_contact",
  "wrap_up",
  "terminal",
] as const;
export type SessionPhase = (typeof SESSION_PHASES)[number];

/**
 * WHAT: Maximum-granularity microstates nested under phases.
 * WHY: Second-level machine for seal progress, live contact, wrap-up.
 * CONSENT: Only dual_sealed + active_green (+ continuous layer) can approach contact.
 * NEVER: Treat dual_sealed as permanent safety certificate.
 */
export const SESSION_MICROSTATES = [
  // drafting / matching
  "idle_draft",
  "request_open",
  "request_declined",
  "request_cancelled",
  "request_expired",
  // consent seal
  "awaiting_snapshot",
  "snapshot_created",
  "awaiting_confirm_a",
  "awaiting_confirm_b",
  "awaiting_confirm_both",
  "dual_sealed",
  "seal_invalidated",
  "seal_withdrawn",
  // active contact
  "active_green",
  "active_reduced",
  "active_check_in_due",
  "active_local_soft_signal",
  "active_safety_ending",
  // wrap-up
  "wrap_pending",
  "wrap_a_submitted",
  "wrap_b_submitted",
  "wrap_both_done",
  "wrap_skipped",
  // terminal
  "term_completed",
  "term_soft_signaled",
  "term_safety_ended",
  "term_cancelled",
  "term_expired",
  "term_declined",
] as const;
export type SessionMicrostate = (typeof SESSION_MICROSTATES)[number];

/**
 * WHAT: Map coarse lifecycle state → default phase.
 * WHY: Bridge ADR 0005 states into nuclear phases without redefining them.
 */
export function phaseForLifecycle(
  state: ConsentLifecycleState,
): SessionPhase {
  switch (state) {
    case "draft":
      return "drafting";
    case "requested":
    case "accepted":
      return "matching";
    case "consent_pending":
    case "ready":
      return "consent_seal";
    case "active":
      return "active_contact";
    case "completed":
    case "soft_signaled":
    case "safety_ended":
      return "wrap_up"; // wrap-up allowed; phase may stay wrap_up until both done
    case "declined":
    case "cancelled":
    case "expired":
      return "terminal";
    default:
      return "terminal";
  }
}

/**
 * WHAT: Infer microstate from lifecycle + seal + wrap facts (pure).
 * WHY: Clients and tests derive UI without inventing a second server truth.
 * CONSENT: dual_sealed only when mutual confirm + not withdrawn/invalid.
 * EDGE: Terminal lifecycle forces term_* microstates over wrap_* if wrap closed.
 */
export function deriveMicrostate(input: {
  lifecycle: ConsentLifecycleState;
  seal: SealAuthorityView;
  wrap: WrapUpView;
  continuousHint?: "green" | "reduced" | "check_in" | "local_stop" | "safety";
}): SessionMicrostate {
  const { lifecycle, seal, wrap } = input;
  if (lifecycle === "draft") return "idle_draft";
  if (lifecycle === "requested") return "request_open";
  if (lifecycle === "declined") return "term_declined";
  if (lifecycle === "cancelled") return "term_cancelled";
  if (lifecycle === "expired") return "term_expired";
  if (lifecycle === "soft_signaled") {
    if (wrap.bothDone) return "wrap_both_done";
    if (wrap.skipped) return "wrap_skipped";
    if (wrap.aSubmitted && !wrap.bSubmitted) return "wrap_a_submitted";
    if (wrap.bSubmitted && !wrap.aSubmitted) return "wrap_b_submitted";
    return wrap.anyPending ? "wrap_pending" : "term_soft_signaled";
  }
  if (lifecycle === "safety_ended") {
    if (wrap.bothDone) return "wrap_both_done";
    if (wrap.skipped) return "wrap_skipped";
    return wrap.anyPending ? "wrap_pending" : "term_safety_ended";
  }
  if (lifecycle === "completed") {
    if (wrap.bothDone) return "wrap_both_done";
    if (wrap.skipped) return "wrap_skipped";
    if (wrap.aSubmitted && !wrap.bSubmitted) return "wrap_a_submitted";
    if (wrap.bSubmitted && !wrap.aSubmitted) return "wrap_b_submitted";
    return wrap.anyPending ? "wrap_pending" : "term_completed";
  }
  if (lifecycle === "accepted") return "awaiting_snapshot";
  if (lifecycle === "consent_pending") {
    if (seal.withdrawn) return "seal_withdrawn";
    if (seal.invalidated) return "seal_invalidated";
    if (!seal.hasSnapshot) return "awaiting_snapshot";
    if (seal.confirmedByA && seal.confirmedByB) return "dual_sealed";
    if (!seal.confirmedByA && !seal.confirmedByB) return "awaiting_confirm_both";
    if (seal.confirmedByA) return "awaiting_confirm_b";
    return "awaiting_confirm_a";
  }
  if (lifecycle === "ready") {
    if (seal.withdrawn) return "seal_withdrawn";
    if (seal.invalidated) return "seal_invalidated";
    return isMutuallyConfirmed(seal) ? "dual_sealed" : "awaiting_confirm_both";
  }
  if (lifecycle === "active") {
    const hint = input.continuousHint ?? "green";
    if (hint === "local_stop") return "active_local_soft_signal";
    if (hint === "safety") return "active_safety_ending";
    if (hint === "check_in") return "active_check_in_due";
    if (hint === "reduced") return "active_reduced";
    return "active_green";
  }
  return "idle_draft";
}

// ── Immutable / verifiable snapshots ───────────────────────────────────────

/**
 * WHAT: Pure view of seal authority for dual-confirm verification.
 * WHY: Separate confirmations table means clients assemble a view, then verify.
 * CONSENT: mutuallyConfirmed requires both ids, same fingerprint, not withdrawn/invalid.
 */
export type SealAuthorityView = {
  hasSnapshot: boolean;
  fingerprint: string | null;
  withdrawn: boolean;
  invalidated: boolean;
  confirmedByA: boolean;
  confirmedByB: boolean;
  userAId: string;
  userBId: string;
  /** Confirm fingerprints must match snapshot fingerprint when set. */
  confirmFingerprintA: string | null;
  confirmFingerprintB: string | null;
};

/**
 * WHAT: True only when both parties confirmed the exact unwithdrawn fingerprint.
 * WHY: Activation and contact require dual seal of the same map (ADR 0006).
 * NEVER: Count a confirmation with mismatched fingerprint.
 */
export function isMutuallyConfirmed(seal: SealAuthorityView): boolean {
  if (!seal.hasSnapshot || !seal.fingerprint) return false;
  if (seal.withdrawn || seal.invalidated) return false;
  if (!seal.confirmedByA || !seal.confirmedByB) return false;
  if (
    seal.confirmFingerprintA !== seal.fingerprint ||
    seal.confirmFingerprintB !== seal.fingerprint
  ) {
    return false;
  }
  return true;
}

/**
 * WHAT: Recompute fingerprint from frozen payload fields and compare.
 * WHY: Verifiable immutability — stored fingerprint must match content.
 * CONSENT: Match is identity of the map, not consent.
 * EDGE: Uses same stableFingerprint as createConsentSnapshot payload shape.
 */
export function verifySnapshotFingerprint(input: {
  sessionId: string;
  profileA: unknown;
  profileB: unknown;
  compatibility: unknown;
  expectedFingerprint: string;
}): { ok: true } | { ok: false; code: "fingerprint_mismatch" } {
  const payload = {
    sessionId: input.sessionId,
    profileA: input.profileA,
    profileB: input.profileB,
    compatibility: input.compatibility,
  };
  const computed = stableFingerprint(payload);
  if (computed !== input.expectedFingerprint) {
    return { ok: false, code: "fingerprint_mismatch" };
  }
  return { ok: true };
}

/**
 * WHAT: Whether a snapshot record may still receive confirmations.
 * WHY: Withdrawn / material-invalid / empty fingerprint fail closed.
 */
export function snapshotIsConfirmable(
  snapshot: Pick<
    ConsentSnapshotRecord,
    "fingerprint" | "withdrawnAt"
  > & { invalidatedAt?: string | null },
): boolean {
  if (!snapshot.fingerprint || snapshot.fingerprint.length !== 64) return false;
  if (snapshot.withdrawnAt) return false;
  if (snapshot.invalidatedAt) return false;
  return true;
}

/**
 * WHAT: After dual seal, which fields are immutable forever for that row.
 * WHY: Product law for DB triggers and adapters — only withdraw/invalidate may change.
 */
export const SNAPSHOT_IMMUTABLE_FIELDS = [
  "sessionId",
  "profileAId",
  "profileAVersion",
  "profileBId",
  "profileBVersion",
  "fingerprint",
  "compatibility",
  "createdAt",
] as const;

/**
 * WHAT: Detect illegal mutation of an existing snapshot row shape.
 * WHY: Immutability is a security property of the seal, not a style preference.
 */
export function detectIllegalSnapshotMutation(
  before: ConsentSnapshotRecord,
  after: ConsentSnapshotRecord,
): string[] {
  const illegal: string[] = [];
  for (const field of SNAPSHOT_IMMUTABLE_FIELDS) {
    const b = before[field as keyof ConsentSnapshotRecord];
    const a = after[field as keyof ConsentSnapshotRecord];
    if (JSON.stringify(b) !== JSON.stringify(a)) illegal.push(field);
  }
  // id and sessionId fixed
  if (before.id !== after.id) illegal.push("id");
  return illegal;
}

/**
 * WHAT: Whether activation (ready → active) is authorized by seal + graph.
 * WHY: Single pure gate for clients mirroring enforce_active_snapshot trigger.
 * CONSENT: Dual mutual confirm of unwithdrawn fingerprint required.
 */
export function canActivateSession(input: {
  lifecycle: ConsentLifecycleState;
  seal: SealAuthorityView;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.lifecycle !== "ready") {
    return {
      ok: false,
      code: "not_ready",
      message: "session must be ready before activation",
    };
  }
  if (!isMutuallyConfirmed(input.seal)) {
    return {
      ok: false,
      code: "seal_incomplete",
      message:
        "both participants must confirm the current snapshot before activation",
    };
  }
  if (!canTransition("ready", "active")) {
    return {
      ok: false,
      code: "graph_blocked",
      message: "invalid lifecycle transition",
    };
  }
  return { ok: true };
}

// ── Revocation propagation ─────────────────────────────────────────────────

/**
 * WHAT: Canonical revocation causes (audit / offline / continuous).
 * WHY: One vocabulary for Soft Signal, pre-activation withdraw, material invalidation.
 * CONSENT: soft_signal and unilateral_withdraw never require peer permission.
 */
export const REVOCATION_CAUSES = [
  "soft_signal",
  "unilateral_withdraw",
  "material_invalidation",
  "peer_block",
  "account_restriction",
  "offline_reconcile",
  "safety_end",
] as const;
export type RevocationCause = (typeof REVOCATION_CAUSES)[number];

/**
 * WHAT: Target lifecycle after revocation given current state + cause.
 * WHY: Perfect propagation — active Soft Signal ≠ cancelled pre-activation.
 * CONSENT: Soft Signal from active → soft_signaled; never completed.
 */
export function lifecycleAfterRevocation(
  from: ConsentLifecycleState,
  cause: RevocationCause,
): ConsentLifecycleState | null {
  if (isTerminalState(from)) return null; // already terminal — no reopen
  if (from === "active") {
    if (cause === "safety_end") return "safety_ended";
    return "soft_signaled"; // soft_signal, unilateral, offline, block, restriction
  }
  if (
    from === "draft" ||
    from === "requested" ||
    from === "accepted" ||
    from === "consent_pending" ||
    from === "ready"
  ) {
    if (cause === "material_invalidation" && from === "ready") {
      return "consent_pending"; // material change returns ready → consent_pending
    }
    if (cause === "material_invalidation" && from === "consent_pending") {
      return "consent_pending"; // stay pending, seal cleared
    }
    if (from === "requested" && cause === "unilateral_withdraw") {
      return "cancelled";
    }
    return "cancelled";
  }
  return null;
}

/**
 * WHAT: Full revocation propagation result across snapshot + lifecycle.
 * WHY: One pure function so Soft Signal / withdraw / invalidate cannot diverge.
 * CONSENT: Clears all confirmations; stamps withdrawnBy/At; applies lifecycle edge.
 * EDGE:
 *   - already terminal lifecycle → snapshot still cleared if provided; no state change
 *   - material_invalidation on ready → consent_pending without soft_signaled
 * NEVER: Require peer OK; leave peer confirmation after withdraw.
 */
export function propagateRevocation(input: {
  snapshot: ConsentSnapshotRecord | null;
  lifecycle: ConsentLifecycleState;
  actorId: string;
  cause: RevocationCause;
  at: string;
}): {
  snapshot: ConsentSnapshotRecord | null;
  lifecycleTransition: TransitionResult | { ok: true; state: ConsentLifecycleState; changed: false; noop: true };
  contactPrivilege: "none";
  cause: RevocationCause;
} {
  const nextLifecycle = lifecycleAfterRevocation(input.lifecycle, input.cause);
  let lifecycleTransition:
    | TransitionResult
    | { ok: true; state: ConsentLifecycleState; changed: false; noop: true };

  if (nextLifecycle === null) {
    lifecycleTransition = {
      ok: true,
      state: input.lifecycle,
      changed: false,
      noop: true,
    };
  } else if (nextLifecycle === input.lifecycle) {
    lifecycleTransition = {
      ok: true,
      state: input.lifecycle,
      changed: false,
      noop: true,
    };
  } else {
    lifecycleTransition = transition(input.lifecycle, nextLifecycle);
  }

  let snapshot = input.snapshot;
  if (snapshot) {
    // Material invalidation may create a new fingerprint via invalidateForMaterialChange
    // at the caller; here we always clear confirmations via withdraw-shaped stamp.
    if (input.cause === "material_invalidation") {
      snapshot = {
        ...snapshot,
        confirmations: {},
        // leave withdrawn null so a new seal can form; invalidation is separate
        withdrawnBy: snapshot.withdrawnBy,
        withdrawnAt: snapshot.withdrawnAt,
      };
    } else {
      snapshot = withdrawConsent(
        snapshot,
        input.actorId,
        input.lifecycle,
        input.at,
      );
    }
  }

  return {
    snapshot,
    lifecycleTransition,
    contactPrivilege: "none",
    cause: input.cause,
  };
}

// ── Offline resilience & conflict resolution ───────────────────────────────

/**
 * WHAT: Local offline intents that must reconcile with server authority.
 * WHY: Connectivity loss must not invent consent or lose Soft Signal.
 * CONSENT: soft_signal and withdraw always outrank complete offline.
 */
export const OFFLINE_INTENT_KINDS = [
  "soft_signal",
  "withdraw",
  "complete",
  "confirm_snapshot",
  "wrap_up_submit",
  "wrap_up_skip",
  "activate",
] as const;
export type OfflineIntentKind = (typeof OFFLINE_INTENT_KINDS)[number];

export type OfflineIntent = {
  kind: OfflineIntentKind;
  sessionId: string;
  actorId: string;
  idempotencyKey: string;
  createdAtMs: number;
  /** Fingerprint for confirm_snapshot intents. */
  fingerprint?: string;
  payload?: Record<string, unknown>;
};

export type ServerAuthoritySnapshot = {
  lifecycle: ConsentLifecycleState;
  seal: SealAuthorityView;
  serverClockMs: number;
};

/**
 * WHAT: Resolve a single offline intent against server truth.
 * WHY: Conflict resolution is product law — Soft Signal / terminal server wins.
 * EDGE priority (highest first):
 *   1. Server already terminal → accept terminal (no reopen); soft_signal intent no-ops ok
 *   2. soft_signal / withdraw intent → apply revoke (beats complete)
 *   3. complete vs server soft path → never override server stop
 *   4. confirm on withdrawn/invalid → reject
 *   5. activate without dual seal → reject
 * NEVER: Offline complete overrides server soft_signaled/safety_ended.
 */
export function resolveOfflineIntent(
  intent: OfflineIntent,
  server: ServerAuthoritySnapshot,
): {
  action:
    | "apply"
    | "noop_already_terminal"
    | "reject"
    | "apply_revocation"
    | "queue_wrap";
  reason: string;
  preferredLifecycle?: ConsentLifecycleState;
} {
  if (isTerminalState(server.lifecycle)) {
    if (
      intent.kind === "soft_signal" ||
      intent.kind === "withdraw" ||
      intent.kind === "complete"
    ) {
      return {
        action: "noop_already_terminal",
        reason: "server_already_terminal",
        preferredLifecycle: server.lifecycle,
      };
    }
    if (intent.kind === "wrap_up_submit" || intent.kind === "wrap_up_skip") {
      if (
        server.lifecycle === "completed" ||
        server.lifecycle === "soft_signaled" ||
        server.lifecycle === "safety_ended"
      ) {
        return { action: "queue_wrap", reason: "wrap_allowed_on_terminal" };
      }
      return { action: "reject", reason: "wrap_not_allowed_on_this_terminal" };
    }
    return { action: "reject", reason: "session_terminal" };
  }

  if (intent.kind === "soft_signal" || intent.kind === "withdraw") {
    const cause: RevocationCause =
      intent.kind === "soft_signal" ? "soft_signal" : "unilateral_withdraw";
    const target = lifecycleAfterRevocation(server.lifecycle, cause);
    return {
      action: "apply_revocation",
      reason: cause,
      preferredLifecycle: target ?? server.lifecycle,
    };
  }

  if (intent.kind === "complete") {
    if (server.lifecycle !== "active") {
      return { action: "reject", reason: "complete_only_from_active" };
    }
    return {
      action: "apply",
      reason: "mutual_complete",
      preferredLifecycle: "completed",
    };
  }

  if (intent.kind === "confirm_snapshot") {
    if (!snapshotIsConfirmable({
      fingerprint: server.seal.fingerprint ?? "",
      withdrawnAt: server.seal.withdrawn ? "x" : null,
      invalidatedAt: server.seal.invalidated ? "x" : null,
    })) {
      return { action: "reject", reason: "snapshot_not_confirmable" };
    }
    if (
      intent.fingerprint &&
      server.seal.fingerprint &&
      intent.fingerprint !== server.seal.fingerprint
    ) {
      return { action: "reject", reason: "fingerprint_mismatch" };
    }
    if (server.lifecycle !== "consent_pending") {
      return { action: "reject", reason: "not_awaiting_confirm" };
    }
    return { action: "apply", reason: "confirm_ok" };
  }

  if (intent.kind === "activate") {
    const gate = canActivateSession({
      lifecycle: server.lifecycle,
      seal: server.seal,
    });
    if (!gate.ok) return { action: "reject", reason: gate.code };
    return {
      action: "apply",
      reason: "activate_ok",
      preferredLifecycle: "active",
    };
  }

  if (intent.kind === "wrap_up_submit" || intent.kind === "wrap_up_skip") {
    return { action: "reject", reason: "wrap_requires_terminal_server" };
  }

  return { action: "reject", reason: "unknown_intent" };
}

/**
 * WHAT: Merge ordered offline intents — Soft Signal / withdraw first by kind priority.
 * WHY: Queue may reorder; product law still prefers stop over complete.
 * Sort: soft_signal > withdraw > activate > confirm > complete > wrap; then createdAtMs.
 */
export function orderOfflineIntents(
  intents: readonly OfflineIntent[],
): OfflineIntent[] {
  const rank: Record<OfflineIntentKind, number> = {
    soft_signal: 0,
    withdraw: 1,
    activate: 2,
    confirm_snapshot: 3,
    complete: 4,
    wrap_up_submit: 5,
    wrap_up_skip: 6,
  };
  return [...intents].sort((a, b) => {
    const dr = rank[a.kind] - rank[b.kind];
    if (dr !== 0) return dr;
    return a.createdAtMs - b.createdAtMs;
  });
}

/**
 * WHAT: Fold a queue of offline intents against server state (pure simulation).
 * WHY: Reconcile path can decide which intents still apply after Soft Signal wins.
 */
export function reconcileOfflineQueue(
  intents: readonly OfflineIntent[],
  server: ServerAuthoritySnapshot,
): {
  results: Array<ReturnType<typeof resolveOfflineIntent> & { intent: OfflineIntent }>;
  finalLifecycle: ConsentLifecycleState;
} {
  let lifecycle = server.lifecycle;
  let seal = server.seal;
  const results: Array<
    ReturnType<typeof resolveOfflineIntent> & { intent: OfflineIntent }
  > = [];

  for (const intent of orderOfflineIntents(intents)) {
    const resolved = resolveOfflineIntent(intent, {
      lifecycle,
      seal,
      serverClockMs: server.serverClockMs,
    });
    results.push({ ...resolved, intent });
    if (
      resolved.action === "apply_revocation" &&
      resolved.preferredLifecycle
    ) {
      lifecycle = resolved.preferredLifecycle;
      // Revocation clears mutual seal authority
      seal = {
        ...seal,
        withdrawn: true,
        confirmedByA: false,
        confirmedByB: false,
        confirmFingerprintA: null,
        confirmFingerprintB: null,
      };
    } else if (
      resolved.action === "apply" &&
      resolved.preferredLifecycle
    ) {
      lifecycle = resolved.preferredLifecycle;
    } else if (resolved.action === "noop_already_terminal") {
      // keep terminal
    }
  }

  return { results, finalLifecycle: lifecycle };
}

// ── Wrap-up flows ──────────────────────────────────────────────────────────

/**
 * WHAT: Private wrap-up outcomes (mirror session_wrapups + skip).
 * WHY: Independent of terminal reason; never shared with peer by default.
 */
export const WRAP_UP_OUTCOMES = [
  "completed_comfortably",
  "ended_normally",
  "soft_signal_used",
  "felt_uncomfortable",
  "safety_concern",
  "skipped",
] as const;
export type WrapUpOutcome = (typeof WRAP_UP_OUTCOMES)[number];

export type WrapUpView = {
  aSubmitted: boolean;
  bSubmitted: boolean;
  aOutcome: WrapUpOutcome | null;
  bOutcome: WrapUpOutcome | null;
  skipped: boolean;
  bothDone: boolean;
  anyPending: boolean;
};

/**
 * WHAT: Factory for empty wrap-up view after terminal transition.
 * WHY: Both parties may wrap independently; neither blocks the other.
 */
export function emptyWrapUpView(): WrapUpView {
  return {
    aSubmitted: false,
    bSubmitted: false,
    aOutcome: null,
    bOutcome: null,
    skipped: false,
    bothDone: false,
    anyPending: true,
  };
}

/**
 * WHAT: Whether wrap-up may be submitted for this lifecycle.
 * WHY: Matches SQL submit_session_wrapup terminal gate + skip.
 */
export function canSubmitWrapUp(lifecycle: ConsentLifecycleState): boolean {
  return (
    lifecycle === "completed" ||
    lifecycle === "soft_signaled" ||
    lifecycle === "safety_ended"
  );
}

/**
 * WHAT: Apply one party's wrap-up or skip (pure merge).
 * WHY: Idempotent per party; peer cannot read outcome in this pure model.
 * NEVER: Require peer wrap before allowing one's own wrap.
 */
export function applyWrapUp(
  view: WrapUpView,
  party: "a" | "b",
  outcome: WrapUpOutcome,
  lifecycle: ConsentLifecycleState,
):
  | { ok: true; view: WrapUpView }
  | { ok: false; code: string; message: string } {
  if (!canSubmitWrapUp(lifecycle)) {
    return {
      ok: false,
      code: "not_ready",
      message: "session is not ready for wrap-up",
    };
  }
  if (party === "a" && view.aSubmitted) {
    return { ok: true, view }; // idempotent
  }
  if (party === "b" && view.bSubmitted) {
    return { ok: true, view };
  }
  const next: WrapUpView = { ...view };
  if (party === "a") {
    next.aSubmitted = true;
    next.aOutcome = outcome;
  } else {
    next.bSubmitted = true;
    next.bOutcome = outcome;
  }
  if (outcome === "skipped" && !next.aSubmitted && !next.bSubmitted) {
    next.skipped = true;
  }
  if (outcome === "skipped") {
    // Party-level skip still counts as submitted for that party.
    next.skipped = next.skipped || (next.aSubmitted && next.bSubmitted);
  }
  next.bothDone = next.aSubmitted && next.bSubmitted;
  next.anyPending = !next.bothDone;
  if (next.bothDone && next.aOutcome === "skipped" && next.bOutcome === "skipped") {
    next.skipped = true;
  }
  return { ok: true, view: next };
}

// ── Second-level event application ─────────────────────────────────────────

/**
 * WHAT: Nuclear domain events (finer than coarse transition labels).
 * WHY: Maximize granularity for audit, offline, continuous consent bridges.
 */
export const NUCLEAR_EVENTS = [
  "SESSION_REQUESTED",
  "SESSION_ACCEPTED",
  "SESSION_DECLINED",
  "SNAPSHOT_CREATED",
  "SNAPSHOT_CONFIRMED",
  "SNAPSHOT_DUAL_SEALED",
  "SNAPSHOT_WITHDRAWN",
  "SNAPSHOT_INVALIDATED",
  "SESSION_ACTIVATED",
  "SESSION_COMPLETED",
  "SOFT_SIGNAL",
  "SAFETY_ENDED",
  "SESSION_EXPIRED",
  "SESSION_CANCELLED",
  "WRAP_SUBMITTED",
  "WRAP_SKIPPED",
  "OFFLINE_RECONCILE",
  "CONTINUOUS_REDUCED",
  "CONTINUOUS_CHECK_IN",
] as const;
export type NuclearEvent = (typeof NUCLEAR_EVENTS)[number];

/**
 * WHAT: Aggregate nuclear session view for pure evaluation.
 */
export type NuclearSessionView = {
  lifecycle: ConsentLifecycleState;
  phase: SessionPhase;
  microstate: SessionMicrostate;
  seal: SealAuthorityView;
  wrap: WrapUpView;
  contactPrivilege: "none" | "active_possible";
};

/**
 * WHAT: Build nuclear view from lifecycle + seal + wrap.
 * WHY: Single projection for UI and tests.
 * CONSENT: contactPrivilege active_possible only if active + dual seal history
 *          still held (not withdrawn) — continuous layer may still reduce to none.
 */
export function projectNuclearView(input: {
  lifecycle: ConsentLifecycleState;
  seal: SealAuthorityView;
  wrap: WrapUpView;
  continuousHint?: "green" | "reduced" | "check_in" | "local_stop" | "safety";
}): NuclearSessionView {
  const microstate = deriveMicrostate({
    lifecycle: input.lifecycle,
    seal: input.seal,
    wrap: input.wrap,
    continuousHint: input.continuousHint,
  });

  const contactPrivilege: NuclearSessionView["contactPrivilege"] =
    input.lifecycle === "active" &&
    isMutuallyConfirmed(input.seal) &&
    input.continuousHint !== "local_stop" &&
    input.continuousHint !== "safety"
      ? "active_possible"
      : "none";

  return {
    lifecycle: input.lifecycle,
    phase: phaseForLifecycle(input.lifecycle),
    microstate,
    seal: input.seal,
    wrap: input.wrap,
    contactPrivilege,
  };
}

/**
 * WHAT: Apply a nuclear event to produce next lifecycle suggestion (pure).
 * WHY: Bridges UI/events to ADR 0005 transition() with fail-closed rejects.
 */
export function applyNuclearEvent(
  lifecycle: ConsentLifecycleState,
  event: NuclearEvent,
): TransitionResult | { ok: true; state: ConsentLifecycleState; changed: false; event_only: true } {
  const map: Partial<Record<NuclearEvent, ConsentLifecycleState>> = {
    SESSION_REQUESTED: "requested",
    SESSION_ACCEPTED: "accepted",
    SESSION_DECLINED: "declined",
    SNAPSHOT_DUAL_SEALED: "ready",
    SESSION_ACTIVATED: "active",
    SESSION_COMPLETED: "completed",
    SOFT_SIGNAL: "soft_signaled",
    SAFETY_ENDED: "safety_ended",
    SESSION_EXPIRED: "expired",
    SESSION_CANCELLED: "cancelled",
  };

  // Events that stay in-state (confirm one side, continuous reduce, wrap)
  if (
    event === "SNAPSHOT_CREATED" ||
    event === "SNAPSHOT_CONFIRMED" ||
    event === "WRAP_SUBMITTED" ||
    event === "WRAP_SKIPPED" ||
    event === "OFFLINE_RECONCILE" ||
    event === "CONTINUOUS_REDUCED" ||
    event === "CONTINUOUS_CHECK_IN" ||
    event === "SNAPSHOT_INVALIDATED"
  ) {
    if (event === "SNAPSHOT_INVALIDATED" && lifecycle === "ready") {
      return transition("ready", "consent_pending");
    }
    if (event === "SNAPSHOT_INVALIDATED" && lifecycle === "consent_pending") {
      return { ok: true, state: lifecycle, changed: false, event_only: true };
    }
    return { ok: true, state: lifecycle, changed: false, event_only: true };
  }

  if (event === "SNAPSHOT_WITHDRAWN") {
    if (lifecycle === "active") return transition(lifecycle, "soft_signaled");
    if (lifecycle === "consent_pending" || lifecycle === "ready") {
      return transition(lifecycle, "cancelled");
    }
    return { ok: true, state: lifecycle, changed: false, event_only: true };
  }

  const target = map[event];
  if (!target) {
    return {
      ok: false,
      reason: "invalid_transition",
      state: lifecycle,
    };
  }
  // accepted → consent_pending is automatic product step after accept
  if (event === "SESSION_ACCEPTED" && lifecycle === "requested") {
    const toAccepted = transition(lifecycle, "accepted");
    if (!toAccepted.ok) return toAccepted;
    return transition("accepted", "consent_pending");
  }
  return transition(lifecycle, target);
}

/**
 * WHAT: Constitution gate for nuclear session/consent features.
 * WHY: Shipping checklist for second-level machine changes.
 */
export function evaluateNuclearSessionFeature(input: {
  allowsConfirmAfterWithdraw: boolean;
  allowsActivateWithoutDualSeal: boolean;
  offlineCompleteBeatsSoftSignal: boolean;
  mutatesFingerprintInPlace: boolean;
  softSignalRequiresPeer: boolean;
  documentsMachine: boolean;
}): { ok: true } | { ok: false; violations: string[] } {
  const violations: string[] = [];
  if (input.allowsConfirmAfterWithdraw) {
    violations.push("I: confirm after withdraw is forbidden");
  }
  if (input.allowsActivateWithoutDualSeal) {
    violations.push("I: activation without dual seal is forbidden");
  }
  if (input.offlineCompleteBeatsSoftSignal) {
    violations.push("I/VII: offline complete must not beat Soft Signal");
  }
  if (input.mutatesFingerprintInPlace) {
    violations.push("VII: snapshot fingerprint is immutable after create");
  }
  if (input.softSignalRequiresPeer) {
    violations.push("I.3: Soft Signal must not require peer permission");
  }
  if (!input.documentsMachine) {
    violations.push("VIII.6: nuclear session changes require documentation");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
