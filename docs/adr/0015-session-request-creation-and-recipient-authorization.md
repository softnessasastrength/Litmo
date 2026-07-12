# ADR 0015: Session request creation and recipient-only response authorization

**Status:** Accepted
**Date:** 2026-07-12

## Context

`docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`'s "Requests" section requires creating, sending, accepting, and declining session requests, with idempotent duplicate submission. Until now no authenticated client could create a `sessions` row at all (migration 007 granted only `select`), which `docs/KNOWN_LIMITATIONS.md` documented as a hard blocker: "no authenticated client can create a session directly."

Separately, `transition_session(...)` (migration 008, amended by 011) authorized either participant (`user_a` or `user_b`) for every graph-valid edge, including `requested -> accepted` and `requested -> declined`. `docs/KNOWN_LIMITATIONS.md` flagged this as a known gap: "it does not yet distinguish requester-only, recipient-only, or system-only actions," with removal explicitly tied to "document and enforce actor roles for each transition alongside the request-creation... actions" — the roadmap treats these as one unit of work, not two.

## Decision

- Added `request_session(p_recipient_id uuid, p_idempotency_key text default null)`, establishing a convention that did not exist before: the caller becomes `user_a` (the requester), the named recipient becomes `user_b`. It creates a `sessions` row directly at `requested` (skipping a materialized `draft` row, since nothing ever observes `draft` as a persisted state) and writes one `session_requested` audit event with `prior_state = 'draft'`, in one atomic function, consistent with `transition_session`'s existing "one transition, one event" contract.
- Idempotent duplicate prevention is business-level, not key-based: if the two people already have a non-terminal session in _either_ direction, `request_session` returns that session's id instead of creating a second one. This both satisfies "make duplicate request submission idempotent" and prevents request spam, and naturally covers the reverse-direction case (B requesting A while A's request to B is still pending).
- `transition_session(...)` now additionally requires `v_actor_id = user_b` for the `requested -> accepted` and `requested -> declined` edges specifically. Every other transition's authorization (either participant) is unchanged. The requester still withdraws their own pending request through the existing `withdraw_session_consent(...)` (ADR 0012), which already permits either participant to cancel — this ADR does not touch that function.
- `request_session` checks recipient existence against `public.profiles` (the active Chapter 3+ profile table), not the legacy `public.users` table from migration 001, which has no rows for any real account and was superseded by migration 005's `profiles` table.

## Alternatives considered

- A separate `respond_session_request(...)` function wrapping `transition_session`. Rejected: `transition_session` already validates the `requested -> accepted/declined` edges correctly; duplicating that logic in a second function would create two places that could drift out of sync. Adding the recipient check directly to `transition_session` keeps one authorization surface.
- A dedicated idempotency-key-based dedup table for request creation, mirroring `session_events`'s per-session unique index. Rejected in favor of the business-level "existing non-terminal session between this pair" check, which is both simpler and matches the roadmap's actual intent (prevent duplicate/parallel requests to the same person) more directly than a pure replay-key mechanism would.

## Explicitly out of scope

- **Blocking/eligibility checks** ("prevent requests to blocked, ineligible, or unavailable accounts"): no blocking or eligibility system exists anywhere in this codebase. Implementing one is a separate, substantial subsystem and is not invented here.
- **Expiration timestamps and jobs**: still unscoped, as recorded in `docs/CHAPTER_4_NEXT_STEPS.md` before this change.
- **Mobile UI for sending/receiving requests**: no screen calls `request_session` yet. `/session/active` still has no caller that threads a real `sessionId` into it (see ADR 0014); this ADR makes request creation correct and tested, not yet reachable from the app.

## Consequences

A session can now genuinely be requested and responded to correctly and safely at the database layer, with the recipient-only authorization the feature requires to be meaningful. Both are covered by twelve new pgTAP assertions (`supabase/tests/session_requests.test.sql`) and the existing 144-pair `transition_session` matrix (`supabase/tests/session_lifecycle.test.sql`), which now runs under the recipient's identity so it continues to exercise every graph edge, including the two now-restricted ones, correctly.

## Follow-up work

- Wire a mobile "request a session" action (from `match/[id].tsx` or `discover.tsx`) that calls `request_session`, and an accept/decline UI for incoming requests, so `/session/active` finally receives a real `sessionId`.
- Blocking/eligibility checks before request creation.
- Expiration timestamps/jobs for unanswered requests.

## Addendum (2026-07-12): real snapshot creation and confirmation wiring

