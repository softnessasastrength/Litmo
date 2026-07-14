# Consent Snapshot system (pre-session)

**Status:** implemented for local/demo dual seal + nuclear domain machine (ADR 0062)  
**Routes:** `/consent-snapshot/prepare` · `/consent-snapshot/mutual` · existing `/match/consent-snapshot`  
**Nuclear twin:** `@litmo/domain` → `sessionConsentNuclear.ts` · migration 043

> Before any in-person session, both people create and mutually agree on a digital snapshot that includes **current boundaries**, **mood/capacity**, **safewords**, **aftercare**, and **Soft Signal**.  
> It must feel **serious and protective** — not a casual checklist.

## Product rules

1. A declaration alone is **not** consent.  
2. A match, vibe, or Touch Language map is **not** consent.  
3. Only a **mutual seal** of the **same fingerprint** allows proceeding.  
4. Soft Signal ends everything immediately — no explanation, either person.  
5. Withdrawal is free and reason-free.  
6. Seal is **for this moment only** and never a lifetime safety guarantee.

## What each person declares

| Field | Purpose |
| --- | --- |
| Mood | Grounded / open / tender / guarded / low capacity / unsure |
| Energy | Steady / low / high / tired / recovering |
| Boundaries | From Touch Language map (welcomed / ask-first / soft limit / off limits) |
| Hard limits | Absolute nos (union in intersection) |
| Soft limits | Usually avoid (union in intersection) |
| Safewords | Stop · Slow · optional OK |
| Aftercare | Multi-select preferences + optional note |
| Soft Signal ack | Immediate stop · no explanation · mutual availability |

## Mutual package

`MutualConsentSnapshot` includes:

- Party A + Party B declarations  
- Fail-closed **intersection** (stricter status wins; off_limits always wins)  
- Soft Signal banner (always available)  
- Dual affirmation checklists (six protective checks each)  
- `fingerprint`, `sealedAt`, withdrawal fields  

## Demo vs real

| Mode | Behavior |
| --- | --- |
| **Demo / practice** | One phone: your declaration + labeled practice partner; you rehearse dual affirmations |
| **Real session** | Existing backend snapshot + dual `confirmSnapshot` (`/match/consent-snapshot?sessionId=`) |

## Code map

| Path | Role |
| --- | --- |
| `app/lib/sessionConsentSnapshotCore.ts` | Model, intersection, seal, withdraw, fingerprint helpers, rows |
| `app/services/sessionConsentSnapshotStore.ts` | Secure local persistence |
| `app/app/consent-snapshot/prepare.tsx` | Your declaration wizard (clears mutual on re-save) |
| `app/app/consent-snapshot/mutual.tsx` | Dual affirm + Soft Signal mid-seal + fingerprint rebuild |
| `app/app/match/consent-snapshot.tsx` | Live/mock engine overlap + link to prepare |

## Soft Signal mid-seal + fingerprint rebuild (Agent 06 · 2026-07-14)

| Law | Behavior |
| --- | -------- |
| Soft Signal mid-seal | Sticky `SoftSignalButton` on mutual; `withdrawMutualSnapshot` immediately; no arm; no reason |
| Stop vs seal | Soft Signal wins; seal arm freezes; enter-session forbidden after stop |
| Fingerprint rebuild | Prepare edit / self declaration drift → rebuild unsealed package + wipe checklists |
| Prepare re-save | `clearMutual()` so vault cannot retain a stale seal |
| Parse integrity | Stored fingerprint ≠ content → wipe affirmations + `sealedAt` (fail closed) |
| DEMO honesty | Practice partner banner retained; not two real people |

## Feel

Protective copy, signal-colored banners, Soft Signal non-negotiable block, fingerprint display, Soft Signal mid-seal without explanation — designed to feel like a **safety gate**, not an engagement funnel.

## Nuclear machine (ADR 0062)

| Concern | Law |
| --- | --- |
| Immutability | Snapshot fingerprint/profiles/compatibility never mutate in place (DB trigger) |
| Mutual seal | Both confirm **same** fingerprint; withdrawn/invalid → not confirmable |
| Revocation | Soft Signal / withdraw clears confirmations + terminal lifecycle; ledgered |
| Offline | Soft Signal intent outranks complete; terminal server wins reopen attempts |
| Wrap-up | Private per party after `completed` / `soft_signaled` / `safety_ended`; `skipped` allowed |
| Activation | `ready` + dual seal only (`canActivateSession` / `enforce_active_snapshot`) |

See `docs/adr/0062-nuclear-session-consent-machine.md`.
