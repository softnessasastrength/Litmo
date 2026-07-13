# Spooning Protocol v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because apparently I can’t just fucking cuddle like a normal person.**

**Route:** `/spooning`  
**Date:** 2026-07-13  
**Core:** `app/lib/spooningCore.ts` (v2 fields)

---

## Purpose

Externalize anxiety around **physical intimacy and closeness** so it is less likely to dump onto **Renn**.

Turn the terrifying act of “just lying next to someone” into a hilarious, over-engineered ritual that somehow makes a nervous system feel safer.

---

## Core principles

1. **All spooning is opt-in, revocable, and snapshot-based**  
2. **Soft Signal is God Mode** — instant disengage, no questions  
3. **Little Spoon is a position of strength, not weakness** (important for this brain)  
4. **Post-spoon debrief is “mandatory for data collection” (lol)** — skip still allowed; Soft Signal freeness extends to paperwork  
5. Prior cuddles are **never** consent  
6. Local “+1 non-traumatic closeness” is a **joke ledger**, not a public trust score  

---

## Role negotiation (funny cards)

| Role | Mode |
| ---- | ---- |
| **Little Spoon** | Protected / cherished — **strength** |
| **Big Spoon** | Protective / grounding |
| **Switch** | Chaotic neutral |
| **Parallel Play** | Touch-adjacent, no full entanglement |
| **Burrito Mode** | Fully wrapped, maximum containment (valid primary role) |
| **Solo Practice** | You + pillow + protocol |

---

## Consent Snapshot (local seal)

Must name before start:

| Field | Options |
| ----- | ------- |
| **Duration** | 5 min · 15 min · 45 min · **until one of us gets hot or has to pee** |
| **Pressure** | Feather · Gentle · Firm · **“I want to feel like I’m being held together”** |
| **Allowed zones** | Back, waist, hair, arm, shoulder, hand/wrist; hard notes: nowhere near stomach, no face unless re-asked |
| **Energy** | Cozy silence · soft talk · occasional forehead kiss · playful · heavy/sad-cuddle |

**Half-Nelson of Love** requires chest-adjacent zone consent (back or shoulder).

---

## Position variants (stupid names)

| Name | Detail |
| ---- | ------ |
| **Classic** | Default |
| **Safety Spoon** | Big spoon arm under pillow; little can hold wrist — **escape route built in** |
| **Burrito** | Blanket + human wrap |
| **Half-Nelson of Love** | Arm across chest — **explicit consent only** |
| **Cthulhu** | All limbs entangled, maximum chaos |
| **Distance Spoon** | Back-to-back with pinky contact (overstimulated days) |

---

## Mid-session tools

| Tool | Behavior |
| ---- | -------- |
| **Soft Signal** | God Mode — ends spoon immediately (practice Soft Signal path) |
| **Check-in** | Gentle `presence` haptic + on-screen **“you good?”** — does **not** end spoon |
| **5 min warning** | On 15/45 timed spoons — extend, Soft Signal, or graceful exit |
| **Hot/pee exit** | Sacred duration clause as an end reason |

---

## Post-spoon debrief (private)

- How did that feel in your body? (1–5 + notes)  
- What worked / didn’t work?  
- Toggle: **+1 “successful non-traumatic closeness”** (local joke ledger)  
- Toggle: I did not owe a performance  
- Skip paperwork still allowed  

---

## Containment job

Hold *“what if I mess up closeness / freeze / stay too long / don’t know how to ask”* in a runnable joke-spec so raw spiral is less likely to hit Renn first.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/SPOONING_PROTOCOL.md` | This spec |
| `app/lib/spooningCore.ts` | Pure logic |
| `app/lib/spooningCore.test.ts` | Invariants |
| `app/services/spooningStore.ts` | `litmo.spooning.history.v1` |
| `app/app/spooning/index.tsx` | Runnable UI |

---

## What we are not claiming

Not multi-party real-time sync. Not sexual protocol. Not therapy. Not proof of relationship skill. Not a public product.

**Last updated:** 2026-07-13
