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
- **Structured reports intake** (ADR 0026, migration 024):
  - `user_reports`, `submit_report` / `list_my_reports`
  - Categories + optional encrypted note + optional session reference
  - Reporter-visible coarse status only; reported party has zero access
  - Mobile: report on match profile; Settings → My reports
- **Human-review queue** (ADR 0027, migration 025):
  - `staff_roles`, `moderation_cases` (1:1 with reports), internal notes
  - Claim / note / resolve RPCs; category-based priority; no auto-ban
  - Ops grants staff; consumer moderator console still deferred
- **Rate limits** (ADR 0028, migration 026):
  - `session_request` 20/h; `report` 15/d; `block`/`unblock` 40/d
  - Non-revealing over-limit error; no auto-suspend
- **Trust events** (ADR 0029, migration 027):
  - Append-only ledger + triggers; `my_trust_signals` self-only
  - Settings → Your private signals (not a score)
- **Account restrictions** (ADR 0030, migration 028):
  - Staff `matching_hold` / `permanent_ban`; lift; audit trust events
  - Discovery + `request_session` enforcement; self-only access status
- **Report from wrap-up** — real sessions can open structured report with
  session + peer prefilled (soft signal / uncomfortable / safety concern)
- **Restriction lifecycle gates** (ADR 0031, migration 029):
  - Cancel pending `requested` sessions on apply
  - Block forward transitions while either party restricted
  - Decline / cancel / Soft Signal / complete still allowed
- **Report from active session** — mid-session report without ending

## Next coherent slices (in order)

1. **Moderator console UI** (internal tool) on top of existing RPCs.
2. **Optional peer-visible specific indicators** (e.g. account age) after
   product copy review — still never a universal score.
3. **Appeals** workflow.
4. Optional auto-end of **active** sessions on permanent ban (product decision).

## Product decisions still open

- Auto-end active sessions when a participant blocks mid-session?
- Retention of block history after unblock for abuse analysis?

## How to resume

```bash
git checkout main && git pull
npm run db:reset
env HOME=/tmp npx supabase test db
```
