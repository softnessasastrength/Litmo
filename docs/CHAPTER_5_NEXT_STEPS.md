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
- **Moderator console UI** (ADR 0032, migration 030):
  - Staff queue + case detail (claim / notes / resolve / 7-day hold)
  - Settings link only when `is_staff_moderator()`
- **Peer-visible specific signals** (ADR 0033, migration 031):
  - `account_age_days` + `completed_sessions` on discovery / peer RPC
  - Explicit not-a-score copy
- **Restriction appeals** (ADR 0034, migration 031):
  - Submit / list / staff resolve (uphold or lift)
  - Settings → Appeals; staff → Open appeals
- **Real discovery UI** — authenticated Discover uses `discovery_profiles`
  with peer signals; demo keeps mock neighbors
- **Permanent ban ends open work** (ADR 0035, migration 032):
  - Pre-activation cancelled; active → `safety_ended`
  - Holds still only cancel `requested`
- **Real Consent Snapshot display** (ADR 0036):
  - Real `sessionId` path loads/creates trusted snapshot and renders
    `compatibility` rows (no mock fixtures)
  - Demo path (no `sessionId`) unchanged
  - Requires `EXPO_PUBLIC_BACKEND_URL` + snapshot service for create
- **Physical beta walkthrough checklist** (`docs/PHYSICAL_BETA_WALKTHROUGH.md`):
  - Track A demo (Expo Go) + Track B real two-account path
  - Chapter 5 safety smoke + accessibility matrix
  - Evidence rules; not external TestFlight approval
- **Staff case evidence** (ADR 0037, migration 033):
  - `staff_shared_message` on reports (human-reviewer readable)
  - `get_moderation_case_evidence` pack: message, session meta, restriction,
    prior report counts (not a score)
  - Device-encrypted `private_note` remains optional/legacy opaque to staff
- **Matching hold ends open work** (ADR 0038, migration 034):
  - Holds cancel pre-activation and safety-end active (aligned with permanent ban)
- **Semantic haptics** (ADR 0039 / HAPTIC-001):
  - Five-event local vocabulary; Settings toggle; Soft Signal + learning hooks
- **Block ends open pair sessions** (ADR 0040, migration 035):
  - Cancels pre-activation; safety-ends active with blocked person
  - Active session: “Block this person and leave”
- **System appearance** — Settings cycles light / dark / system (OS follow)

## Next coherent slices (in order)

1. Physical walkthrough: **Track A Pass** + **Track C Pass** + **Track B automated backend Pass** (seed login + integration). Founder still owns B1–B26 on device (`docs/TRACK_B_LOCAL.md`).
2. Optional: block history retention after unblock (abuse analysis — product open).
3. Optional: Soft Signal vs dedicated emergency-stop control if product wants a second control.

## Product decisions still open

- Retention of block history after unblock for abuse analysis?

## How to resume

```bash
git checkout main && git pull
npm run db:reset
env HOME=/tmp npx supabase test db
```
