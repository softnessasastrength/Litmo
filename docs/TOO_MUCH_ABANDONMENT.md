# I'm Too Much / Fear of Abandonment Protocol v0.2

**This is currently a personal emotional containment system, not a public product.**

> **Because “too much” is a story the body tells when it is afraid of being left.**

**Route:** `/too-much`  
**UI metaphor:** Safe panic room — door seal, soft walls, Soft Signal always lit.  
**Core:** `app/lib/tooMuchCore.ts` (v0.2)

---

## Maximum autism layers

### 1. Detection triggers (13 + custom)

Each has label, detect sentence, and **system** (what circuit is firing):

delayed reply · after I asked · after I shared · after conflict · after Soft Signal · morning exit · quiet room · praise trap · they seem fine · I took space · plan change · preemptive exit · comparison spiral · custom

**Co-triggers:** up to 4 secondary.

**Intensity → track:** whisper/activated/high → **standard** containment; flooded → **flood** track.

### 2. Immediate containment

**Standard track (10 steps):** door seal, orient, gravity, name detector, detector≠verdict, breath, deep pressure, no fix required, optional phone face-down, exit choices.

**Flood track (6 steps):** minimal cognition, body first, Soft Signal freeness.

Voluntary **delay raw dump** pledge at seal (not a law — a containment tool).

### 3. Reassurance ritual

Adaptive lines (full set vs flood set). Links to Attachment Repair.

### 4. Long-term pattern tracking (private)

- 7d / 30d volume  
- Flooded rate · Soft Signal rate · named story · no-dump  
- Top triggers  
- Named-without-dump **streak**  
- **Recommended next protocol** (cathedral / interest RE / conflict / spooning / soft signal)

Never a neediness score. Never discovery-visible.

---

## UI (panic room)

- Dark lobby / room frame  
- **DOOR SEALED** banner when active  
- Soft Signal dock always labeled lit  
- Progress bar on containment steps  
- Soft cream “inner walls”

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/TOO_MUCH_ABANDONMENT.md` | Spec |
| `app/lib/tooMuchCore.ts` | Pure v0.2 |
| `app/lib/tooMuchCore.test.ts` | Tests |
| `app/services/tooMuchStore.ts` | History |
| `app/app/too-much/index.tsx` | Panic-room UI |

---

**Last updated:** 2026-07-13
