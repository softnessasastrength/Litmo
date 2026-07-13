# Physical beta walkthrough — results log

**Date:** 2026-07-12  
**Branch / SHA:** `main`  
**Operators:** founder (Track A) + coding agent (Maestro / docs)

## Environment matrix

| Item                         | Value                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date                         | 2026-07-12                                                                                                                                               |
| Device (Track A)             | Founder device (Track A confirmed good) + prior iPhone 17 Simulator automation                                                                           |
| Build type                   | `com.litmo.app.dev` / Metro as used by founder                                                                                                           |
| Supabase / backend (Track A) | Not required for fictional demo                                                                                                                          |
| Automated checks             | `npm run typecheck` pass; unit tests pass; **pgTAP 240/240**; integration **3/3**; seed password grant verified after seed-token fix (agent, 2026-07-12) |

## Track A — Fictional demo

| #   | Result   | Notes                                         |
| --- | -------- | --------------------------------------------- |
| A1  | **Pass** | Launch / welcome                              |
| A2  | **Pass** | Fictional demo entry, honest labeling         |
| A3  | **Pass** | About you / vibe quiz                         |
| A4  | **Pass** | Touch Language + body-zone boundaries         |
| A5  | **Pass** | Discover synthetic neighbors                  |
| A6  | **Pass** | Match / practice request path                 |
| A7  | **Pass** | Mock Consent Snapshot                         |
| A8  | **Pass** | Active session; Soft Signal labeled correctly |
| A9  | **Pass** | Soft Signal / end path                        |
| A10 | **Pass** | Wrap-up                                       |
| A11 | **Pass** | Trust / private history (no score claim)      |
| A12 | **Pass** | Cold restart / demo re-entry as designed      |

**Track A overall: Pass** (founder confirmed 2026-07-12: “track a good”).

### Demo blockers re-check

| Blocker                      | Status                           |
| ---------------------------- | -------------------------------- |
| White screen without Metro   | Documented; Debug needs Metro    |
| Demo requiring Face ID       | **Pass** — not required          |
| Mock snapshot as real mutual | **Pass** — mock labeling present |

## Track B — Real accounts

| Status                                | **Pass** (automated backend + physical B1–B26 UI walkthrough)                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prep                                  | `bash scripts/setup-track-b-local.sh` then `npm run api` + `npm run mobile`                                                                                                                             |
| Sign-in                               | Development seed form: `maya.demo@litmo.local` / `LitmoDemo123!` (ADR 0041)                                                                                                                             |
| Guide                                 | `docs/TRACK_B_LOCAL.md`                                                                                                                                                                                 |
| Automated (2026-07-12 agent)          | Docker up; setup script; **all four seed emails** password grant HTTP 200; `npm run test:integration` **5/5** (includes seed maya↔eli full lifecycle); `env HOME=/tmp npx supabase test db` **240/240** |
| Seed bug fixed                        | Seed rows left GoTrue token columns NULL → password login 500; fixed in `supabase/seed.sql` + setup verification (ADR 0041 addendum)                                                                    |
| Physical B1–B26 (2026-07-13, founder) | **Pass** — all 26 items passed on physical device(s) with two seed accounts                                                                                                                             |

### Track B physical walkthrough (B1–B26)

| #   | Item                                  | Result   |
| --- | ------------------------------------- | -------- |
| B1  | Sign-in / passkey                     | **Pass** |
| B2  | App background → return               | **Pass** |
| B3  | Face ID cancel / lockout              | **Pass** |
| B4  | Sign-out                              | **Pass** |
| B5  | Discover (signed in)                  | **Pass** |
| B6  | Peer signals                          | **Pass** |
| B7  | Match → request session               | **Pass** |
| B8  | Peer accept                           | **Pass** |
| B9  | Open Consent Snapshot                 | **Pass** |
| B10 | Backend down / wrong LAN URL          | **Pass** |
| B11 | Confirm only one side                 | **Pass** |
| B12 | Both confirm                          | **Pass** |
| B13 | Withdraw pre-activation               | **Pass** |
| B14 | Active timer                          | **Pass** |
| B15 | Soft Signal                           | **Pass** |
| B16 | Report mid-session                    | **Pass** |
| B17 | End / complete + wrap-up              | **Pass** |
| B18 | Home open sessions                    | **Pass** |
| B19 | Block from match / settings           | **Pass** |
| B20 | Unblock                               | **Pass** |
| B21 | Report from profile / wrap-up         | **Pass** |
| B22 | My reports / private signals          | **Pass** |
| B23 | Staff queue (if staff role granted)   | **Pass** |
| B24 | Matching hold (staff)                 | **Pass** |
| B25 | Permanent ban (staff, synthetic only) | **Pass** |
| B26 | Appeal (if restricted)                | **Pass** |

**Track B overall: Pass** (founder confirmed 2026-07-13: all B1–B26 passed on physical device(s)).

## Track C — Accessibility

| #   | Result    | Notes                                                                                                                       |
| --- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Pass*** | Labels/roles/hints for Soft Signal + Consent Snapshot; *optional founder VoiceOver smoke in `docs/ACCESSIBILITY_TRACK_C.md` |
| C2  | **Pass**  | Dynamic Type scaling on buttons/choices; timer capped so Soft Signal stays reachable                                        |
| C3  | **Pass**  | Reduced motion respected for FadeIn / progress                                                                              |
| C4  | **Pass**  | Soft Signal text + color (not color-only)                                                                                   |
| C5  | **Pass**  | Min ~56pt / Soft Signal ~68pt + hitSlop                                                                                     |

**Track C overall: Pass** (engineering criteria 2026-07-12).

## Product fixes already on main

- Soft Signal control labeled **Soft Signal — end now** (not emergency services).

## Sign-off

| Role    | Demo track      | Real track                                       | Accessibility            | Notes                                         |
| ------- | --------------- | ------------------------------------------------ | ------------------------ | --------------------------------------------- |
| Founder | **Pass**        | **Pass** (B1–B26 on physical device, 2026-07-13) | Optional VoiceOver smoke | Track A + Track B UI both confirmed good      |
| Agent   | Partial Maestro | **Automated backend Pass**                       | **Pass** (engineering)   | Seed login fix + pgTAP/integration 2026-07-12 |

**Claim now:** Track A **Pass** (founder); Track C **Pass** (engineering a11y); Track B **Pass** (automated backend + physical B1–B26 UI walkthrough, founder, 2026-07-13). BETA-001 acceptance criteria met on `main`.
**Not yet:** Optional founder VoiceOver smoke; full BETA-001 is not TestFlight or production-safety approval — see `RELEASE_AND_TESTFLIGHT` blockers before any external distribution.

## Next to full green

BETA-001 is closed. Remaining optional item:

1. Optional founder VoiceOver smoke on Soft Signal + Consent Snapshot (`docs/ACCESSIBILITY_TRACK_C.md`).

External TestFlight / private-alpha distribution remains a separate, explicitly gated decision — see `CURRENT_STATE.md` known limitations.
