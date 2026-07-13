# ADR 0051: Optional owner-only quiz result summary backup

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Engineering
- **Supersedes (in part):** ADR 0050 item “keep all results device-local” — local remains primary; authenticated backup of _own_ summaries is now optional.

## Context

Quiz results began device-local only (ADR 0050). Authenticated users reinstalling
or switching phones lose self-understanding summaries. Partner comparison must
stay dual-consent and must not become a server-side scoreboard.

## Decision

1. Add `quiz_result_summaries` (migration 037) with **owner-only RLS** (select /
   insert / update / delete where `auth.uid() = user_id`).
2. Writes prefer `upsert_own_quiz_result_summary(...)` so `user_id` is always the
   actor and archetypes/mix/notes are constrained.
3. Store only **own** summary fields: quiz id, primary/secondary archetype,
   mix percentages, short insight notes, optional mode label, completed_at.
4. **Do not** store partner sealed results, comparisons, invite seal keys, or
   public/discovery scores.
5. Mobile `quizResultsRepository` always saves/loads local AsyncStorage first;
   when Supabase is configured and the user is authenticated, it best-effort
   backs up and merges remote own rows by newer `completedAt`. Failures never
   invent results and never block local save.
6. Partner share/compare remains device-local SecureStore + `quizShareCore`.

## Alternatives considered

- **Server-mediated dual-consent compare:** deferred; cryptographic dual consent
  is not enforced server-side in this slice.
- **Full migration off device storage:** rejected — demo mode and offline use
  still require local-first.
- **Encryption-at-rest of insight notes beyond RLS:** deferred; notes are soft
  model insights, not free-form private nervous-system diary text.

## Consequences

- Authenticated reinstall can restore own summaries via owner RLS.
- Demo mode and missing env continue to work with local-only storage.
- `export_my_data()` includes `quiz_result_summaries` for self portability.
- Production retention/deletion policy for quiz summaries remains undecided
  beyond cascade-on-auth-user-delete.

## Follow-up work

- Optional UI control to disable cloud backup.
- Account-deletion product path must clear or cascade these rows intentionally
  once deletion is implemented.
- If partner compare ever moves server-side, require dual consent enforcement
  and a separate ADR.
