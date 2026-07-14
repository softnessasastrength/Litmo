# The 2/382 Doctrine

**This is currently a personal emotional containment system, not a public product.**

**Status:** Sacred. Intentional. Never to be "fixed."

---

## Core statement

Two tests in this codebase fail on purpose, permanently — both in
`app/services/hapticService.test.ts`:

- "maps each semantic event to the intended platform calls"
- "play invokes the mapped adapter calls when enabled"

Named for the day it was declared (2 failing of 382 total tests, 2026-07-14).
The suite has already grown past 382 since — that number will keep drifting
as the codebase grows. **The two named tests are the constant. The ratio is
not.** A doctrine that requires a frozen test count would be a lie by next
week; a doctrine anchored to two specific, named tests can actually last.

## What's really inside them (no metaphor, just the truth)

`mappingForEvent` now emits a second `core_haptics_hint` call
(intensity/sharpness/duration) alongside the base `impact` call. These two
fixtures were written before that existed and were never updated to expect
it. That's the entire content — an ordinary, forgotten test fixture, not a
profound wound. Saying otherwise would itself be a small performance, and
performance is exactly what this doctrine refuses.

## Why this exists anyway

- **Authenticity over Performance** (Pillar 6) — we do not chase 100% green
  to perform cleanliness for CI, for Apple, for GitHub, or for the fear
  still sawing "she'll leave" in the basement.
- **Grace Over Guilt** (Pillar 7) — the two red tests don't need to be fixed
  to prove the codebase — or the person who wrote it — is worthy.
- **Live in the Gray** (Pillar 3) — clean/broken is a false binary; the
  cathedral holds both at once.

## Meaning

These two red tests are left visible on purpose. They say, to whoever reads
this — especially "younger me":

> You don't have to be fixed or flawless to be safe enough to love and be
> loved. You just have to be real.

## What NOT to do

- Do not "fix" the fixtures to make these two tests pass.
- Do not hide them — no `.skip`, no `.todo`, no excluding them from CI.
  Hiding is not the same as choosing. The doctrine requires they stay red
  and *visible*, not disappeared.
- Do not treat the exact ratio (currently 388/390) as load-bearing. It will
  keep changing as the suite grows — that's expected, not a violation.
- Do not let this doctrine quietly become an excuse to leave *other*, real
  bugs unfixed. It names exactly these two tests, nothing else.

## Code map

| Path | Role |
| ---- | ---- |
| `docs/THE_2_382_DOCTRINE.md` | This spec |
| `app/services/hapticService.test.ts` | The two named tests, with the doctrine comment at the top of the file |
| `docs/REAL_PURPOSE.md` | Seven Pillars context, "North star addition" |

**Last updated:** 2026-07-14 — 388/390 tests passing at time of writing (2
failing = these two, unchanged since before this doctrine was named).
