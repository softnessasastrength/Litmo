# ADR 0046: macOS participant trust-history read model

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

ADR 0045 established native macOS participant and Ops shells without server data. The next useful participant step is a **single** read-only surface that reuses an existing server contract instead of inventing macOS-local safety semantics.

Candidate surfaces included profile, learning progress, requests, consent snapshots, trust history, and export. Learning progress is device-local on phone and is not server-authoritative. Consent snapshots risk platform drift if Swift reinterprets compatibility. Requests and export are broader than one vertical slice.

## Decision

Ship **self-only trust history** as the first macOS participant read model:

1. Call the existing Postgres RPC `public.my_trust_signals()` over Supabase REST.
2. Decode and display the server fields only (account age, profile complete, adult eligible, terminal session counts).
3. Present explicit “not a safety score / never grants consent” authority copy (ADR 0029).
4. **Fail closed** when:
   - `LITMO_SUPABASE_URL` or `LITMO_SUPABASE_ANON_KEY` is missing or invalid
   - `LITMO_ACCESS_TOKEN` is missing (no fabricated participant session)
   - transport fails, HTTP is non-success, or the payload cannot be decoded
5. Do **not** implement passkey sign-in, Keychain sharing with iOS, mock trust rows, mutations, matching eligibility decisions, or any Ops/staff path in this slice.

Authentication remains deliberately incomplete: environment-supplied access tokens are a local inspection seam only, not production account UX.

## Alternatives considered

- **Own profile row first:** useful, but less safety-language-critical and still requires the same config/session plumbing; deferred after the trust-history path proves the pattern.
- **export_my_data() first:** broader surface with more categories and disclosure risk; deferred.
- **Consent snapshot detail:** rejected for this slice because Swift must not recompute or reinterpret consent overlap.
- **Mock seed trust data for empty states:** rejected; empty/unavailable states must not look like real history.

## Consequences

- macOS can demonstrate one honest server-backed participant view without becoming an active-session controller.
- Later read models (profile, requests, export) should reuse the same configuration, credential, HTTP, and fail-closed patterns.
- Production-ready sign-in, secure token storage, and signed distribution remain separate work.
- Litmo Ops remains locked and shares no credentials or app group with the participant target.
