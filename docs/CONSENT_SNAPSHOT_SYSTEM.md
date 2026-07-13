# Consent Snapshot system (pre-session)

**Status:** implemented for local/demo dual seal; real dual-device backend path remains Chapter 4 confirm APIs  
**Routes:** `/consent-snapshot/prepare` · `/consent-snapshot/mutual` · existing `/match/consent-snapshot`

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
| `app/lib/sessionConsentSnapshotCore.ts` | Model, intersection, seal, withdraw, rows |
| `app/services/sessionConsentSnapshotStore.ts` | Secure local persistence |
| `app/app/consent-snapshot/prepare.tsx` | Your declaration wizard |
| `app/app/consent-snapshot/mutual.tsx` | Dual affirm + seal UI |
| `app/app/match/consent-snapshot.tsx` | Live/mock engine overlap + link to prepare |

## Feel

Protective copy, signal-colored banners, Soft Signal non-negotiable block, fingerprint display, withdraw without explanation — designed to feel like a **safety gate**, not an engagement funnel.
