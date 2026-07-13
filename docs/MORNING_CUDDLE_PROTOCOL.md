# Morning Cuddle Protocol v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because nothing says “I love you” like a formalized negotiation before coffee.**

**Route:** `/morning-cuddle`  
**Date:** 2026-07-13  
**Core:** `app/lib/morningCuddleCore.ts`

---

## Core philosophy

Morning cuddles are **high-risk, high-reward**.

One person is usually a functional human. The other is a **half-dead gremlin** who wants to be held and also needs to pee in ~8 minutes.

This protocol exists so the brain does not spiral into:

> am I being too needy / are they annoyed / is this ruining the relationship  

…at **7:42am**.

Comedy gold. Secretly emotional support infrastructure. Both true.

---

## Pre-cuddle negotiation (30 seconds max)

### Energy

| Id | Label | Meaning |
| -- | ----- | ------- |
| `crispy` | Crispy | Fully awake, wants to be productive |
| `toasty` | Toasty | Warm, cozy, melt mode |
| `gremlin` | Gremlin | Barely conscious, maximum containment |
| `exit_protocol` | Exit Protocol | One or both needs to get up **now** — no cuddle start |

### Duration

| Id | Window |
| -- | ------ |
| `micro` | 2–5 min (timer ~4) |
| `standard` | 8–15 min (timer ~12) |
| `extended` | 20+ (timer ~25, fall-back-asleep hazard) |

### Style

- Gentle Hold  
- Full Burrito  
- Back Scritches (service animal mode)  
- Big Spoon Safety  
- Starfish Adjacent  
- **Jetpack Mode** (bonus ridiculous)  
- **Koala Cling** (bonus ridiculous)  

### Morning zones

| Zone | Policies |
| ---- | -------- |
| Hair | Yes / Only if washed yesterday / No |
| Stomach | Yes / Negotiable / No (danger zone) |
| Legs | Default yes / Restless legs no |
| Face-to-face | No (default) / Explicit yes only |

---

## During

- **Soft Signal** sacred → instant release + “no worries, love you” framing  
- Optional **Good Morning Haptic** (`presence`) on seal start  
- One silly check-in: “Still alive in there?” or “You good, gremlin?”  
- **Gremlin pee banner** at ~8 minutes  

---

## Exit protocol (critical)

1. Graceful disengage (timer or button)  
2. **Exit ritual prompt:** forehead kiss + “I really liked that” (mandatory *for this brain* — positive reinforcement)  
3. Private debrief: safety feel 1–10 + joke ledger toggles  

### Trust ledger (local joke, not public score)

- +1 Successfully received morning affection without spiraling  
- +1 Managed to not feel guilty about wanting closeness  

---

## Containment job

Hold morning-specific **neediness / guilt / annoyance spiral** so it is less likely to dump onto Renn before coffee.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/MORNING_CUDDLE_PROTOCOL.md` | Spec |
| `app/lib/morningCuddleCore.ts` | Pure logic |
| `app/lib/morningCuddleCore.test.ts` | Tests |
| `app/services/morningCuddleStore.ts` | `litmo.morning_cuddle.history.v1` |
| `app/app/morning-cuddle/index.tsx` | UI |

Sister protocol: [`SPOONING_PROTOCOL.md`](SPOONING_PROTOCOL.md) (anytime edition).

---

## Future

- “I'm Not Ready To Get Up Yet” sub-protocol  
- Watch rising-wave Good Morning Haptic (native)  

**Last updated:** 2026-07-13
