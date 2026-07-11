# Chapter 4 — Session Lifecycle

## Mission

Implement a complete, recoverable, auditable session state machine from initial request through independent wrap-up.

The lifecycle must preserve explicit consent, allow immediate withdrawal, tolerate network interruption, and prevent duplicate or contradictory transitions.

## Canonical states

```text
draft
→ requested
→ accepted
→ consent_pending
→ ready
→ active
→ completed
```

Alternative terminal states:

```text
declined
cancelled
expired
soft_signaled
safety_ended
```

Every transition must be explicitly allowed by the domain model. UI code must not invent or directly mutate lifecycle states.

## Requirements

### Requests

- Create, send, receive, accept, decline, and cancel session requests.
- Define expiration behavior and visible expiration timestamps.
- Prevent requests to blocked, ineligible, or unavailable accounts.
- Make duplicate request submission idempotent.
- Do not disclose private rejection reasons.

### Consent confirmation

- Generate the session-specific Consent Snapshot using exact profile versions.
- Require both participants to confirm the same immutable snapshot.
- Prevent activation when confirmations reference different snapshot versions.
- Invalidate confirmations after material changes.
- Allow either participant to withdraw before activation without penalty.

### Active session

- Synchronize active state and timer through realtime updates.
- Provide a prominent Soft Signal action.
- Permit an ordinary early end separate from a safety end.
- Require no explanation to stop.
- Ensure one participant's stop action ends the session for both.
- Make stop actions idempotent and durable.

### Connectivity and recovery

- Recover correctly after application restart or temporary network loss.
- Show whether displayed state is confirmed, pending synchronization, or offline.
- Never infer consent or activation from stale local state.
- Resolve conflicts on the server using allowed transitions and recorded versions.
- Prevent duplicate timers, wrap-ups, and trust events.

### Wrap-up

Each participant completes an independent private check-in.

Support outcomes such as:

- Completed comfortably
- Ended normally
- Soft Signal used
- Felt uncomfortable
- Safety concern

Do not show one participant's private answers to the other.

### Audit trail

Record an append-only event trail containing:

- Session identifier
- Actor identifier
- Event type
- Prior and resulting state
- Snapshot version where relevant
- Server timestamp
- Idempotency key
- Safe metadata

Do not include raw private notes or unnecessary consent details in general event logs.

## Server-side transition rules

Implement transitions as transactional server actions or database functions where appropriate.

Requirements:

- Validate actor authorization.
- Validate current state.
- Validate snapshot and profile versions.
- Apply one transition atomically.
- Emit one event atomically.
- Return a stable result for repeated idempotency keys.

## Testing

Cover:

- Every valid transition
- Every invalid transition
- Concurrent accept/cancel actions
- Duplicate submissions
- Expiration boundaries
- Mismatched snapshot confirmations
- Withdrawal before activation
- Soft Signal during active state
- Simultaneous stop actions
- Offline restart and resynchronization
- Unauthorized transition attempts
- Independent wrap-up privacy

Add a deterministic two-client integration scenario covering request, acceptance, confirmation, activation, Soft Signal, and wrap-up.

## Acceptance criteria

- One canonical state machine controls all lifecycle transitions.
- Invalid or unauthorized transitions fail safely.
- Request and transition actions are idempotent.
- Both participants confirm the same immutable snapshot before activation.
- One stop action ends the session for both.
- Connectivity loss cannot broaden consent or fabricate activation.
- Independent wrap-up data remains private.
- An append-only audit trail exists.
- Two-client end-to-end tests pass.
- Lifecycle behavior and recovery rules are documented.
