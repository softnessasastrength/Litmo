# Chapter 4 completion report — Session Lifecycle

**Date:** 2026-07-12  
**Branch lineage:** through migrations `001`–`021` and ADRs `0005`–`0023`  
**Status:** Engineering complete for the Chapter 4 session lifecycle as scoped
in `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`, with explicit remaining
product/release gaps below.

## Mission (from roadmap)

Implement a complete, recoverable, auditable session state machine from initial
request through independent wrap-up, preserving explicit consent, immediate
withdrawal, network interruption tolerance, and no duplicate/contradictory
transitions.

## Delivered

| Area                                       | Evidence                                                              |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Canonical state machine                    | `shared/src/sessionLifecycle.ts` + SQL mirror in `transition_session` |
| Requests create/accept/decline/cancel      | Migrations 015, 019; mobile match/requests                            |
| Request expiration (24h)                   | ADR 0018, migration 017                                               |
| Pre-activation review expiration (24h)     | ADR 0023, migration 021                                               |
| Consent Snapshot create/confirm            | ADR 0006, migrations 009–011, Express trusted path                    |
| Activation gate                            | DB trigger + dual confirmation                                        |
| Soft Signal / End together                 | ADR 0012, 0020; durable offline queues                                |
| Wrap-up private + offline retry            | ADR 0008, 0017                                                        |
| Realtime active + snapshot wait + requests | ADR 0016, 0019                                                        |
| Open-session resume                        | ADR 0022, migration 020                                               |
| Audit trail                                | `session_events` append-only                                          |
| Two-client integration                     | `integration/chapter4-session-lifecycle.test.mjs`                     |
| Phone-visible demo (no backend)            | ADR 0003, 0007 amendment                                              |

## Acceptance criteria map

- One canonical state machine — **met**
- Invalid/unauthorized transitions fail closed — **met** (pgTAP matrix)
- Request/transition idempotency — **met**
- Dual snapshot confirmation before active — **met**
- One stop ends session for both — **met** (Realtime + withdraw)
- Connectivity loss cannot broaden consent — **met** (fail closed + durable queues)
- Independent wrap-up privacy — **met** (RLS)
- Append-only audit trail — **met**
- Two-client E2E tests — **met**
- Lifecycle documented — **met** (ADRs + this report)

## Explicitly not Chapter 4 complete (deferred)

| Gap                                           | Why deferred                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| Blocking / eligibility                        | No product definition of “blocked” (Chapter 5 trust/moderation)          |
| Remote OS push                                | Credentials, preview privacy, AASA — release track                       |
| Express LAN snapshot path                     | Accepted single-device trade-off (ADR 0015); Edge move when multi-tester |
| Physical offline chaos tests                  | Require multi-device founder runs                                        |
| Independent safeguarding/legal review of copy | External                                                                 |

## How to verify locally

```bash
npm ci
npm run db:start && npm run db:reset
env HOME=/tmp npx supabase test db   # expect 130+ assertions after migration 021
npm run typecheck && npm test && npm run test:integration
npm run mobile   # Expo Go demo path without .env
```

## Recommended next chapter

**Chapter 5 — Trust and Moderation** (`docs/roadmap/CHAPTER_5_TRUST_AND_MODERATION.md`),
starting with a minimal one-way block model that plugs into `request_session`
eligibility — once product defines block semantics.
