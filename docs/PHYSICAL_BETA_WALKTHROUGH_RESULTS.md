# Physical beta walkthrough — results log

**Date:** 2026-07-12  
**Branch / SHA:** `main`  
**Operators:** founder (Track A) + coding agent (Maestro / docs)

## Environment matrix

| Item | Value |
|------|--------|
| Date | 2026-07-12 |
| Device (Track A) | Founder device (Track A confirmed good) + prior iPhone 17 Simulator automation |
| Build type | `com.litmo.app.dev` / Metro as used by founder |
| Supabase / backend (Track A) | Not required for fictional demo |
| Automated checks | `npm run typecheck` pass; app unit tests **74/74** pass (agent) |

## Track A — Fictional demo

| # | Result | Notes |
|---|--------|--------|
| A1 | **Pass** | Launch / welcome |
| A2 | **Pass** | Fictional demo entry, honest labeling |
| A3 | **Pass** | About you / vibe quiz |
| A4 | **Pass** | Touch Language + body-zone boundaries |
| A5 | **Pass** | Discover synthetic neighbors |
| A6 | **Pass** | Match / practice request path |
| A7 | **Pass** | Mock Consent Snapshot |
| A8 | **Pass** | Active session; Soft Signal labeled correctly |
| A9 | **Pass** | Soft Signal / end path |
| A10 | **Pass** | Wrap-up |
| A11 | **Pass** | Trust / private history (no score claim) |
| A12 | **Pass** | Cold restart / demo re-entry as designed |

**Track A overall: Pass** (founder confirmed 2026-07-12: “track a good”).

### Demo blockers re-check

| Blocker | Status |
|---------|--------|
| White screen without Metro | Documented; Debug needs Metro |
| Demo requiring Face ID | **Pass** — not required |
| Mock snapshot as real mutual | **Pass** — mock labeling present |

## Track B — Real accounts

| Status | **Pending** |
|--------|-------------|
| Next | Docker → `npm run db:start && npm run db:reset` → `npm run api` → LAN `app/.env` → two seed accounts → checklist B1–B26 |

## Track C — Accessibility

| # | Result | Notes |
|---|--------|--------|
| C1 | **Pass*** | Labels/roles/hints for Soft Signal + Consent Snapshot; *optional founder VoiceOver smoke in `docs/ACCESSIBILITY_TRACK_C.md` |
| C2 | **Pass** | Dynamic Type scaling on buttons/choices; timer capped so Soft Signal stays reachable |
| C3 | **Pass** | Reduced motion respected for FadeIn / progress |
| C4 | **Pass** | Soft Signal text + color (not color-only) |
| C5 | **Pass** | Min ~56pt / Soft Signal ~68pt + hitSlop |

**Track C overall: Pass** (engineering criteria 2026-07-12).

## Product fixes already on main

- Soft Signal control labeled **Soft Signal — end now** (not emergency services).

## Sign-off

| Role | Demo track | Real track | Accessibility | Notes |
|------|------------|------------|---------------|-------|
| Founder | **Pass** | Pending | Optional VoiceOver smoke | Track A confirmed good |
| Agent | Partial | — | **Pass** (engineering) | Track C hardening 2026-07-12 |

**Claim now:** Track A **Pass** (founder); Track C **Pass** (engineering a11y).  
**Not yet:** Track B (real accounts), full BETA-001, TestFlight, production safe.

## Next to full green

1. **Track B** — real two-account path with local Supabase + snapshot backend.  
2. Optional founder VoiceOver smoke on Soft Signal + Consent Snapshot.
