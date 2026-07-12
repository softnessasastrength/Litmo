import {
  consentLifecycleStates,
  type ConsentLifecycleState,
} from "./consentSnapshot.ts";

/**
 * Canonical session-lifecycle transition graph. Documented in
 * docs/adr/0005-session-lifecycle-state-machine.md. This is the single
 * source of truth for which lifecycle transitions exist; UI code and
 * server-side transition handlers must both consult it rather than
 * inventing or directly mutating a lifecycle state.
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

export function isTerminalState(state: ConsentLifecycleState): boolean {
  return sessionTransitions[state].size === 0;
}

export function canTransition(
  from: ConsentLifecycleState,
  to: ConsentLifecycleState,
): boolean {
  return sessionTransitions[from].has(to);
}

export type TransitionResult =
  | { ok: true; state: ConsentLifecycleState; changed: boolean }
  | {
      ok: false;
      reason: "terminal_state" | "invalid_transition";
      state: ConsentLifecycleState;
    };

/**
 * Applies a transition against the canonical graph.
 *
 * - Requesting the current state again succeeds with `changed: false`
 *   (idempotent no-op), so a retried action never errors.
 * - Once in a terminal state, every further transition — including to
 *   itself — is rejected with `reason: "terminal_state"`. Nothing can
 *   reopen a completed, cancelled, or safety-ended session.
 * - Any other unlisted edge is rejected with `reason: "invalid_transition"`.
 */
export function transition(
  from: ConsentLifecycleState,
  to: ConsentLifecycleState,
): TransitionResult {
  if (isTerminalState(from))
    return { ok: false, reason: "terminal_state", state: from };
  if (from === to) return { ok: true, state: from, changed: false };
  if (!canTransition(from, to))
    return { ok: false, reason: "invalid_transition", state: from };
  return { ok: true, state: to, changed: true };
}

export { consentLifecycleStates as sessionLifecycleStates };
export type { ConsentLifecycleState as SessionLifecycleState };
