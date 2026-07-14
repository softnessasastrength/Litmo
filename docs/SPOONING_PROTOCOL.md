# Spooning Protocol v0.2

**This is currently a personal emotional containment system, not a public product.**

> **Because apparently I can’t just fucking cuddle like a normal person.**

**Route:** `/spooning`  
**Version:** 0.2 · nuclear autistic precision  
**Core:** `app/lib/spooningCore.ts` · haptics: `app/services/spooningHaptics.ts`

---

## Purpose

Externalize intimacy anxiety + “am I allowed to need hold?” (mommy-issues-adjacent) into a fail-closed, hilarious, Watch-aware ritual so raw need is less likely to dump onto **Renn**.

Comedy gold. Actually functional for a nervous system that freezes without a map.

---

## Negotiate flow (5 steps)

1. **Role** — Little / Care-Seeker Little / Big / Switch / Parallel / Burrito / Solo  
2. **Position** — 14 shapes (see below)  
3. **Body rules** — duration · pressure · energy · zones  
4. **Reassurance + Watch** — mommy-issues contract · check-in phrase · Watch haptics  
5. **Seal** → active timer  

Soft Signal = God Mode entire time.

---

## Positions (14)

| Id | Label | Nervous-system job |
| -- | ----- | ------------------ |
| classic | Classic | Baseline co-presence |
| safety | Safety Spoon | Hold + escape wrist |
| safety_burrito | Safety Burrito | Max containment + exit |
| burrito | Burrito | Nest / reduce surface |
| half_nelson_love | Half-Nelson of Love | Deep pressure (consent) |
| cthulhu | Cthulhu | Full contact “enough” |
| distance | Distance Spoon | Connection without flood |
| jetpack | Jetpack Mode | Cling with agency |
| koala_death_grip | Koala Death Grip | Ventral “I’m still here” |
| starfish_adjacent | Starfish Adjacent | Lowest-demand closeness |
| lap_nest | Lap Nest | Care-seeker geometry |
| backpack_of_love | Backpack of Love | Being carried in bed |
| fortress_of_solitude | Fortress of Solitude | Solo-adjacent co-reg |
| custom | Custom Chaos | Name it |

Chest-adjacent positions require back / shoulder / chest-over-clothes zone.

---

## Mommy issues reassurance

Toggle on step 4 (auto-hinted for Little / Care-Seeker Little).

- Energy: **Reassurance needed**  
- Mid-spoon: scripted lines (“You are allowed to need this…”)  
- Check-in flash: **you are still wanted**  
- Debrief ledger: received hold without performing pain · named need for hold  
- Cross-link: Attachment Repair Cathedral  

---

## Mid-spoon tools

| Tool | Behavior |
| ---- | -------- |
| Soft Signal | God Mode + Watch `watch_soft_signal` best-effort |
| Check-in | Phone presence haptic + Watch `watch_check_in` / heartbeat |
| 5 min warning | Attention + Watch gentle tap |
| Reassurance line | Cycles MOMMY_ISSUES lines + confirmation haptic |
| Hot/pee exit | Sacred duration clause |

Watch unpaired → simulated delivery (honest note in UI). Soft Signal never waits on Watch.

---

## Post-spoon debrief

Body feel 1–5 · worked / didn’t · joke ledgers · optional skip.

---

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/spooningCore.ts` | Pure v0.2 |
| `app/lib/spooningCore.test.ts` | Invariants |
| `app/services/spooningStore.ts` | History |
| `app/services/spooningHaptics.ts` | Phone + Watch bridge |
| `app/app/spooning/index.tsx` | Full UI |

---

**Last updated:** 2026-07-13
