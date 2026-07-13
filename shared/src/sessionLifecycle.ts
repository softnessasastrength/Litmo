/**
 * Canonical session-lifecycle transition graph.
 *
 * WHAT: Allowed ConsentLifecycleState transitions + pure transition() applicator.
 * WHY: UI and server must share one graph so clients cannot invent reopen paths.
 * CONSENT: Terminal states (completed, soft_signaled, safety_ended, …) never reopen contact.
 * EDGE CASES: Idempotent same-state non-terminal → ok changed false; terminal → terminal_state.
 * NEVER: Transition soft_signaled → active; treat match request as consent_pending skip.
 * SEE: docs/adr/0005-session-lifecycle-state-machine.md · consentSnapshot states
 */

import {
  consentLifecycleStates,
  type ConsentLifecycleState,
} from "./consentSnapshot.ts";

/**
 * WHAT: Readonly adjacency map of legal lifecycle edges.
 * WHY: Single source of truth for canTransition / transition (ADR 0005).
 * CONSENT: active only ends via completed | soft_signaled | safety_ended — free stop paths exist.
 * EDGE CASES: Terminal states map to empty sets (no outbound edges).
 * NEVER: Add silent auto-accept edges (e.g. requested → active) without ADR.
 * SEE: docs/adr/0005-session-lifecycle-state-machine.md
 */
export const sessionTransitions: Readonly<
  Record<ConsentLifecycleState, ReadonlySet<ConsentLifecycleState>>
> = {
  draft: new Set(["requested"]),
  requested: new Set(["accepted", "declined", "cancelled", "expired"]),
  accepted: new Set(["consent_pending"]),
  consent_pending: new Set(["ready", "cancelled", "expired"]),
  ready: new Set(["consent_pending", "active", "cancelled", "expired"]),
  active: new Set(["completed", "soft_signaled", "safety_ended"]),
  completed: new Set(),
  declined: new Set(),
  cancelled: new Set(),
  expired: new Set(),
  soft_signaled: new Set(),
  safety_ended: new Set(),
};

/**
 * WHAT: True when state has zero outbound transitions (session cannot continue).
 * WHY: transition() rejects further moves once terminal.
 * CONSENT: soft_signaled / safety_ended are terminal — Soft Signal must not reopen.
 * EDGE CASES: Uses set size, not a hard-coded list (stays aligned with graph).
 * NEVER: Treat ready as terminal; reopen completed for “another round” without new session.
 */
export function isTerminalState(state: ConsentLifecycleState): boolean {
  return sessionTransitions[state].size === 0;
}

/**
 * WHAT: Whether graph lists a directed edge from → to.
 * WHY: Shared predicate for validators and transition().
 * CONSENT: Not a consent surface by itself — only graph membership.
 * EDGE CASES: Same-state is false here; transition() handles idempotent no-op separately.
 * NEVER: Special-case match popularity into extra edges.
 */
export function canTransition(
  from: ConsentLifecycleState,
  to: ConsentLifecycleState,
): boolean {
  return sessionTransitions[from].has(to);
}

/**
 * WHAT: Result of applying a requested lifecycle transition.
 * WHY: Callers distinguish success, idempotent no-op, terminal reject, invalid edge.
 * CONSENT: ok false means contact must not proceed under the requested change.
 * EDGE CASES: changed false on idempotent non-terminal same-state.
 * NEVER: Interpret ok true alone as dual Consent Snapshot confirm.
 */
export type TransitionResult =
  | { ok: true; state: ConsentLifecycleState; changed: boolean }
  | {
      ok: false;
      reason: "terminal_state" | "invalid_transition";
      state: ConsentLifecycleState;
    };

/**
 * WHAT: Apply a transition against the canonical graph with fail-closed rejects.
 * WHY: Retried actions stay idempotent; terminals never reopen; unknown edges deny.
 * CONSENT: Soft Signal path lands soft_signaled (terminal); cannot return to active.
 * EDGE CASES:
 *   - terminal from → reason terminal_state (including to === from)
 *   - from === to non-terminal → ok changed false
 *   - unlisted edge → invalid_transition, state unchanged
 * NEVER: Coerce invalid transitions to nearest legal state.
 * SEE: ADR 0005
 */
export function transition(
  from: ConsentLifecycleState,
  to: ConsentLifecycleState,
): TransitionResult {
  // Fail closed: nothing reopens a completed / soft-signaled / safety-ended session.
  if (isTerminalState(from))
    return { ok: false, reason: "terminal_state", state: from };
  // Idempotent no-op so retries never error on already-applied state.
  if (from === to) return { ok: true, state: from, changed: false };
  if (!canTransition(from, to))
    return { ok: false, reason: "invalid_transition", state: from };
  return { ok: true, state: to, changed: true };
}

export { consentLifecycleStates as sessionLifecycleStates };
export type { ConsentLifecycleState as SessionLifecycleState };
