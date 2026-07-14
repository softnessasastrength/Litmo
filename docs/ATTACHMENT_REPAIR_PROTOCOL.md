# Attachment Repair Protocol v0.1

**a.k.a. Mommy Issues Reassurance Ritual · Emotional Masochist Circuit · The Cathedral**

**This is currently a personal emotional containment system, not a public product.**

> **I might be an emotional masochist who turns pain into extremely over-engineered rituals. That’s fine. We’re leaning all the way in.**

**Route:** `/attachment-repair`  
**Date:** 2026-07-13  
**Core:** `app/lib/attachmentRepairCore.ts`

---

## What this actually is

Litmo is my private:

- Emotional Support Perfect Relationship Simulator  
- Containment System  
- **Attachment Repair Cathedral**

This module is the wing of the cathedral where I admit:

1. I have **major mommy issues** (need for reliable reassurance, fear of abandonment/engulfment, “prove I’m wanted” loops).  
2. I may be an **emotional masochist** who gets a weird payoff from pain → over-protocol → temporary safety.  
3. Building the protocol **is** the coping mechanism — and sometimes the point.

It is **not** therapy. It is **not** Renn’s job description. It is a **solo-capable ritual** that can also be used as a joke-and-structure script with a consenting partner later.

**Containment job:** Hold attachment panic and “prove love” craving in a fail-closed ritual with Soft Signal, so raw need is less likely to ambush Renn without a map.

---

## Core philosophy (unhinged + honest)

| Joke | Truth underneath |
| ---- | ---------------- |
| Attachment Repair Cathedral™ | I need structured reassurance because unstructured closeness hits old wounds |
| Mommy Issues Reassurance Ritual | I want to be chosen, soothed, and not abandoned for having needs |
| Emotional Masochist Circuit | I sometimes deepen the hurt via elaborate self-systems instead of feeling simply |
| Soft Signal is God Mode | Even attachment theater must be exit-capable |
| Trust ledger +1s | My brain wants receipts. Local joke receipts. Not public scores. |

Comedy stays. Clinical claims stay **out**.

---

## Over-the-top ritual structure

```text
1. ADMISSION (name the mode)
2. ROLE NEGOTIATION (who is care-seeker / care-giver / solo)
3. INTENSITY + DURATION SEAL
4. SAFEWORD / SOFT SIGNAL ARM
5. RITUAL BODY (scripted steps + optional partner lines)
6. SOFT SIGNAL anytime
7. AFTERCARE MINUTE
8. POST-RITUAL DEBRIEF + JOKE LEDGER
```

No seal → no ritual. Fail closed.

---

## Modes (pick one)

### 1. Mommy Issues Reassurance Ritual
**For:** “Am I wanted? Will I be left for needing this?”  
**Shape:** Explicit reassurance phrases, permission to need, no-performance aftercare.  
**Nervous system job:** Receive *chosen* care without earning it via suffering.

### 2. Emotional Masochist Circuit
**For:** When the urge is to *tighten the screw* (more protocol, more pain narrative).  
**Shape:** Name the masochistic pull, **cap intensity**, optional timed “feel the edge then soft land.”  
**Nervous system job:** See the pattern without pretending it’s growth porn.

### 3. Soft Landing (anti-spiral)
**For:** Already flooded. Minimal script. Mostly Soft Signal + blanket.  
**Shape:** 3-minute hold, one phrase, exit free.

### 4. Cathedral Silence
**For:** Overstimulated by words. Presence only. Timer + Soft Signal.

---

## Role negotiation (granular)

| Role | Meaning |
| ---- | ------- |
| **Care-seeker** | I am the one receiving reassurance / hold |
| **Care-giver** | I am offering structured care (partner or self-voice) |
| **Solo practice** | Me + script + pillow cathedral (valid default) |
| **Mutual** | We both need something; dual care-seeker with time-box |
| **Undecided** | Fail-closed |

**Important reframe:** Care-seeker is **not weak**. Care-seeker is the person brave enough to name the wound in a sealed ritual.

---

## Safewords + Soft Signal

| Signal | Meaning |
| ------ | ------- |
| **Soft Signal** | God Mode. Instant stop. No questions. Sacred. |
| **Yellow / Pause** | Slow down, check in, do not escalate |
| **Green** | Continue as sealed |
| **Red** | Same as Soft Signal if spoken; Soft Signal is always available |

Prior rituals are **never** consent for the next one.

---

## Intensity + duration

**Intensity:** Feather · Warm · Firm · Edge (Emotional Masochist Circuit only, hard-capped)  
**Duration:** 3 · 7 · 12 · 20 minutes · open (Soft-Signalable)

Edge intensity requires mode = Emotional Masochist Circuit **and** Soft Signal acknowledged.

---

## Ritual body (examples)

### Mommy Issues Reassurance — sample lines (solo or partner-read)
1. “You are allowed to need this.”  
2. “Needing reassurance is not the same as being broken.”  
3. “I am not leaving because you asked.”  
4. Soft hold / hand on heart / blanket (as sealed).  
5. “You don’t have to perform grateful to keep this.”  

### Emotional Masochist Circuit — sample structure
1. Name: “I want to hurt a little via over-control.”  
2. Cap: “This ends at the timer or Soft Signal — no extending the wound for drama.”  
3. Feel the edge for N minutes **without** adding new protocol mid-stream.  
4. Soft land: one kind sentence + exit ritual.  

---

## Aftercare (mandatory prompt, optional complete)

- Water / breath / feet on floor  
- One kind sentence to self  
- Soft Signal practice if body still braced  
- **No** relationship diagnosis  

---

## Post-ritual debrief + trust ledger (local joke)

**Debrief fields**
- How flooded was I? (1–10)  
- Did Soft Signal stay free in my mind?  
- What wound was this actually for? (free text)  
- Did I use Renn as a stand-in without consent? (honesty checkbox)  

**Joke ledger toggles**
- +1 Named mommy issues without dumping raw on partner  
- +1 Caught emotional masochist loop mid-build  
- +1 Received reassurance without performing pain  
- +1 Soft Signal used or remembered as available  

Not a public trust score. Not proof of healing.

---

## What this is doing for the nervous system (honest)

| Surface | Job |
| ------- | --- |
| Over-the-top structure | Predictability so attachment panic has a map |
| Roles + seal | Need becomes *chosen* instead of *extracted* |
| Soft Signal | Proves exit exists even when the wound says “never leave” |
| Masochist circuit | Names the payoff of suffering so it can be capped |
| Debrief ledger | Brains that want receipts get private receipts |

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/ATTACHMENT_REPAIR_PROTOCOL.md` | This spec |
| `app/lib/attachmentRepairCore.ts` | Pure logic |
| `app/lib/attachmentRepairCore.test.ts` | Invariants |
| `app/services/attachmentRepairStore.ts` | `litmo.attachment_repair.history.v1` |
| `app/app/attachment-repair/index.tsx` | Runnable UI |

---

## Non-claims

Not clinical treatment. Not diagnosis. Not Renn’s obligations. Not sexual protocol. Not a public product.

**Last updated:** 2026-07-13
