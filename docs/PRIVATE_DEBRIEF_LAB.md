# Private Debrief Lab v0.2

**This is currently a personal emotional containment system, not a public product.**

> Maximum precision on turning interactions into **useful local data** without being creepy.

**Route:** `/debrief-lab`  
**Core:** `app/lib/privateDebriefCore.ts`  
**Key:** `litmo.private_debrief.log.v1` (max 200 entries)

---

## Purpose

After containment rituals, capture:

- what worked  
- what didn’t  
- regulation 1–5  
- controlled tags  
- Soft Signal used (skill, not failure)  
- would-do-again  

…so patterns are legible **without** building a partner dossier.

---

## Precision fields

| Field | Rules |
| ----- | ----- |
| `title` | ≤120 chars |
| `regulation` | 1–5 or null |
| `worked` / `didnt` | ≤500 each |
| `tags` | from controlled vocab only (UI), ≤12 |
| `softSignalUsed` | boolean — skill signal |
| `again` | optional boolean |
| `source` | enum of known protocols + `manual` |

---

## Insights (local, non-clinical)

`generateInsights` may emit:

- Soft Signal rate as skill  
- Low/high average regulation cautions  
- Top tag themes (not diagnoses)  
- Source concentration (serving vs avoidance question)  
- Always: anti-creep reminder  

Never: neediness scores, partner grades, red-flag engines.

---

## Forbidden (anti-creep)

We never store:

- Partner messages / voice content  
- Partner location / last-seen / reply latency scores  
- Secret recordings or screenshots of the other person  
- Public or shareable safety scores about partners  
- Neediness / clinginess / red-flag scores  
- Cross-user analytics or cloud dossiers  
- Anything that cannot be wiped in one local burn  

---

## Auto-ingest (store-level bridge)

Every containment history `store.append` fires a unified debrief via
`app/lib/protocolDebriefBridge.ts` → `privateDebriefStore.ingest`.

| Protocol store | Source |
| -------------- | ------ |
| spooningStore | `spooning` |
| morningCuddleStore | `morning_cuddle` |
| conflictSimStore | `conflict_sim` |
| tooMuchStore | `too_much` |
| needScaredStore | `need_scared` |
| interestReStore | `interest_re` |
| attachmentRepairStore | `attachment_repair` |
| notReadyYetStore | `not_ready_yet` |
| reconcileStore | `reconcile` |
| parallelPlayStore | `parallel_play` |
| preRennGateStore | `pre_renn` |
| weatherStore | `weather` |
| aftercareStore | `aftercare` |

Manual entries still use `/debrief-lab` UI (`source: manual`).  
Ingest is best-effort; protocol history remains the source of truth for that ritual.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/PRIVATE_DEBRIEF_LAB.md` | Spec |
| `app/lib/privateDebriefCore.ts` | Pure logic |
| `app/lib/protocolDebriefBridge.ts` | Protocol → unified debrief maps |
| `app/lib/protocolDebriefBridge.test.ts` | Bridge tests |
| `app/services/privateDebriefStore.ts` | Persist + ingest |
| `app/app/debrief-lab/index.tsx` | UI |
| `app/services/localDataWipe.ts` | Wipe key |

---

**Last updated:** 2026-07-13