Wired the follow-up flagged in the "connecting an accepted request to consent review" addendum below: `sessionRepository.createSnapshot`/`confirmSnapshot`/`activateSession`, and `consent-snapshot.tsx` now calls them for real when a `sessionId` is present, rather than only navigating forward.

- `createSnapshot` is the mobile app's first call to the separate Express backend (`POST /api/sessions/:sessionId/snapshot`), authenticated with the current Supabase session's access token. Requires a new `EXPO_PUBLIC_BACKEND_URL` config (`app/config/runtime.ts`, `app/.env.example`) — on a physical device this must be the development computer's LAN address, exactly like `EXPO_PUBLIC_SUPABASE_URL` already is, since the backend is a separate local process with no hosted deployment. Considered moving this logic into a Postgres/Edge function instead (would remove the LAN-reachability dependency entirely); decided to keep the existing Express backend for now and revisit the architecture question separately, since porting it is materially more work than wiring the existing route.
- `confirmSnapshot` calls `confirm_session_snapshot(...)` and returns whether the session actually reached `ready` (both participants confirmed) or is still `consent_pending` (waiting on the other participant) — the screen shows an honest "waiting for the other person" state in the latter case, since there is no Realtime subscription yet to update automatically.
- `activateSession` calls `transition_session(..., 'active')` once `ready` is reached.
- Seeded version-1000 `touch_profile_versions`/`consent_preference_versions` rows for all four demo accounts (`supabase/seed.sql`) so snapshot creation doesn't fail closed with `profile_versions_missing`. Caught and fixed a fallout bug before this landed: the high seed version broke `save_profile_versions`'s `max(version)+1` numbering assumption in `supabase/tests/snapshot_invalidation.test.sql`, which hardcoded an absolute expected version number (`2`); fixed that test to look up the actual latest version dynamically instead of hardcoding it, which is also a more correct test regardless of this seed change.
- **Verifying true two-participant confirmation could not be completed by me in this session** — flagged as requiring a manual passkey-registration step. Documented in `docs/LOCAL_DEVELOPMENT.md`'s "Demo accounts" section (which was also stale — it referenced password sign-in that no longer exists since ADR 0010).

## Addendum (2026-07-12): dual-confirmation verified on-device; backend architecture decision

The founder manually verified the two-participant path: both sides confirmed the same snapshot, and the session correctly reached `active`. This closes the request -> accept -> confirm -> active chain end to end on a physical device.

Decision: keep the Express backend + LAN-address approach for snapshot creation as-is, rather than moving `createConsentSnapshot`'s logic into a Supabase Postgres/Edge function now. Reasoning, from the founder directly: single-developer, single-device local testing today makes the LAN-reachability dependency a non-issue. Revisit the Edge function migration specifically when scaling past the founder's own iPhone (multiple real testers/devices, or any hosted deployment) — that's the point at which "the backend must be running on a specific laptop reachable on the same network" actually becomes a blocker rather than a convenience.

## Addendum (2026-07-12): free-tier build unblocked, on-device verification completed

The on-device build blocked in the "mobile request/accept/decline UI" addendum below turned out to be more than an expired Xcode sign-in: after re-authenticating, the build failed with a _second_, structural error — "Personal development teams... do not support the Associated Domains capability" for `com.litmo.app.dev`. Associated Domains was added by the passkey-first authentication work (ADR 0010) and, like Push Notifications before it (`app/plugins/withoutPushEntitlement.cjs`), a free Apple "Personal Team" cannot use it at all.

Unlike Push Notifications, this isn't a removable no-op — passkeys are the app's only sign-in method, so silently stripping the entitlement everywhere would break real sign-in. Presented this tradeoff directly; the founder chose to strip it for **local free-tier builds only**, keeping it intact for real (paid-team/EAS) builds. Implemented as an `app.config.ts` flag: `LITMO_FREE_TIER_BUILD=1 npx expo prebuild --platform ios` omits `associatedDomains` from the generated config entirely (real dev/staging/production builds keep it by default). Fixed a bug caught before this landed: the first implementation only skipped _adding_ an override, but `...base.expo.ios` (spread from `app.json`) already carried a hardcoded `associatedDomains` value that leaked through unchanged; fixed by destructuring it out of the base object first.

