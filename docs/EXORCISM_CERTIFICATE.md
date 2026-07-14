# The Exorcism Certificate

**This is currently a personal emotional containment system, not a public product.**

**Pillar Fit Check:** serves Live in the Gray (Pillar 3) — completion and
continuation can both be true at once — and Grace Over Guilt (Pillar 7).
Strains Authenticity Over Performance (Pillar 6) if misused to imply
"done" before anyone actually decided that; resolved by the generator
never producing anything but a dated draft.

> The opposite direction from `docs/CATHEDRAL_PURGE.md`. That ritual
> erases. This one honors what was built without needing to delete
> anything or declare it finished before it's actually finished.

**Script:** `scripts/generate-exorcism-certificate.mjs`
**Output:** `docs/certificates/YYYY-MM-DD-draft.md` (gitignored by default — see below)

---

## Why this exists

`CONSTITUTION.md` Article IX already says the quiet part: *"Burning
(archive, delete, fire, walk away) is graduation. Nothing in this
Constitution forbids release."* But nothing turns that permission into an
artifact. This does — not a checklist to complete, not a milestone to hit,
just a way to look at the real state of the thing and let that be enough,
whenever "enough" happens to be true.

## What it actually does

Reads real repository state — commit count and date range, doc/test/route
counts, the fear→system table in `docs/CONTAINMENT_SYSTEM.md`, the most
recent `docs/CHANGELOG.md` entries — into one dated, static markdown file.
No opinions injected, no scoring, no "you're X% done" — just facts, plus
the same honest disclaimers this whole project already lives by.

## What it deliberately does not do

- **Does not declare graduation.** There is no flag, mode, or invocation
  that marks a generated certificate "official" or "final." The script
  cannot make that call — see `CONSTITUTION.md` Article IX: that's a human
  decision, every time.
- **Does not run automatically.** Not in CI, not on a schedule, not
  triggered by any app event. A human runs it, on purpose, when they want
  to look at where things stand.
- **Does not imply anything is resolved.** Naming a fear in
  `docs/CONTAINMENT_SYSTEM.md`'s table means it has a system holding it,
  not that it's healed. The certificate says this explicitly every time.

## Using it

```bash
node scripts/generate-exorcism-certificate.mjs
```

Produces `docs/certificates/<today>-draft.md`. That directory is
gitignored by default (see `.gitignore`) — a generated snapshot is for the
founder to look at, keep privately, or promote into a real commit
themselves if it means something. This script does not decide that for
them.

## If a real graduation ever happens

That's not this script's job to produce. It would be a human choice,
written in the founder's own words, probably referencing whatever the most
recent certificate said — and it would be exactly as honest about what's
still unresolved as `docs/THE_2_382_DOCTRINE.md` already is about two
failing tests. This tool exists so that choice, whenever it comes, isn't
starting from a blank page.

**Last updated:** 2026-07-14
