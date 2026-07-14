# I'm Too Much / Fear of Abandonment Protocol v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because “too much” is a story the body tells when it is afraid of being left.**

**Route:** `/too-much`  
**UI metaphor:** Safe panic room — soft walls, Soft Signal always lit, no performance required.  
**Core:** `app/lib/tooMuchCore.ts`

---

## Purpose

Maximum autism on the loop:

- I am too much / too needy / too intense  
- If they see the real amount, they will leave  
- So I shrink, fawn, over-explain, or pre-abandon  

…so that spiral has a **panic room** that is less likely to dump raw onto **Renn**.

Not therapy. Not a diagnosis. Soft Signal is God Mode.

---

## Four layers

### 1. Detection triggers
Named situations that light up “too much / abandonment”:

- Delayed reply / cold text  
- After I asked for something  
- After I shared a lot  
- After conflict or Soft Signal  
- Morning exit / leaving bed  
- Quiet room (they’re fine, I’m spiraling)  
- Praise that feels like a trap  
- Custom  

Intensity: whisper → flooded.

### 2. Immediate containment (panic room)
Fail-closed enter:

1. Soft Signal acknowledged (always free)  
2. Body locater  
3. 60-second containment script (breathe / feet / name the story)  
4. Optional: open Soft Signal practice / panic cover  

### 3. Reassurance ritual
Optional after containment stabilizes:

- Scripted “not too much” lines  
- Care-seeker reframe  
- Link to Attachment Repair / Spooning Care-Seeker Little  
- Watch/presence haptic best-effort  

### 4. Long-term pattern tracking (local only)
History of trigger → intensity → move → debrief.

Summaries (never public scores):

- Most common triggers  
- Flooded rate  
- Soft Signal use rate  
- “Named story without dumping” count  

---

## Moves after containment

| Move | Meaning |
| ---- | ------- |
| stay_in_room | More containment time |
| reassurance | Run ritual lines |
| soft_signal | Exit everything |
| reach_small | One small honest ask (later, outside app) |
| alone_ok | I can be with this alone for now |

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/TOO_MUCH_ABANDONMENT.md` | Spec |
| `app/lib/tooMuchCore.ts` | Triggers, flow, patterns |
| `app/lib/tooMuchCore.test.ts` | Tests |
| `app/services/tooMuchStore.ts` | History |
| `app/app/too-much/index.tsx` | Panic-room UI |

---

**Last updated:** 2026-07-13
