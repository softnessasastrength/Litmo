# Interest Reverse Engineering v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Because “I want to” and “I should want to” both say “sure” with the same mouth.**

**Route:** `/interest-re`  
**Date:** 2026-07-13  
**Core:** `app/lib/interestReCore.ts`

---

## Purpose

Externalize the spiral:

- Do I actually want this closeness / sex-adjacent energy / plan / conversation?  
- Or am I **performing interest** so I won’t be abandoned / inconvenient / cold?  
- Or am I **fawning** and calling it desire?

…so that mess is less likely to dump raw onto **Renn** without a map.

Comedy gold. Weirdly useful. **Not** a mind-reader. **Not** consent. **Not** therapy.

---

## Containment job

Hold “I can’t tell if my yes is real” long enough to:

1. Name the target (what am I reverse-engineering?)  
2. Sort signals: body / mind / should / fear  
3. Score honesty without grading the soul  
4. Pick a move: real yes · soft no · pause · Soft Signal  
5. Debrief without turning into a prosecutor against self or partner  

---

## Core principles

1. **Interest is not consent** — and reverse-engineering interest is not a Consent Snapshot.  
2. **Soft Signal is God Mode** — stop the sim anytime.  
3. **“Should” is evidence, not proof of desire.**  
4. **Ambiguity is allowed** — “I don’t know yet” is a valid outcome.  
5. **Performance detection is self-facing** — not a weapon to use on Renn mid-fight.  

---

## Flow (fail-closed)

```text
1. Seal: name the target + Soft Signal ack
2. Signal inventory (body / mind / should / fear checkboxes + notes)
3. Honesty read (pure function → label + advice)
4. Choose move
5. Private debrief + joke ledger
```

---

## Honesty labels (engine output)

| Label | Meaning |
| ----- | ------- |
| `clear_yes` | Body + mind align; low “should/fear only” |
| `clear_no` | Strong no signals; don’t force a yes |
| `performing` | High should/fear, thin body/mind |
| `flooded_unknown` | Too much activation to know — Soft Signal / pause |
| `mixed` | Real conflict of parts — time-box, not pressure |

---

## Joke ledger (local)

- +1 Named “should” vs want  
- +1 Allowed “I don’t know yet”  
- +1 Soft Signal free in mind  
- +1 Did not use this as a gotcha against partner  

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/INTEREST_REVERSE_ENGINEERING.md` | Spec |
| `app/lib/interestReCore.ts` | Pure scoring |
| `app/lib/interestReCore.test.ts` | Tests |
| `app/services/interestReStore.ts` | History |
| `app/app/interest-re/index.tsx` | UI |

---

**Last updated:** 2026-07-13
