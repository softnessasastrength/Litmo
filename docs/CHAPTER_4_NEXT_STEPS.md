# Chapter 4 — next steps

Written 2026-07-12 so a break in work (or a new session/agent) can resume without re-deriving context. Read this alongside `AGENTS.md`'s "What 'continue' means" section and `docs/adr/0005-session-lifecycle-state-machine.md`.

## Where things stand right now

- `shared/src/sessionLifecycle.ts`: pure transition graph, fully tested (59 shared tests total).
- `supabase/migrations/007_session_lifecycle.sql`: `sessions` table aligned to the canonical 12 states, `session_events` audit trail table added. Both are **read-only** for `authenticated` — no client can write session state yet, by design.
- Docker/local Supabase is working on this machine (a real, hard-won milestone — see `docs/MACHINE_SETUP.md` if it ever needs rebuilding). `npm run db:start && npm run db:reset` gets a fully working local backend.
- Branch: `agent/chapter-4-session-lifecycle`, pushed. No PR opened yet.

## Deliverable 1 — the `transition_session(...)` Postgres function

The single most important next piece. Everything else in Chapter 4 depends on it existing.

**What it needs to do**, atomically, in one transaction:

1. Take `(session_id, to_state, idempotency_key default null, metadata default '{}')`.
2. Verify `auth.uid()` is a participant (`user_a` or `user_b`) of the session. Reject otherwise.
3. Check `idempotency_key`: if an event with this exact `(session_id, idempotency_key)` already exists, return that event's `resulting_state` again rather than re-applying anything (matches `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`'s "return a stable result for repeated idempotency keys").
4. Validate the transition against the **same graph** as `shared/src/sessionLifecycle.ts`'s `sessionTransitions` — this has to be hand-mirrored in SQL (Postgres can't import the TS module), so keep the two in a comment cross-reference and add a test that would catch drift if one changes without the other (e.g., a pgTAP test enumerating both graphs' edges and asserting they match, or at minimum a code comment loudly flagging "keep in sync with shared/src/sessionLifecycle.ts").
5. Lock the row (`select ... for update`) before checking/updating to prevent a race between two concurrent transition attempts.
6. Update `sessions.status` and insert exactly one `session_events` row (prior_state, resulting_state, actor_id, idempotency_key, metadata) in the same transaction.
7. Grant `EXECUTE` on this function to `authenticated` — this becomes the _only_ write path; `sessions`/`session_events` themselves stay ungranted for direct INSERT/UPDATE.

**Testing**: extend `supabase/tests/session_lifecycle.test.sql` (or a new file) covering: every valid transition succeeds and writes one event; every invalid transition raises and writes nothing; a non-participant is rejected; a repeated idempotency key returns the same result without a second event row; a terminal-state session rejects any further transition.

**Don't implement yet** (explicitly deferred per ADR 0005): snapshot-version matching at `ready -> active` (needs the canonical snapshot persisted somewhere first — see Deliverable 2) and realtime broadcast of the change (Supabase Realtime, separate concern).

## Deliverable 2 — persist the canonical Consent Snapshot

`shared/src/consentSnapshot.ts` already has `createConsentSnapshot`, `confirmSnapshot`, `invalidateForMaterialChange`, and `withdrawConsent` — all pure, all tested. None of it is persisted anywhere yet (`docs/KNOWN_LIMITATIONS.md`'s "Release blockers" section calls this out explicitly).

Needed: a `consent_snapshots` table (id, session_id, profile_a_id/version, profile_b_id/version, fingerprint, compatibility jsonb, confirmations jsonb or a separate confirmations table, withdrawn_by/at) plus RLS so only the two participants can read it, and a security-definer function that calls the existing pure `createConsentSnapshot`/`confirmSnapshot` logic (ported to a Postgres function, or called from the Express backend if that's the chosen home — this is the same "which backend owns this" question flagged in `docs/TODO.md` for the passwordless-auth item, worth deciding once rather than per-feature).

This is what makes the `ready -> active` transition's snapshot-version precondition (deferred in Deliverable 1) actually checkable.

## Deliverable 3 — wire the mock session screens to real data

`app/app/session/active.tsx` and `session/wrap-up.tsx` are still fully local, fake-timer mocks (confirmed in this session — no backend calls at all). Once Deliverables 1–2 exist:

- Replace the local timer with a real `active` session row + Supabase Realtime subscription so both participants see the same state.
- Wire the Soft Signal / "End together" buttons to call `transition_session(..., 'soft_signaled' | 'completed')`.
- Wrap-up: persist each participant's private outcome independently (never visible to the other participant — this is a hard product requirement, not just a nice-to-have).

This is bigger and should probably be its own follow-up plan once 1–2 land; listed here so it's not forgotten.

## Not yet scoped (fine to leave for later)

Realtime sync details, connectivity/offline recovery, request expiration (needs either a scheduled job or a check-on-read pattern — undecided), and the two-client Chapter 4 integration test the roadmap doc calls for. Don't start these before Deliverable 1 exists under them.

## How to resume

If picking this up fresh (new session, new agent, or just after a break):

1. `git checkout agent/chapter-4-session-lifecycle` (or start a new branch off it if it's already merged).
2. Confirm Docker/Supabase still work: `npm run db:start && npm run db:reset && npx supabase test db` should show 14/14 passing.
3. Start on Deliverable 1 above. Read `docs/adr/0005-session-lifecycle-state-machine.md` in full first — it documents the exact design decisions and why they were made.
