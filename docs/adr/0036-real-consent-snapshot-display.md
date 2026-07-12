# ADR 0036: Real Consent Snapshot display from trusted backend

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Real sessions already create snapshots via the privileged backend
(`POST /api/sessions/:id/snapshot`) and confirm via `confirm_session_snapshot`.
The mobile screen still **rendered mock preference overlap** even when a
`sessionId` was present, which misrepresented real pairs.

## Decision

- On open with `sessionId`, load the latest non-withdrawn snapshot for the
  session (participant RLS) or create one via the backend.
- Render rows with `buildSnapshotRows` from the snapshot's `compatibility`
  JSON — never mock fixtures for real sessions.
- Fail closed with retry if backend/env/profile versions are missing.
- Demo / mock path (no `sessionId`) unchanged.

## Alternatives considered

- Client-side recompute from profile RPCs. Rejected: fingerprint/canon must
  stay server-trusted (ADR 0006 / migration 009).
- Always mock UI. Rejected: breaks trust for real beta pairs.

## Consequences

- Physical beta needs `EXPO_PUBLIC_BACKEND_URL` + service role backend for
  real snapshot create.
- Resume from Home already passes `sessionId`; display now matches reality.
