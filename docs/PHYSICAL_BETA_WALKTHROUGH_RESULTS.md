# Physical beta walkthrough — results log

**Date:** 2026-07-12  
**Branch / SHA:** `main` @ post Soft Signal label fix (`agent/beta-walkthrough-green_grok`)  
**Operator:** coding agent + automated Maestro (not founder Face ID session)

## Environment matrix

| Item | Value |
|------|--------|
| Date | 2026-07-12 |
| Device | iPhone 17 Simulator (iOS 27.0) — **not physical** |
| Build type | `com.litmo.app.dev` Debug + Metro `:8081` |
| Metro host / LAN | localhost (sim) / LAN `192.168.4.52` available for phone |
| Supabase | **Not running this session** (`DOCKER_NO`) |
| Backend snapshot | **Not running** |
| Accounts | N/A (Track A only) |
| Automated checks | `npm run typecheck` pass; app unit tests **74/74** pass |

## Track A — Fictional demo

| # | Result | Notes |
|---|--------|--------|
| A1 | **Pass** | Maestro: welcome / Explore the prototype (multiple runs) |
| A2 | **Pass** | Fictional demo entry with honest demo labeling |
| A3 | **Pass*** | About you: name + age + gender screen reached via Maestro; full quiz not fully automated in this session (*partial automation — human can complete rest in ~2 min) |
| A4 | **Pending human** | Touch Language + boundaries path exists; not Maestro-complete this run |
| A5–A12 | **Pending human / sim** | Product path present (discover mocks, mock snapshot, Soft Signal label fixed). Full Maestro end-to-end flaked on keyboard/Next; not a product white-screen failure |

### Demo blockers re-check

| Blocker | Status |
|---------|--------|
| White screen without Metro | Documented; Metro required for Debug |
| Demo requiring Face ID | **Pass** — demo path does not require Face ID |
| Mock snapshot as real mutual | **Pass** — mock labeling present in product |

## Track B — Real accounts

| Status | **Blocked this session** |
|--------|---------------------------|
| Reason | Docker Desktop not available → no `db:reset` / local Supabase / snapshot API |
| Unblock | Start Docker → `npm run db:start && npm run db:reset` → `npm run api` → LAN URLs in `app/.env` → two seed accounts on device |

Chapter 4 lifecycle integration test remains the offline proof for request→snapshot→active→Soft Signal when Docker is up (`npm run test:integration`).

## Track C — Accessibility

| Status | **Pending physical / VoiceOver** |
|--------|----------------------------------|
| Soft Signal | Label is **“Soft Signal — end now”** (no longer “Emergency stop”); signal color + text labels |

## Product fix shipped in this cook

- Active session primary stop control renamed to **Soft Signal — end now** with non-emergency copy (A8 / B15 honesty).

## Sign-off (honest)

| Role | Demo track | Real track | Accessibility | Notes |
|------|------------|------------|---------------|-------|
| Agent automation | **Partial Pass** (A1–A2 solid; A3 partial) | **Blocked** (no Docker) | **Not run** | Simulator only |
| Founder | | | | **Required for full green** on physical iPhone |

**Claim allowed after founder completes remaining rows on a physical phone:**  
“Founder private walkthrough completed on physical device for listed tracks.”

**Claim not allowed yet:** full BETA-001 green, TestFlight ready, production safe.

## How founder finishes green (~20–40 min)

1. Physical iPhone + Metro on same Wi‑Fi (or Release build).  
2. Track A: hand-walk A3–A12 once (demo).  
3. Docker on: Track B with two seed accounts + `npm run api`.  
4. Track C: VoiceOver on Soft Signal + Consent Snapshot.  
5. Fill Result column in `docs/PHYSICAL_BETA_WALKTHROUGH.md` and update this file.

## Maestro helper

```bash
export PATH="$PATH:$HOME/.maestro/bin"
# Metro must be running for Debug
maestro test docs/screenshots/maestro-track-a-walkthrough.yaml
```
