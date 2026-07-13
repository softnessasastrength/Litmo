# Spooning Protocol v0.1

**This is currently a personal emotional containment system, not a public product.**

**Status:** legendary containment module · runnable at `/spooning`  
**Date:** 2026-07-13  
**Companion:** [`REAL_PURPOSE.md`](REAL_PURPOSE.md) · [`CONTAINMENT_SYSTEM.md`](CONTAINMENT_SYSTEM.md)

---

## Greentext (required reading)

```text
>be me
>deeply in love / also a disaster
>instead of asking "wanna spoon?" like a normal mammal
>open Litmo
>codify Spooning Constitution™ at 3am
>little spoon / big spoon / switch / parallel play
>position variants including Burrito and Safety Spoon
>duration + energy snapshot
>mid-spoon Soft Signal (because anxiety has a kill switch)
>post-spoon private debrief so my brain stops replaying the cuddle like a court transcript
>mfw my love language is infrastructure
>mfw this is funny AND useful to my nervous system
>tfw Option A is undefeated
```

---

## What this actually is

**Spooning Protocol** is not a product feature for the App Store.

It is:

1. A **hilarious over-engineered cuddle planner**  
2. A **real containment surface** for intimacy anxiety  
3. A **practice ground** for: role negotiation, time-boxing, Soft Signal mid-contact, and “we can stop without a TED talk”

Live job: *externalize “what if I mess up closeness” into a flow I can complete alone or use as a joke-and-checklist with a real human later — without dumping the raw spiral onto Renn first.*

---

## Invariants (non-negotiable)

1. **No spoon without an explicit seal** — roles + position + duration + energy chosen.  
2. **Soft Signal always free** — mid-spoon exit ends the spoon **now**. No reason required.  
3. **Prior cuddles are not consent** — history never auto-fills “yes.”  
4. **Private debrief is private** — device-local; not a public trust score; not proof of skill.  
5. **Comedy does not cancel care** — jokes allowed; coercion never.  
6. **This is practice / containment** — not certification that anyone is safe to touch.

---

## Roles (granular)

| Id | Label | Honest note |
| -- | ----- | ----------- |
| `little` | Little Spoon | Protected, held, spine-facing-out option of the soul |
| `big` | Big Spoon | The backpack. Responsibility theater + warmth |
| `switch` | Switch | We will renegotiate mid-spoon like adults with ADHD |
| `parallel` | Parallel Play Spoon | Same bed, same vibe, minimal interlocking (introvert mode) |
| `solo_practice` | Solo Practice | Me + pillow + protocol (valid, often optimal) |
| `undecided` | Not sealed | Fail-closed default |

---

## Positions (variants)

| Id | Label | Second-level detail |
| -- | ----- | ------------------- |
| `classic` | Classic | Lateral full-body alignment; arms optional; no assumptions about hand placement |
| `safety` | Safety Spoon | Extra space at torso; hand rests on safe zone only (back/shoulder/none) |
| `half_nest` | Half Nest | Upper-body contact; lower-body optional / soft-limit |
| `burrito` | Burrito | Blanket-dominant; skin contact minimized; still counts as intimacy for anxious brains |
| `back_to_back` | Back-to-Back | Parallel play physical form; presence without face-to-face intensity |
| `legs_only` | Legs-Only Entanglement | Low-stakes contact; high comedy factor |
| `custom` | Custom (named in notes) | Free text; still requires seal + Soft Signal path |

---

## Duration + energy (snapshot fields)

**Duration options (minutes):** 5 · 15 · 30 · 45 · 60 · open (open still Soft-Signalable)

**Energy levels:**

| Id | Label | Containment read |
| -- | ----- | ---------------- |
| `quiet` | Quiet / low verbal | Nervous system wants mute mode |
| `soft` | Soft talk ok | Small words allowed |
| `playful` | Playful | Banter on; still Soft Signal free |
| `heavy` | Heavy / sad-cuddle | Grief spoon; no fixing required |
| `unknown` | Not named | Fail-closed-ish: ok to seal only if user picks deliberately |

---

## Flow (app)

```text
Hub (comedy + honesty banner)
  → Role pick
  → Position pick
  → Duration + energy
  → Optional private anxiety note (device-local)
  → SEAL (local spoon snapshot)
  → Active spoon timer
       ↳ Soft Signal → immediate end → optional debrief
  → Natural end → private debrief
  → History (local only)
```

**Soft Signal mid-spoon:** ends active state, records `ended_by: soft_signal`, never requires explanation.

---

## Post-spoon debrief (private)

Optional fields (local):

- Comfort 1–5  
- “Would I want this shape again?” yes / maybe / no  
- Free note (max short)  
- Checkbox: *I did not owe a performance*  

Never exported as a skill score. Counts may appear in inventory; free text stays on device / wipe.

---

## Containment map row

| System | Containment job |
| ------ | --------------- |
| Spooning Protocol | Hold “what if closeness goes wrong / I freeze / I stay too long / I don’t know how to ask” in a runnable joke-spec |

See also: Soft Signal (exit), Consent Snapshot (seal grammar), Touch Language (body words).

---

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/spooningCore.ts` | Pure roles, positions, seal, timer, debrief |
| `app/services/spooningStore.ts` | AsyncStorage `litmo.spooning.history.v1` |
| `app/app/spooning/index.tsx` | Runnable UI |
| `app/lib/spooningCore.test.ts` | Invariants |

---

## What we are not claiming

- Not real-time partner sync (v0.1 is local / practice-first)  
- Not a substitute for saying words to a real human  
- Not sexual content protocol  
- Not medical advice  
- Not “I passed Spooning so I’m good at relationships”

---

## Future jokes (not committed)

- Spooning Amendment Process  
- Spoon DAO (no)  
- Watch “are you still ok?” haptic check-in  
- Conflict Navigation Simulator cross-link after a bad debrief  

---

**Last updated:** 2026-07-13

> This is currently a personal emotional containment system, not a public product.  
> Also: it is the dumbest and most perfect thing in the repo, on purpose.
