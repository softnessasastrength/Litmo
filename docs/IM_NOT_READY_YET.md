# I'm Not Ready To Get Up Yet v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because the day is a court date and the bed is a sovereign nation.**

**Route:** `/not-ready-yet`  
**Also:** Morning Cuddle → “Not ready yet”  
**Date:** 2026-07-13  
**Core:** `app/lib/notReadyYetCore.ts`

---

## Purpose

Externalize the morning exit crisis:

- I need more hold / dark / silence  
- Leaving bed feels like abandonment of self  
- Guilt: “I’m lazy / needy / ruining their morning”  
- Fear: if I ask for 10 more minutes I’ll be rejected  

…so that spiral is less likely to dump raw onto **Renn** without a map.

Sister to [`MORNING_CUDDLE_PROTOCOL.md`](MORNING_CUDDLE_PROTOCOL.md). Soft Signal still God Mode.

---

## Containment job

Hold “I can’t start the day without one more unit of safety” long enough to:

1. Name why you’re not ready (body / anxiety / want hold / don’t want day / cold / other)  
2. Pick a **snooze unit** (2 / 5 / 10 / 15 / open)  
3. Seal a **graceful exit script** (what you’ll say when you do get up)  
4. Optional partner line (consent to use later — not auto-sent)  
5. Timer + Soft Signal + positive exit (“I really liked that” energy)  
6. Debrief without self-hate for needing more  

---

## Principles

1. **Not ready is information**, not a character flaw.  
2. **Snooze is negotiated**, not stolen.  
3. **Exit script is kindness to future-you** (and maybe partner).  
4. **Soft Signal free** mid-snooze — day can start ugly if body says so.  
5. **Interest RE optional** if “do I actually want to stay or am I avoiding?”  

---

## Flow

```text
Hub → Reason + snooze + exit script seal
  → Active snooze timer
       Soft Signal / “Ok I’m up” / extend once
  → Exit ritual prompt
  → Private debrief + joke ledger
```

---

## Joke ledger

- +1 Asked for more without full spiral  
- +1 Exited with script (not ghost-out of bed)  
- +1 Soft Signal free in mind  
- +1 No self-hate for needing hold  

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/IM_NOT_READY_YET.md` | Spec |
| `app/lib/notReadyYetCore.ts` | Pure logic |
| `app/lib/notReadyYetCore.test.ts` | Tests |
| `app/services/notReadyYetStore.ts` | History |
| `app/app/not-ready-yet/index.tsx` | UI |

---

**Last updated:** 2026-07-13
