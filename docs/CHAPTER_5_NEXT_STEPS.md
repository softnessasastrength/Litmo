# Chapter 5 — next steps

Started 2026-07-12 after Chapter 4 engineering completion
(`docs/CHAPTER_4_COMPLETION.md`).

## Delivered first slices

- **One-way blocks** (ADR 0024, migration 022):
  - `user_blocks`, `block_user` / `unblock_user` / `list_blocked_users`
  - Opaque `request_session` rejection when either party blocked the other
  - Discovery excludes pair-blocked accounts
  - Pending `requested` sessions between the pair cancel on block
  - Mobile: block on match profile; Settings → Blocked accounts
- **Adult eligibility** (ADR 0025, migration 023) — Apple Declared Age Range
  gate; composed with blocks on discovery/`request_session`.

## Next coherent slices (in order)

1. **Structured reports** — categories + private note (encrypted), session
   reference, reporter-visible status only.
2. **Human-review queue tables** — triage, assignment, internal notes, no
   public punishment automation.
3. **Trust event append-only model** for non-score signals (account age,
   completed sessions count for self, etc.) — never a universal safety score.
4. **Rate limits** on requests, reports, block thrash.

## Product decisions still open

- Auto-end active sessions when a participant blocks mid-session?
- Retention of block history after unblock for abuse analysis?

## How to resume

```bash
git checkout main && git pull
npm run db:reset
env HOME=/tmp npx supabase test db
```
