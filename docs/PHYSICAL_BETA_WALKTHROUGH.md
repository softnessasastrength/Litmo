# Physical beta walkthrough

**Status:** Ready for founder / private validation (not external TestFlight)  
**Date:** 2026-07-12  
**Related:** `docs/RELEASE_AND_TESTFLIGHT.md`, `docs/LOCAL_DEVELOPMENT.md`,  
`docs/CHAPTER_5_NEXT_STEPS.md`, ADR 0036 (real Consent Snapshot)

## Purpose

A single checklist to walk Litmo on a **physical iPhone** (and a second account
when testing real sessions) after Chapters 1–5 foundation work. Use this before
claiming “it works on device,” inviting another human, or opening TestFlight
work in earnest.

This is **not** approval for external beta. External blockers remain in
`docs/RELEASE_AND_TESTFLIGHT.md` and `docs/KNOWN_LIMITATIONS.md` (account
deletion, hosted staging, AASA, privacy review, audited first-launch, etc.).

## What “pass” means

- Every required step is **executable without a crash or blank white screen**.
- Failures are **fail-closed** with calm copy (no stack traces, no raw DB errors).
- Demo and real paths are **honestly labeled**.
- Safety controls (Soft Signal, withdraw, block, report) work without requiring
  an explanation.

Mark each item: **Pass** / **Fail** / **Blocked** / **N/A**, with a short note
and OS + build when useful.

---

## Track A — Fictional demo (Expo Go or dev build)

**Goal:** Prove the emotional/safety product language without accounts.

### Prerequisites

- [ ] Mac with Node 20.19+, `npm ci` completed
- [ ] `npm run mobile` (or Expo) running; phone on same Wi‑Fi as Metro
- [ ] **No** `app/.env` required for this track
- [ ] Expo Go compatible with current Expo SDK, **or** a local/EAS dev build

### Path checklist

| # | Step | Expected | Result |
|---|------|----------|--------|
| A1 | Launch app | Welcome / entry, not white screen or hard crash | |
| A2 | Explore prototype → **Enter the fictional demo** | Clear “no account / nothing saved” labeling | |
| A3 | About you / vibe quiz | Completes; produces provisional archetype | |
| A4 | Touch Language + body-zone boundaries | Completes; language is literal, not therapeutic claim | |
| A5 | Discover | Synthetic neighbors only; not presented as real people | |
| A6 | Match detail → practice request | Demo request path advances | |
| A7 | Mock Consent Snapshot | Rows from mock engine; labeled mock; confirm/stop | |
| A8 | Active session | Soft Signal prominent; timer/session controls work | |
| A9 | Soft Signal **or** end together | Session ends without mutual negotiation trap | |
| A10 | Wrap-up | Private reflection UI; no crash | |
| A11 | Trust / private history | Contextual history, **no score or safety claim** | |
| A12 | Cold restart | Demo not persisted (by design); re-enter demo if needed | |

### Demo failures to treat as blockers

- White screen on launch without Metro (document Metro vs Release path).
- Demo path requiring Face ID or Supabase.
- Mock snapshot presented as a real mutual agreement.

---

## Track B — Real accounts (dev build preferred)

**Goal:** Two synthetic adults complete request → real Consent Snapshot →
active session → Soft Signal/wrap-up, with Chapter 5 safety surfaces smoke-tested.

### Prerequisites

- [ ] Docker Desktop running; `npm run db:start` + `npm run db:reset`
- [ ] `app/.env` from `app/.env.example` with **LAN IP** (not `127.0.0.1`) for
      `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_BACKEND_URL`
- [ ] `backend/.env` with local `SUPABASE_URL` + **service role** key only
      (never `EXPO_PUBLIC_`)
- [ ] `npm run api` reachable from the phone (default port 3001)
- [ ] Face ID enrolled on device(s) for real sessions (ADR 0007)
- [ ] Two demo seed accounts (see `docs/LOCAL_DEVELOPMENT.md`), e.g.:
  - Account **Self:** `maya.demo@litmo.local` (or passkey device A)
  - Account **Peer:** second seed account / second device or second simulator
- [ ] Both accounts: onboarding + saved touch/consent profiles complete
- [ ] Age eligibility satisfied for the build environment (Declared Age Range
      or documented development self-attest path)

### Auth and lock

| # | Step | Expected | Result |
|---|------|----------|--------|
| B1 | Sign-in / passkey (if available) | Succeeds or fails closed honestly | |
| B2 | App background → return | Privacy cover / Face ID before private content | |
| B3 | Face ID cancel / lockout | Content stays covered; calm retry | |
| B4 | Sign-out | Session ends; no private rows left visible | |

### Discovery, request, consent

