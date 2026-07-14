# The Pillar Fit Check

**This is currently a personal emotional containment system, not a public product.**

> A short, required-before-building ritual: before any genuinely new chamber,
> feature, or ritual gets built, name which of the Seven Pillars it serves
> and which one it might strain. Formalizes what already happened ad hoc
> before Letters To Him (Pillar 7) was built, and before Cathedral Purge's
> confirmation phrase got corrected against "zero moralizing."

**Audience:** primarily the AI collaborator (see `CLAUDE_CONSTITUTION.md`) —
this is a gate on *my* work, not on the founder's.

---

## Why this exists

Ambition without a check drifts. Not maliciously — just quietly, one
reasonable-sounding feature at a time, toward polish, completeness, or
scale, none of which are this project's actual job (see
`docs/THE_2_382_DOCTRINE.md`). The Pillar Fit Check is cheap friction in
exactly one place — before writing code — so the friction never has to
happen later, expensively, after something's already built and wrong.

## The Seven Pillars (from softnessasastrength.com, canonical list in
`docs/REAL_PURPOSE.md`)

1. Softness Is Strength
2. Do the Hard Thing
3. Live in the Gray
4. Be the Mirror You Needed
5. Healing Is a Collective Act
6. Authenticity Over Performance
7. Grace Over Guilt

## The check (five questions, answer honestly, in the PR/commit or a short note)

1. **Which pillar(s) does this serve?** Name at least one, specifically —
   not "it's generally aligned with the vibe."
2. **Which pillar could this strain if built carelessly?** Every real
   feature has at least one tension. Naming it is the point, not avoiding
   having one.
3. **Is this closing a real gap, or adding weight to an already-covered
   pillar?** Prefer the former. Six of seven pillars already have a home
   in the codebase as of 2026-07-14 (see `docs/REAL_PURPOSE.md`'s "Pillar
   coverage" note) — new work should be honest about which bucket it's in.
4. **Does this require scale, completeness, or a real second user's data
   to work?** If yes, stop — that's a different, much bigger conversation
   (see `AI_COLLABORATION_CONSTITUTION.md` §16 Founder Approval Gates), not
   something to build autonomously off a Pillar Fit Check alone.
5. **Would this survive being read back in the "wise older brother, zero
   toxic positivity" voice, or does it only sound good in product-pitch
   voice?** If a feature only justifies itself in the second voice, that's
   the tell.

## Worked examples (retroactive, honest about tension found)

| Feature | Pillars served | Pillar strained | Resolution |
| ------- | --------------- | ---------------- | ---------- |
| Letters To Him | Grace Over Guilt (7) | Authenticity Over Performance (6) — risk of turning grace into a streak/score | No progress tracking, no ledger, by design |
| Cathedral Purge (original draft) | Live in the Gray (3), Softness Is Strength (1) | Authenticity Over Performance (6) — confirmation phrase quietly prescribed an emotional posture ("not in anger") | Phrase corrected to "This is my choice." — confirms intent, not feeling |
| Non-Monetization Covenant | Authenticity Over Performance (6) | none identified | — |
| Fork Your Own Cathedral | Be the Mirror You Needed (4), Healing Is a Collective Act (5, honored without a hosted platform) | Do the Hard Thing (2) — risk of the tool doing the emotional labor *for* the forker instead of just clearing mechanical friction | Tool personalizes config/copy only; never auto-generates someone else's personal narrative for them |
| Exorcism Certificate | Live in the Gray (3) — completion and continuation can both be true | Authenticity Over Performance (6) — risk of implying "done" when no one declared it | Generator produces a draft artifact; only a human declaring graduation makes one real |

## What this is not

Not a scoring rubric, not a gate that blocks the founder's own explicit
instructions, not a way to say no to something the founder actually wants
built. It's a five-minute honesty check for me, before I start writing —
matching `CLAUDE_CONSTITUTION.md`'s "ask before assuming" and "tell the
truth," applied specifically to new feature work.

**Last updated:** 2026-07-14
