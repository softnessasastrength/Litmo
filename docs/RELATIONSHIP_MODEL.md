# Relationship Model v0.2

**This is currently a personal emotional containment system, not a public product.**

> Living private map of a bond. **Not consent. Not a score. Not legal.** Soft Signal free.

**Route:** `/relationship-model`  
**Core:** `app/lib/relationshipModelCore.ts`  
**Store:** `litmo.relationship_model.v1`  
**Shared chrome:** `app/components/BondMapBanner.tsx`

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
6. Soft Signal ends never force a “happy” phase rewrite unless explicitly designed (see table).

## Constitution link

`constitutionRef` (v0.2.1) optionally points at a Relationship Constitution
snapshot — `linkConstitution()` / `unlinkConstitution()` in
`relationshipModelCore.ts`. **Reference only:** it stores a display string
(`title (vN)`), never pulls articles into the bond map, never edits the
constitution, and unlinking is always available. Wired in the Relationship
Model screen under a dedicated "Constitution link" card.

---

## Wired consumers (complete map)

| Surface | Behavior |
| ------- | -------- |
| **Hub** | Bond map banner + top 3 model recs |
| **Home** | Shortcut |
| **Pre-Renn** | Delay primed; verdict bias from capacity/phase |
| **Weather** | Apply sky → phase/capacity |
| **Flood** | Start → `flood_protect`; complete → `steady`/`paused` |
| **Aftercare** | Mode primed from phase |
| **Too Much** | Banner; flooded finish + was `steady` → `flood_protect` |
| **Need-Scared** | Banner; high intensity finish + was `steady` → `flood_protect` |
| **Reconcile** | Banner; **completed** while `repair_needed` → `steady` (Soft Signal does not) |
| **Conflict sim** | Banner only — never forces phase |
| **Spooning / Morning / Not Ready** | Hub banner; touch-primary note |
| **Parallel Play** | `BondMapBanner` (shared component) |
| **Apology Craft** | `BondMapBanner` |
| **Field Notes** | `BondMapBanner` |
| **Interest RE** | `BondMapBanner` |
| **Attachment Repair Cathedral** | `BondMapBanner` |

---

## Perfect-path (human)

1. Seal Relationship Model once (`me + Renn` is fine).  
2. Log Weather → optionally apply sky to bond.  
3. Pre-Renn before heavy reach.  
4. Field Notes instead of raw dump.  
5. Flood when language is gone.  
6. Aftercare / Reconcile when landing or repairing.  

---

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/relationshipModelCore.ts` | Pure model + bias helpers |
| `app/lib/relationshipModelCore.test.ts` | Tests |
| `app/services/relationshipModelStore.ts` | Persist |
| `app/components/BondMapBanner.tsx` | Shared hub chrome |
| `app/app/relationship-model/index.tsx` | Editor UI |

---

**Last updated:** 2026-07-13 · v0.2 perfect inventory