| # | Step | Expected | Result |
|---|------|----------|--------|
| B5 | Discover (signed in) | Real `discovery_profiles` or empty list (fail closed) | |
| B6 | Peer signals | Account age days + completed sessions shown as **facts, not a score** | |
| B7 | Match → request session | Creates `requested` session; peer sees incoming | |
| B8 | Peer accept | Session → accepted / consent path; no silent drop | |
| B9 | Open Consent Snapshot | **Real** rows from trusted backend (ADR 0036); not mock people | |
| B10 | Backend down / wrong LAN URL | Fail closed + retry; no silent mock fallback | |
| B11 | Confirm only one side | Waiting state; Realtime or refresh when peer confirms | |
| B12 | Both confirm | Session becomes ready → active (either may activate) | |
| B13 | Withdraw pre-activation | Cancelled; no active session; no penalty UI | |

### Active session and wrap-up

| # | Step | Expected | Result |
|---|------|----------|--------|
| B14 | Active timer | Reflects real `started_at` | |
| B15 | Soft Signal | Immediate local stop; peer sees terminal via Realtime | |
| B16 | Report mid-session | Opens structured report without forcing end | |
| B17 | End / complete + wrap-up | Wrap-up accepts; offline failure queues retry | |
| B18 | Home open sessions | Resume cards only for non-terminal work | |

### Chapter 5 safety smoke (single-device ok for most)

| # | Step | Expected | Result |
|---|------|----------|--------|
| B19 | Block from match / settings | Opaque future requests; discovery hides pair | |
| B20 | Unblock | Pair can discover/request again per policy | |
| B21 | Report from profile / wrap-up | Reporter sees coarse status only | |
| B22 | My reports / private signals | Self-only; not a universal score | |
| B23 | Staff queue (if staff role granted) | Non-staff: link hidden; staff: claim/note/resolve | |
| B24 | Matching hold (staff) | Discovery/request blocked; pending requests cancelled | |
| B25 | Permanent ban (staff, synthetic only) | Pre-activation cancelled; active → `safety_ended` | |
| B26 | Appeal (if restricted) | Submit/list; staff uphold or lift | |

### Accessibility (physical device)

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | VoiceOver on consent + Soft Signal | Labels, order, actions make sense | |
| C2 | Dynamic Type (largest) | No clipped safety controls | |
| C3 | Reduced motion | No meaning lost if motion reduced | |
| C4 | Color + text | Soft Signal not color-only | |
| C5 | Touch targets | Primary safety actions comfortably tappable | |

---

## Environment matrix (record what you used)

| Item | Value |
|------|--------|
| Date | |
| Device model / iOS | |
| Build type (Expo Go / Debug / Release / EAS preview) | |
| Metro host / LAN IP | |
| Supabase: local / hosted | |
| Backend snapshot service up? | Y/N |
| Accounts used (emails only, never passwords/tokens) | |
| Branch / commit SHA | |

---

## Evidence rules

**Do collect:** pass/fail table, OS/build, request IDs if shown, screenshots of
**non-private** chrome (welcome, empty states, settings structure).

**Do not collect or share:** consent body-zone details of real people, private
wrap-up notes, another person’s identity beyond synthetic labels, tokens, keys,
Face ID biometric data, or session content that could re-identify someone.

Prefer synthetic seed accounts. If a real human joins private validation, treat
all session content as sensitive and default to notes-only defect IDs.

---

## Known blockers (do not re-test as product bugs)

See `docs/KNOWN_LIMITATIONS.md`. Common during this walkthrough:

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Snapshot unavailable | Backend not running or phone can’t reach LAN URL | Start `npm run api`; fix `EXPO_PUBLIC_BACKEND_URL` |
| Passkeys unavailable | Expo Go or free Personal Team without Associated Domains | Use paid team / EAS or passwordless seed path if present |
| Age gate unavailable | Expo Go / old iOS | Dev self-attest only outside production |
| White screen (Debug) | Metro not running | Start Metro or use Release for offline smoke |
| Empty Discover | No other eligible profiles / blocks / restrictions | Seed second account; check restrictions |

---

## Sign-off

| Role | Name | Date | Demo track | Real track | Accessibility | Notes |
|------|------|------|------------|------------|---------------|-------|
| Founder / operator | | | Pass/Fail | Pass/Fail | Pass/Fail | |
| Second tester (optional) | | | | | | |

**Release claim after this doc:** “Founder private walkthrough completed on
physical device for listed tracks.”  
**Not a claim:** “Ready for TestFlight external testing” or “production safe.”

---

## After the walkthrough

1. File defects with track ID (e.g. `B9`) and environment matrix row.
2. Update `docs/KNOWN_LIMITATIONS.md` when a limitation is fixed or newly found.
3. Do not invite external testers until `docs/RELEASE_AND_TESTFLIGHT.md`
   blockers are cleared (deletion, staging, disclosures, independent review).
4. Optional next engineering: staff encrypted-note evidence, matching_hold on
   active sessions (product open), fuller screenshot gallery under `pics/`.
