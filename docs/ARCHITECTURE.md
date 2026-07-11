# Architecture

## Boundaries

```text
Expo Router UI
  → authoritative AuthContext
  → typed repositories and public error mapping
  → Supabase client using anon credentials + user JWT
  → PostgreSQL functions, constraints, and RLS

UI/API adapters
  → @litmo/domain runtime schemas
```

`shared/` owns framework-independent types, enum values, runtime schemas, and validated serialization. UI components do not call Supabase directly. `profileRepository` owns profile persistence, timeouts, boundary parsing, and safe error translation.

Chapter 3 adds the canonical pure consent engine to `shared/`. It models receive/offer direction, produces deterministic conservative overlap and explanations, and creates exact-version snapshot records. Compatibility and consent remain different states: engine output cannot activate consent. `previewProfileChange` reuses the same engine to diff a not-yet-saved profile version against the saved one, both against the same counterpart, so a user can see the practical effect of an edit before it becomes a new immutable version. The preview never persists a version and never grants consent.

`toConsentProfileVersion` (`docs/adr/0002-legacy-profile-adapter.md`) is a read-time adapter that maps Chapter 2's persisted touch/consent shapes onto the canonical `ConsentProfileVersion` the engine expects. `backend/routes/compatibility.js` exposes it as `POST /api/consent/compatibility`, the canonical replacement for the deprecated `/api/consent/overlap` POC route. The mobile `app/app/match/consent-snapshot.tsx` screen calls the same adapter and `computeCompatibility` directly against fixed mock fixtures (`app/data/mockConsentProfiles.ts`) and formats the result with the pure, unit-tested `app/lib/consentSnapshotView.ts`. This proves the real engine end-to-end in the UI while both participants remain mock until Chapter 4 wires live discovery and sessions.

Chapter 4 adds `shared/src/sessionLifecycle.ts` (`docs/adr/0005-session-lifecycle-state-machine.md`): a pure transition graph over the canonical session states (`draft` through `completed`, plus the terminal `declined`/`cancelled`/`expired`/`soft_signaled`/`safety_ended` states already defined by `ConsentLifecycleState`). `transition()` is idempotent for same-state retries and fails closed once a session reaches any terminal state — nothing can reopen a completed, cancelled, or safety-ended session by replaying an action. This is the transition graph only; actor authorization, snapshot-version matching, idempotency-key deduplication, and the audit trail's persistence are explicit follow-up work requiring backend/DB wiring this machine cannot test locally yet (no Docker, per `docs/CHAPTER_2_COMPLETION.md`).

## Authentication and routing

`AuthContext` is the sole mobile authority for session state. It restores the Supabase session from device storage, fetches the owner's profile, distinguishes incomplete onboarding from a ready account, subscribes to auth changes, and redirects protected routes conservatively. Expired sessions return to sign-in.

A `"demo"` status (`docs/adr/0003-demo-mode-entry-point.md`) lets the app run the full Chapter 1 tap-through path with no Supabase instance at all. It is entered only by an explicit user action (never a silent fallback), never touches Supabase, and is never persisted across an app restart. `protectedRouteFor` treats it like a signed-in state for leaving the auth route group, but never forces a redirect once outside it. Screens that require a real account (`profile/edit.tsx`, and persistence inside `onboarding/quiz.tsx` / `onboarding/touch-language.tsx`) already guarded on `user` being present for Chapter 2; demo mode reuses that same guard rather than a second implementation, and the one place that previously no-op'd instead of advancing (`onboarding/touch-language.tsx`'s save handler) now does.

## Profile separation

- `profiles` contains general identity and discovery-safe candidates.
- `onboarding_progress` contains an owner-private draft.
- `touch_profile_versions` contains immutable touch preferences and separately stored private notes.
- `consent_preference_versions` contains immutable consent boundaries and separately stored private notes.
- `discovery_profiles()` returns only explicitly selected general fields.

Material touch/consent changes call `save_profile_versions` transactionally. An advisory transaction lock serializes version numbers per user. Triggers reject updates and deletes.

## Existing proof-of-concept layers

The Express consent-overlap service and early session/trust migrations remain intact. Chapter 2 does not expand the consent engine or session lifecycle; those are Chapter 3 and Chapter 4.
