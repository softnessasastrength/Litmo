# Letters To Him — Grace Over Guilt v0.1

**This is currently a personal emotional containment system, not a public product.**

> Not a ritual. Not a sequence. A single, quiet screen for the one thing
> `docs/FIRST_RITUAL.md` and `docs/SECOND_RITUAL.md` deliberately don't touch:
> forgiving who you used to be. Rare-use, self-directed, over when you say it's
> over.

**Route:** `/letters-to-him`
**Core:** `app/lib/lettersToHimCore.ts`
**Store:** `litmo.letters_to_him.v1` via `app/services/lettersToHimStore.ts`
**Screen:** `app/app/letters-to-him/index.tsx`

---

## Containment job

`docs/REAL_PURPOSE.md`'s "North star addition" names the Seven Pillars from
softnessasastrength.com as the value layer for the younger-me work. Six of
them already have a home somewhere in this codebase. Pillar 7 — **Grace Over
Guilt: honor who you were, forgive him, don't drag his guilt into tomorrow**
— didn't. This chamber closes that gap, and only that gap. It does not teach
anything, it does not track a pattern, it does not ask you to relive
anything you don't choose to write down. You open it, you say the one true
sentence, you close it.

## What it asks

There is no step sequence here on purpose — see Hard Rules below. One
screen, four fields, three optional:

| Field | What it asks | Required? |
| ----- | ------------- | --------- |
| **The regret** | Name an old regret — as much or as little detail as you want | No |
| **What he didn't know yet** | What younger-you genuinely didn't know yet that you know now | No |
| **The sentence of grace** | One sentence of grace, addressed to him | **Yes — the only required field** |
| **Released** | Mark a past letter as let go | No — one-way toggle, not a debrief |

That's the whole feature. Writing the sentence of grace is the entire
containment job; the other three fields exist only to give it somewhere to
land.

## Hard rules

1. Not consent. Not a diagnosis. Not therapy.
2. Never a gate — nothing else in Litmo checks whether a letter exists, was
   released, or how many there are. Reachable and skippable at all times.
3. **No step sequence, no completion tracking, no streaks, no "+1" ledger, no
   scoring — and this is intentional, not an oversight.** Every other
   protocol in this codebase (`docs/FIRST_RITUAL.md`, `docs/SECOND_RITUAL.md`,
   the joke trust ledgers named in `docs/THE_2_382_DOCTRINE.md`'s neighbor
   entries) leans into over-engineering a feeling into a protocol — that's
   `docs/REAL_PURPOSE.md`'s named "chaotic honesty," and it's fine for
   everything else. It is not fine here. Turning grace into something with
   steps to complete, streaks to keep, or a lesson to extract for credit
   would just be the **Emotional Masochist Circuit** (`attachmentRepairCore.ts`,
   mode `emotional_masochist`) wearing a Pillar-7 costume — more protocol as
   the payoff for pain, exactly the pattern that mode exists to name and cap.
   Pillar 7 is the one chamber this project does not get to make into
   homework, even by its own unhinged standards.
4. "Released" is a one-way toggle on a past letter, not a debrief, not a
   review, not a second draft — releasing a letter asks nothing more of you
   than the toggle itself.
5. Wipeable via local data wipe.
6. Never names a real person — if the screen needs a closing line at all, it
   is genericized via the copy-pack the same way `firstReassuranceClosing`
   (`docs/FIRST_RITUAL.md`) and the shared reassurance lines in
   `docs/SECOND_RITUAL.md` are (`modeCopy.partnerName`), never a literal name.

## Relationship to phase-2 content

This is core v1 (App Store Safe), reachable directly, same tier as
`docs/FIRST_RITUAL.md`, `/too-much`, and `/attachment-repair`: it is solo and
about the person's own past, not an existing relationship in friction, so it
is **not** gated behind `pairedGrowthContent` — contrast with
`docs/SECOND_RITUAL.md`, which is explicitly Maximum-Mode-only because it
presupposes a real partner. Letters To Him presupposes nothing but a past.

## Code map

| Path | Role |
| ---- | ---- |
| `docs/LETTERS_TO_HIM.md` | This spec |
| `app/lib/lettersToHimCore.ts` | Pure letter shape + validation (grace sentence required, everything else optional) + release toggle logic |
| `app/lib/lettersToHimCore.test.ts` | Invariants (never a gate, no scoring surface, defensive parse) |
| `app/services/lettersToHimStore.ts` | Persist (`litmo.letters_to_him.v1`) |
| `app/app/letters-to-him/index.tsx` | Runnable UI — a single-screen form, not a stepper |

## Non-claims

Not clinical treatment. Not diagnosis. Not a completion metric, a streak, or
a ledger — deliberately none exists. Not proof you've "processed" anything.
Not a public product — see `docs/REAL_PURPOSE.md`.

**Last updated:** 2026-07-14
