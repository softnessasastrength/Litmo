# Two Maps, One Table — Second Guided Ritual v0.1

**This is currently a personal emotional containment system, not a public product.**

> The follow-up to `docs/FIRST_RITUAL.md`, for once "younger me" actually has
> a partner and wants to bring some of this in — without turning them into a
> case study. Not consent. Not a diagnosis. Not therapy.

**Route:** `/second-ritual`
**Core:** `app/lib/secondRitualCore.ts`
**Store:** `litmo.second_ritual.progress.v1`
**Screen:** `app/app/second-ritual/index.tsx`
**Gate:** `features.pairedGrowthContent` (Maximum Mode only — presupposes an existing relationship)

---

## Containment job

`docs/FIRST_RITUAL.md` is solo, self-understanding first. This is the
explicitly-named second half of the sequence from
`docs/REAL_PURPOSE.md`'s "North star addition": shared language, second.
It does not teach anything new — every step links to an existing, already-built
screen. This file is sequencing and voice, not new consent machinery.

## The four steps

| Step | What it asks | What it reuses |
| ---- | ------------- | --------------- |
| **Check your own weather first** | Name today's sky before handing someone your map | `/weather` (`weatherCore`) |
| **Share the map, not your whole self** | Send an encrypted, expiring Touch Language share | `/touch-language/share` (`touchLanguageShareCore`) — reading it is never consent to touch |
| **Name the bond, together** | Seal or open the shared bond-map vocabulary | `/relationship-model` (`relationshipModelCore`) |
| **Shared reassurance** | A few generic reassurance lines, read alone or together | `attachmentRepairCore.RITUAL_SCRIPTS.mommy_issues` |

## Hard rules

1. Not consent. Not a diagnosis. Not therapy.
2. Steps are never a gate — any order, any pace, freely skippable and re-enterable.
3. Sharing a Touch Language map is never itself consent to touch — enforced upstream by `touchLanguageShareCore` (`reqConsent`/`notTouch` flags), unaffected by this ritual.
4. Completion implies nothing about the relationship being "safe" or "ready" — no badge, no score.
5. Wipeable via local data wipe.
6. Copy never names a real person — reuses generic lines already established for App Store Safe / Maximum via the copy-pack.
7. Gated behind `pairedGrowthContent` — this is Maximum-Mode-only content; App Store Safe v1 stays solo (`docs/FIRST_RITUAL.md`).

## Code map

| Path | Role |
| ---- | ---- |
| `docs/SECOND_RITUAL.md` | This spec |
| `app/lib/secondRitualCore.ts` | Pure step sequence + progress logic |
| `app/lib/secondRitualCore.test.ts` | Invariants (never a gate, defensive parse) |
| `app/services/secondRitualStore.ts` | Persist (`litmo.second_ritual.progress.v1`) |
| `app/app/second-ritual/index.tsx` | Runnable UI, fails closed when `pairedGrowthContent` is off |

## Non-claims

Not clinical treatment. Not diagnosis. Not proof the relationship is safe or
ready. Not a public product — see `docs/REAL_PURPOSE.md`.

**Last updated:** 2026-07-14
