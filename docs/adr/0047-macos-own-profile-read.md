# ADR 0047: macOS own-profile read model

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

ADR 0046 landed self-only trust history as the first macOS participant read. The next useful surface is the participant’s **own profile** projection already enforced by owner RLS on `public.profiles`. Duplicating HTTP/session fail-closed plumbing for each surface would invite drift.

## Decision

1. Extract shared participant read infrastructure in `LitmoMacCore`:
   - `ParticipantReadOutcome`
   - `JSONFieldDecoding`
   - `SupabaseParticipantTransport` (authenticated request build + HTTP mapping)
2. Ship **own profile** as the second server-backed macOS read:
   - `GET /rest/v1/profiles?select=user_id,display_name,pronouns,bio,vibe_archetype,onboarding_completed_at`
   - Rely on owner RLS; require exactly one row
   - Fail closed on missing configuration, missing session, transport/HTTP failure, empty or multi-row payloads, or incomplete required fields
3. Keep the surface **read-only**. No profile edits, no touch/consent preference mutations, and no fabricated “New neighbor” defaults when unavailable.
4. Reuse the same env inspection credentials as ADR 0046 (`LITMO_SUPABASE_URL`, `LITMO_SUPABASE_ANON_KEY`, `LITMO_ACCESS_TOKEN`). Still not production passkey UX.
5. Present explicit authority copy: a profile never grants consent or proves safety.

## Alternatives considered

- **export_my_data first:** broader disclosure surface; deferred until profile plumbing is proven.
- **Session requests first:** more lifecycle-sensitive; deferred.
- **Client-side demo profile when offline:** rejected; empty states must not look like real accounts.

## Consequences

- Profile and trust history share one transport/fail-closed pattern for later reads (requests, export).
- Profile editing remains phone-first until a reviewed mutation path exists.
- Litmo Ops remains locked and still shares no credentials or app group.
