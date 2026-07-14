# The Map, Not The Mirror — First Guided Ritual v0.1

**This is currently a personal emotional containment system, not a public product.**

> A compassionate, step-by-step companion for "younger me" — someone convinced
> they're too much, scared of ruining a good thing, with no map for how to
> show up safely. Not a diagnosis. Not therapy. Armor, not homework.

**Route:** `/first-ritual`
**Core:** `app/lib/firstRitualCore.ts`
**Store:** `litmo.first_ritual.progress.v1`
**Screen:** `app/app/first-ritual/index.tsx`

---

## Containment job

Give someone new to Litmo a first, small, real experience of "I can come back
to myself" — before they've done any therapy, before there's a partner in the
picture, before anything is "fixed." Reuses existing containment building
blocks with new sequencing and voice; does not duplicate their logic.

## Voice

Wise, slightly unhinged older brother who's been through the exact same shit —
not a therapist. No toxic positivity. No clinical language. Every step should
feel like armor, not homework.

## The four steps

| Step | What it asks | What it reuses |
| ---- | ------------- | --------------- |
| **Name it** | Pick the closest "story your body tells" about being too much — optional, no diagnosis | `tooMuchCore.TOO_MUCH_TRIGGERS` |
| **Locate it, not fix it** | A day-one nervous-system check-in, reframed away from "test" | Links to `/weather` (`weatherCore`) |
| **The armor, not the homework** | One Soft Signal practice rep — feel the stop before you ever need it for real | `softSignalService.practice()` / `SoftSignalButton` |
| **First reassurance** | A short, generic cut of reassurance lines | `tooMuchCore.REASSURANCE_LINES` |

## Hard rules

1. Not consent. Not a diagnosis. Not therapy.
2. Steps are never a gate — any order, any pace, freely skippable and re-enterable.
3. Soft Signal is reachable throughout; practicing it is never required to continue.
4. Completion implies nothing about being "fixed," "healed," or ready for a partner — no badge, no score.
5. Wipeable via local data wipe.
6. Never names a real person — the closing line is genericized via the copy-pack (`modeCopy.partnerName`), same as Pre-Renn/Too Much/Attachment Repair.

## Relationship to phase-2 content

This ritual and its two most closely related protocols — **I'm Too Much /
Fear of Abandonment** (`/too-much`) and **Attachment Repair Cathedral**
(`/attachment-repair`) — are core v1 (App Store Safe): they're solo-practicable
and about the person's own pattern, not an existing relationship in friction.
They are reachable directly from Home in both build modes. Relationship Model,
Reconcile, Conflict-sim, and Need-Scared remain phase-2 (`pairedGrowthContent`)
since they presuppose an existing bond. See `docs/BUILD_MODES.md`.

## Code map

| Path | Role |
| ---- | ---- |
| `docs/FIRST_RITUAL.md` | This spec |
| `app/lib/firstRitualCore.ts` | Pure step sequence + progress logic |
| `app/lib/firstRitualCore.test.ts` | Invariants (never a gate, defensive parse) |
| `app/services/firstRitualStore.ts` | Persist (`litmo.first_ritual.progress.v1`) |
| `app/app/first-ritual/index.tsx` | Runnable UI |

## Non-claims

Not clinical treatment. Not diagnosis. Not proof of readiness for a
relationship. Not a public product yet — see `docs/REAL_PURPOSE.md`.

**Last updated:** 2026-07-14
