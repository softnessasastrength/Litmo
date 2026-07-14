# Conflict Navigation Simulator v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because “we need to talk” still feels like a court summons issued by my childhood.**

**Route:** `/conflict-sim`  
**Date:** 2026-07-13  
**Core:** `app/lib/conflictSimCore.ts`

---

## Purpose

Externalize:

- terror of conflict  
- shame about never successfully navigating conflict  
- freeze / fawn / flee / fight as default OS  

…into a **solo-capable simulator** so raw conflict panic is less likely to dump onto **Renn** without a map.

Comedy gold. Secretly skill-adjacent. **Not** proof you can do real conflict. Not therapy. Not a public product.

---

## Containment job

Hold “if I bring this up I will ruin everything / look broken / get abandoned” long enough to:

1. Name the issue  
2. Feel the body  
3. Draft one non-weapon I-statement  
4. Remember Soft Signal / pause / reschedule  
5. Debrief without grading your soul  

---

## Modes

| Mode | When |
| ---- | ---- |
| **Solo Rehearsal** | Practice alone before a real talk |
| **Soft Signal First** | Priority is exit / pause, not winning |
| **Flood Protocol** | Already flooded — minimal steps, Soft Signal free |
| **Repair Script** | After a mess — structure for “I’m back / I care / I need a do-over” |

---

## Flow (fail-closed)

```text
1. Mode + intensity seal (Soft Signal acknowledged)
2. Name the issue (one sentence)
3. Body check (where is it?)
4. Draft I-statement (template)
5. Choose move: ask / pause / Soft Signal / reschedule
6. Optional partner script (joke / future use)
7. Debrief + joke ledger
```

No seal → no sim. Soft Signal always free mid-sim.

---

## Soft Signal + Yellow

- **Soft Signal** — end sim / end real talk fantasy immediately  
- **Yellow** — pause, no escalate  
- Reschedule is a **valid win** (not cowardice theater)

---

## Joke ledger (local)

- +1 Named a conflict without ghosting the notebook  
- +1 Chose pause/reschedule without self-hate spiral  
- +1 Soft Signal remembered as allowed  
- +1 Did not turn the sim into a prosecutor brief against partner  

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/CONFLICT_NAVIGATION_SIMULATOR.md` | Spec |
| `app/lib/conflictSimCore.ts` | Pure logic |
| `app/lib/conflictSimCore.test.ts` | Tests |
| `app/services/conflictSimStore.ts` | `litmo.conflict_sim.history.v1` |
| `app/app/conflict-sim/index.tsx` | UI |

---

**Last updated:** 2026-07-13
