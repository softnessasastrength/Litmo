import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransition,
  isTerminalState,
  sessionLifecycleStates,
  sessionTransitions,
  transition,
  type SessionLifecycleState,
} from "./sessionLifecycle.ts";

const terminalStates: SessionLifecycleState[] = [
  "completed",
  "declined",
  "cancelled",
  "expired",
  "soft_signaled",
  "safety_ended",
];

test("every canonical state has a defined (possibly empty) transition set", () => {
  for (const state of sessionLifecycleStates)
    assert.ok(sessionTransitions[state] instanceof Set, state);
});

test("terminal states are exactly the states with no outgoing edges", () => {
  for (const state of sessionLifecycleStates)
    assert.equal(isTerminalState(state), terminalStates.includes(state), state);
});

test("every valid transition in the graph succeeds and changes state", () => {
  for (const from of sessionLifecycleStates)
    for (const to of sessionTransitions[from]) {
      assert.equal(canTransition(from, to), true, `${from} -> ${to}`);
      assert.deepEqual(
        transition(from, to),
        { ok: true, state: to, changed: true },
        `${from} -> ${to}`,
      );
    }
});

test("every transition not in the graph is rejected as invalid", () => {
  for (const from of sessionLifecycleStates)
    for (const to of sessionLifecycleStates) {
      const allowed = sessionTransitions[from].has(to);
      const isNoop = from === to;
      if (allowed || isNoop) continue;
      assert.equal(canTransition(from, to), false, `${from} -> ${to}`);
      const result = transition(from, to);
      assert.equal(result.ok, false, `${from} -> ${to}`);
      if (!result.ok) {
        const expectedReason = isTerminalState(from)
          ? "terminal_state"
          : "invalid_transition";
        assert.equal(result.reason, expectedReason, `${from} -> ${to}`);
      }
    }
});

test("requesting the current state again is an idempotent no-op for non-terminal states", () => {
  for (const state of sessionLifecycleStates) {
    if (isTerminalState(state)) continue;
    assert.deepEqual(transition(state, state), {
      ok: true,
      state,
      changed: false,
    });
  }
});

test("terminal states reject every transition, including to themselves", () => {
  for (const state of terminalStates)
    for (const to of sessionLifecycleStates) {
      const result = transition(state, to);
      assert.deepEqual(result, {
        ok: false,
        reason: "terminal_state",
        state,
      });
    }
});

test("duplicate submissions of the same accept never error", () => {
  const first = transition("requested", "accepted");
  const second = transition(first.ok ? first.state : "requested", "accepted");
  assert.equal(first.ok, true);
  assert.deepEqual(second, { ok: true, state: "accepted", changed: false });
});

test("expiration is reachable from requested, consent_pending, and ready, but not from accepted", () => {
  assert.equal(canTransition("requested", "expired"), true);
  assert.equal(canTransition("consent_pending", "expired"), true);
  assert.equal(canTransition("ready", "expired"), true);
  assert.equal(canTransition("accepted", "expired"), false);
});

test("either participant can withdraw before activation, landing on cancelled", () => {
  assert.equal(canTransition("consent_pending", "cancelled"), true);
  assert.equal(canTransition("ready", "cancelled"), true);
  assert.equal(canTransition("active", "cancelled"), false);
});

test("Soft Signal ends an active session immediately, without passing through completed", () => {
  const result = transition("active", "soft_signaled");
  assert.deepEqual(result, {
    ok: true,
    state: "soft_signaled",
    changed: true,
  });
});

test("a safety end and a normal completion cannot both apply to the same active session", () => {
  const softSignaled = transition("active", "soft_signaled");
  assert.equal(softSignaled.ok, true);
  const secondStopAttempt = transition(
    softSignaled.ok ? softSignaled.state : "active",
    "safety_ended",
  );
  assert.deepEqual(secondStopAttempt, {
    ok: false,
    reason: "terminal_state",
    state: "soft_signaled",
  });
});

test("a session cannot activate without first reaching ready", () => {
  assert.equal(canTransition("consent_pending", "active"), false);
  assert.equal(canTransition("requested", "active"), false);
  assert.equal(canTransition("draft", "active"), false);
});

test("a material profile change returns a ready session to consent pending", () => {
  assert.equal(canTransition("ready", "consent_pending"), true);
  assert.equal(canTransition("active", "consent_pending"), false);
});

test("draft has no incoming transitions from any other state", () => {
  for (const from of sessionLifecycleStates) {
    if (from === "draft") continue;
    assert.equal(canTransition(from, "draft"), false, from);
  }
});
