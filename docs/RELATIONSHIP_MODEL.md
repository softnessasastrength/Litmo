# Relationship Model v0.1

**This is currently a personal emotional containment system, not a public product.**

> Living private map of a bond. **Not consent. Not a score. Not legal.** Soft Signal free.

**Route:** `/relationship-model`  
**Core:** `app/lib/relationshipModelCore.ts`  
**Store:** `litmo.relationship_model.v1`

---

## Containment job

Externalize “what is this relationship / how do we operate” so intimacy fear, conflict terror, and abandonment heat have a **structure** instead of only dumping onto **Renn**.

---

## What it models

| Dimension | Options / range |
| --------- | --------------- |
| **Phase** | forming · steady · repair_needed · paused · flood_protect · celebration |
| **Closeness style** | touch · parallel · words · mixed |
| **Attachment weather** | secure_enough · anxious_heat · avoidant_cool · dual_bind |
| **Axes 1–5** | capacity · conflict climate · closeness ease · Soft Signal culture |

Phase changes and axis updates append a local event log (last 100).

---

## Hard rules

1. Soft Signal freeness must be acknowledged to seal.  
2. `modelIsNotConsent = true` always.  
3. Axes are **bond climate**, never a partner grade or neediness score.  
4. Export is plain text, never auto-sent.  
5. Wipeable via local data wipe.

---

## Protocol suggestions

`recommendFromModel` maps phase + axes + weather → containment routes (flood, pre-renn, reconcile, need-scared, spooning, etc.) without surveillance.

### Wired consumers (v0.1.1)

| Surface | Behavior |
| ------- | -------- |
| **Hub** | Bond map banner + top 3 model recs |
| **Home** | Shortcut to Relationship Model |
| **Pre-Renn** | Delay primed from capacity/phase; verdict bias (extra reasons/hrefs; yellow floor if flood_protect) — Soft Signal freeness unchanged |
| **Weather** | “Apply sky → bond model” updates phase/capacity axes locally |
| **Flood** | Start → `flood_protect`; complete → toward `steady`/`paused` |
| **Aftercare** | Mode primed from bond phase |

Links well with:

- `/relationship-constitution` — living articles  
- `/weather` — daily personal sky  
- `/pre-renn` — before dump  

---

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/relationshipModelCore.ts` | Pure model |
| `app/lib/relationshipModelCore.test.ts` | Tests |
| `app/services/relationshipModelStore.ts` | Persist |
| `app/app/relationship-model/index.tsx` | UI |

---

**Last updated:** 2026-07-13
