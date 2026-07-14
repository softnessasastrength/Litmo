# Post-Fight Reconciliation Simulator v0.2

**This is currently a personal emotional containment system, not a public product.**

> Practice repair so prosecutor-brain has a map. Soft Signal free. Not a real partner negotiation seal.

**Route:** `/reconcile`  
**Core:** `app/lib/reconcileCore.ts`  
**Store:** `app/services/reconcileStore.ts`  
**Auto-debrief:** `privateDebriefStore` source `reconcile`

---

## Purpose

Hold **terror of conflict** + **shame of never navigating repair** by rehearsing five archetypes offline before they dump raw onto Renn.

Soft Signal is God Mode. Completing a sim is practice. Soft Signalling out of a sim is a **valid win**.

---

## Five repair archetypes

| Id | Label | When to use | Anti-pattern |
| -- | ----- | ----------- | ------------ |
| `accountable_repair` | Accountable Repair | You can name your slice; other is regulated enough | Self-annihilation confession booth / trial |
| `soft_return` | Soft Return | Re-enter after freeze without postmortem tax | Free pass forever / demand nothing happened |
| `structured_pause` | Structured Pause | Flooded; cruel words rising | Silent discard disguised as pause |
| `body_first` | Body-First Repair | Words make it worse; bodies flooded | Assumed touch / forced proximity |
| `comic_relief` | Comic Relief Repair | Humor welcome; absurdity safer than escalation | Mocking pain / sarcasm as knife |

Each archetype has:

- Base **steps** (safety + repair sequence)
- **denserSteps** (ceremony) when Emotional Masochist Mode denser scripts is on
- **sampleLine** for live use outside the app (never auto-sent)

---

## Flow

1. Pick archetype  
2. Short fight note (messy allowed)  
3. Soft Signal free ack  
4. Seal → step through script  
5. Soft Signal or complete → history + private debrief  

Fail-closed: no seal without Soft Signal ack + archetype + note.

---

## Emotional Masochist Mode

When denser scripts are on, `resolveReconcileSteps` interleaves base + denser ceremony steps. Soft Signal freeness is **never** reduced.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/POST_FIGHT_RECONCILIATION.md` | Spec |
| `app/lib/reconcileCore.ts` | Pure logic |
| `app/lib/batchProtocols.test.ts` | Tests |
| `app/services/reconcileStore.ts` | History (AsyncStorage) |
| `app/app/reconcile/index.tsx` | UI |

---

**Last updated:** 2026-07-13
