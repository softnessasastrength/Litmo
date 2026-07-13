# ADR 0062 — Nuclear session lifecycle + Consent Snapshot machine

- **Status:** accepted for engineering
- **Date:** 2026-07-13
- **Constitution:** Articles I, II, VII, VIII.6, X

## Context

ADR 0005 defines the coarse twelve-state lifecycle. Chapter 3–4 deliver
fingerprinted Consent Snapshots, dual confirm, withdraw, wrap-ups, and offline
complete retry (ADR 0020). Continuous consent design (`CONTINUOUS_CONSENT_SYSTEM.md`)
asks for second-level granularity, offline conflict law, and perfect revocation
propagation without a second competing graph.

Risks without a nuclear pure core:

- Soft Signal and offline “complete” racing without documented priority;
- in-place fingerprint mutation;
- wrap-up incomplete after Soft Signal;
- agents inventing microstates that reopen terminal sessions.

## Decision

1. **`@litmo/domain` `sessionConsentNuclear.ts`** is the pure second-level machine:
   - phases + microstates over ADR 0005 states;
   - dual-seal verification (`isMutuallyConfirmed`, `canActivateSession`);
   - snapshot immutability detection;
   - `propagateRevocation` across snapshot + lifecycle;
   - offline intent ordering and `reconcileOfflineQueue` (Soft Signal > complete);
   - wrap-up merge including `skipped`;
   - nuclear events → `transition()` bridges.

2. **`consentSnapshot.ts`** gains `hasDualConfirmation` and
   `verifyConsentSnapshotIntegrity`.

3. **Migration 043**:
   - BEFORE UPDATE trigger: consent snapshot body immutable (fingerprint,
     profiles, compatibility, session_id, created_at);
   - `consent_revocation_events` append-only ledger;
   - `session_offline_intents` durable queue + enqueue RPC;
   - `session_seal_authority` dual-confirm view (self/peer booleans only);
   - withdraw path appends revocation events;
   - wrap-up outcome includes `skipped`.

4. Coarse graph in `sessionLifecycle.ts` remains the only legal coarse edges
   (ADR 0005). Nuclear microstates never add reopen edges.

## Alternatives considered

- Expand SQL graph to 40+ microstates. Rejected: dual implementation drift.
- Client-only offline law. Rejected: server must not apply complete over Soft Signal.
- Mutable snapshot rows with version counters. Rejected: immutability is simpler and safer.

## Consequences

- Domain tests encode Soft Signal offline priority.
- pgTAP covers immutability, offline enqueue, seal authority, revocation ledger, wrap skip.
- Continuous consent UI clocks remain app-layer (`continuousConsentCore`); nuclear machine is the session/seal authority twin.
- Physical offline chaos still required before private alpha (KNOWN_LIMITATIONS).

## Related

- ADR 0005, 0006, 0008, 0020, 0022
- `docs/CONTINUOUS_CONSENT_SYSTEM.md`
- `docs/CONSENT_SNAPSHOT_SYSTEM.md`