With that fix, `LITMO_FREE_TIER_BUILD=1 npx expo prebuild --platform ios` + `pod install` + `xcodebuild` succeeded, and the app installed and launched on the physical device without crashing (confirmed by the founder), verifying this session's mobile request/accept/decline UI on-device. Passkey sign-in itself was not (and cannot be) verified under a free Personal Team; that remains blocked on a paid Apple Developer Program membership. See `docs/KNOWN_LIMITATIONS.md` and `docs/MACHINE_SETUP.md`.

Note: this build also regenerated the native Xcode project under a new name (`Litmodevelopment` instead of `Litmo`), because the environment-aware display name (`Litmo development` in dev, from the earlier "harden release environment boundaries" work) is what Expo derives the native project/target/scheme names from. This is a pre-existing, deliberate design choice from that work, not something changed here — just documented so the renamed `ios/Litmodevelopment.*` paths in this commit aren't mistaken for an unrelated restructuring.

## Addendum (2026-07-12): mobile request/accept/decline UI

Wired the follow-up work above: `sessionRepository.requestSession`/`respondToRequest`/`listIncomingRequests` (thin RPC wrappers, matching `completeSession`'s existing pattern); a "Request a session" action on `app/app/match/[id].tsx` (real when `status === "authenticated"`, honest fallback in demo mode, matching ADR 0014's established convention); and a new `app/app/requests.tsx` screen listing incoming pending requests (via `discovery_profiles()` for the requester's display name) with Accept/Decline, linked from the home tab.

Verified: typecheck, 46 app tests, 60 shared tests, 12 backend tests, lint, and a clean `db:reset` plus 100/100 pgTAP all pass. A native iOS build (`expo prebuild` + `pod install` + `xcodebuild`) was attempted to verify on-device but failed at the code-signing step with "No Accounts: Add a new account in Accounts settings" — the free-tier Xcode Apple ID sign-in on this machine had expired (a known, previously-documented recurring issue with free Personal Team accounts, see `docs/MACHINE_SETUP.md`), unrelated to this change and requiring interactive credentials to resolve. This is a genuine external blocker, not a defect in the change itself; the JS-side verification above is the full extent of what could be confirmed without it.

## Addendum (2026-07-12): connecting an accepted request to consent review

Accepting a request now calls `sessionRepository.beginConsentReview` (`accepted -> consent_pending`, best-effort — a failure here doesn't block the accept, since the requests list has already refreshed and the person can retry from the match screen) and navigates to `/match/consent-snapshot` with the real `sessionId` and the requester's resolved mock persona id (`personaIdForUserId`, the inverse of `personaUserId`), which now forwards `sessionId` into `/session/active`.

This correctly gets a real session to `consent_pending` but not further: reaching `ready -> active` needs a persisted, dual-confirmed canonical Consent Snapshot (ADR 0006), which nothing in this flow calls yet, and which can't be meaningfully demonstrated end-to-end from one signed-in identity on one device anyway (both participants must independently confirm). Concretely, a real accepted session reaching `/session/active` today will fail "End together" 's `completeSession` call (since the session is `consent_pending`, not `active`), fall into the existing offline-failure fallback (`ended=pending-sync`), and then correctly, honestly fail `submit_session_wrapup` with "session is not ready for wrap-up" if the person tries to save a reflection. Nothing here fabricates success — it fails closed with a real (if not perfectly worded — the pending-sync copy was written for connectivity issues, not this) backend error. See `docs/CHAPTER_4_NEXT_STEPS.md` for the exact next step (snapshot creation/confirmation wiring).

## Addendum (2026-07-12): seeding real accounts for mock discovery personas

Before the mobile wiring above could be built, `app/data/mockConsentProfiles.ts`'s persona-to-UUID map (`maya -> ...0002`, `eli -> ...0003`, `jonah -> ...0004`) turned out to only have one of three UUIDs (`...0002`) backed by a real `public.profiles` row — `supabase/seed.sql` only ever created `...0001`/`...0002`. A "request a session" button built against the mock discovery list would have worked for the `maya` persona and failed `request_session`'s recipient-existence check for `eli`/`jonah`, inconsistently and for reasons invisible in the UI. Fixed by seeding two more synthetic accounts (`...0003` labeled "Eli", `...0004` labeled "Jonah", matching the personas they represent) in `supabase/seed.sql`, so all three mock discovery personas now resolve to real, requestable accounts. `supabase/tests/rls.test.sql`'s `discovery_profiles()` count assertion was updated from 1 to 3 accordingly (a real behavior change from adding real seed data, not a weakened test). Full local verification (100/100 pgTAP, integration test, typecheck/test/lint) re-run and green after this change.
