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

Chapter 4 adds `shared/src/sessionLifecycle.ts` (`docs/adr/0005-session-lifecycle-state-machine.md`): a pure transition graph over the canonical session states (`draft` through `completed`, plus the terminal `declined`/`cancelled`/`expired`/`soft_signaled`/`safety_ended` states already defined by `ConsentLifecycleState`). `transition()` is idempotent for same-state retries and fails closed once a session reaches any terminal state — nothing can reopen a completed, cancelled, or safety-ended session by replaying an action.

Migration `007_session_lifecycle.sql` aligns the Chapter 1/2 `sessions` table's status values with this same canonical list and adds `session_events`, an append-only audit trail table. Migration `008_transition_session.sql` adds the only authenticated write boundary: `transition_session(...)` locks the session row, verifies the caller is a participant, returns the original result for a repeated session-scoped idempotency key, validates the SQL mirror of the canonical graph, updates state, and appends one event atomically. Authenticated clients still have no direct `INSERT`/`UPDATE` grant on either table. Audit metadata accepts only enumerated source/trigger values so participant-readable events cannot become a free-text channel for private notes or rejection reasons. Later migrations add the `ready -> active` snapshot gate, recipient-only request responses, `started_at` on activation, and request expiration through a database check-on-read/write pattern (`request_expires_at(...)`, `list_incoming_requests()`). Remaining follow-up work is transition-specific actor roles beyond request response, new-request Realtime, and the two-client integration path.

Migration `009_consent_snapshot_persistence.sql` and ADR 0006 split snapshot responsibility deliberately: the trusted server computes compatibility/fingerprints with `@litmo/domain`, while service-role-only creation and PostgreSQL enforce exact participant profile versions, RLS, independent private confirmations, withdrawal, and activation preconditions. The second exact confirmation transitions the session to `ready`; withdrawal clears confirmations and transitions to `cancelled`. A table trigger prevents `active` through every write path unless both participants confirmed the current unwithdrawn fingerprint.

`backend/services/sessionSnapshotService.js` is the framework-independent orchestration boundary for snapshot creation; `backend/services/supabaseSessionSnapshotRepository.js` is its privileged persistence adapter. `POST /api/sessions/:sessionId/snapshot` validates the caller's Supabase bearer token before any participant data is returned, loads both exact latest version pairs, computes one canonical snapshot, and persists it through `create_session_snapshot(...)`. The service-role key exists only in the backend process.

Migration 011 extends the canonical graph with the single conservative rewind `ready -> consent_pending`. `save_profile_versions(...)` invalidates unwithdrawn pre-activation snapshots that reference the editor's older exact version, deletes their confirmations, and appends a safe audit event in the same transaction as the new immutable profile versions. Active and terminal sessions are excluded. Mobile request wiring remains pending.

Migration 012 and ADR 0008 add participant-private wrap-up persistence. Each participant owns one immutable response, readable only by that participant, submitted through an idempotent security-definer function after a completed, soft-signaled, or safety-ended session. Private outcomes and notes never enter the counterpart-readable session audit trail. Mobile wrap-up wiring remains pending.

ADR 0011 and migration 013 add the application-encryption boundary for highly sensitive free text. The native vault owns CryptoKit AES-GCM and biometric-current-set, passcode-required, this-device-only Keychain keys; JavaScript receives only versioned ciphertext envelopes. Profile and wrap-up tables reject plaintext notes. Structured canonical snapshots stay server-readable under participant RLS so both people and PostgreSQL can enforce the same agreement.

Migration 014 and ADR 0012 add the single-party withdrawal authority. Snapshot-first/session-second locking serializes confirmation, activation, and withdrawal; one transaction invalidates confirmations, ends the session, and appends one reason-free audit fact. The mobile emergency-stop service locks decrypted state and stores a minimal Keychain pending action before network I/O, then replays the same idempotency key on restoration.

## Authentication and routing

`AuthContext` is the sole mobile authority for session state. It restores the Supabase session from the passcode-required, this-device-only iOS Keychain, verifies the installation registration, fetches the owner's profile, distinguishes incomplete onboarding from an authenticated account, subscribes to auth changes, and redirects protected routes conservatively. Account creation uses an email one-time code only as bootstrap proof before mandatory Apple passkey registration; routine sign-in is a server-challenged passkey ceremony through the local `LitmoPasskeys` Expo module. Explicit locked, authenticating, registering, expired, revoked, error, onboarding, authenticated, and demo states fail closed.

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


## Native macOS boundary

The native macOS workspace is generated from `macos/project.yml` and contains three targets with deliberately narrow responsibilities:

- `Litmo` is the participant-facing app. Its first slice owns only local Campfire state and honest read-only placeholders.
- `LitmoOps` is a separately bundled staff app. It fails closed and exposes no action without future server-backed staff authentication and authorization.
- `LitmoMacCore` contains presentation-safe local state only. It does not duplicate the canonical TypeScript consent engine, session state machine, matching eligibility, or staff policy.

Active physical sessions and Soft Signal remain phone-first. Consent and authorization remain server-authoritative. The participant and Ops apps use different bundle identifiers and entitlement files and currently share no App Group or Keychain group. See ADR 0045.
