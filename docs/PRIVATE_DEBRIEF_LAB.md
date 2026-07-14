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

## Auto-ingest

Reconcile + Parallel Play append debriefs on complete/Soft Signal.  
Other protocols may append with their own sources.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/PRIVATE_DEBRIEF_LAB.md` | Spec |
| `app/lib/privateDebriefCore.ts` | Pure logic |
| `app/services/privateDebriefStore.ts` | Persist |
| `app/app/debrief-lab/index.tsx` | UI |
| `app/services/localDataWipe.ts` | Wipe key |

---

**Last updated:** 2026-07-13
