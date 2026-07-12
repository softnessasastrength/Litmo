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
| Automated checks | `npm run typecheck` pass; unit tests pass; **pgTAP 240/240**; integration **3/3**; seed password grant verified after seed-token fix (agent, 2026-07-12) |

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

| Status | **Automated backend Pass** (UI walkthrough still founder-owned) |
|--------|-------------------------------------------------------------------|
| Prep | `bash scripts/setup-track-b-local.sh` then `npm run api` + `npm run mobile` |
| Sign-in | Development seed form: `maya.demo@litmo.local` / `LitmoDemo123!` (ADR 0041) |
| Guide | `docs/TRACK_B_LOCAL.md` |
| Automated (2026-07-12 agent) | Docker up; setup script; **all four seed emails** password grant HTTP 200; `npm run test:integration` **5/5** (includes seed maya↔eli full lifecycle); `env HOME=/tmp npx supabase test db` **240/240** |
| Seed bug fixed | Seed rows left GoTrue token columns NULL → password login 500; fixed in `supabase/seed.sql` + setup verification (ADR 0041 addendum) |
| Next | Founder/operator completes **B1–B26 on device(s)** with two accounts (Face ID + UI path) |

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
| Founder | **Pass** | Pending UI walkthrough | Optional VoiceOver smoke | Track A confirmed good |
| Agent | Partial Maestro | **Automated backend Pass** | **Pass** (engineering) | Seed login fix + pgTAP/integration 2026-07-12 |

**Claim now:** Track A **Pass** (founder); Track C **Pass** (engineering a11y); Track B **automated backend Pass** (seed sign-in + two-client lifecycle).  
**Not yet:** Track B physical two-device UI (B1–B26), full BETA-001, TestFlight, production safe.

## Next to full green

1. **Track B on device** — founder runs B1–B26 with two seed accounts after `bash scripts/setup-track-b-local.sh` (use `app/.env.lan.example` on physical phone).  
2. Optional founder VoiceOver smoke on Soft Signal + Consent Snapshot.
