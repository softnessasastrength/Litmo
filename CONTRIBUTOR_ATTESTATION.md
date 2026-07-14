# Contributor Attestation

**This is currently a personal emotional containment system, not a public product.**

**Pillar Fit Check:** serves Authenticity Over Performance (Pillar 6) —
naming, plainly, what anyone touching this codebase is implicitly promising,
instead of leaving it unspoken until a real dispute forces the question.

**Status:** A lightweight attestation, not a CLA. This project does not have
a contributor license agreement, a legal entity to hold one, or a process
for reviewing outside pull requests today. This document exists so that
*if* that ever changes, there's already a plain-language answer to "what am
I agreeing to by contributing," rather than inventing one under pressure.
Follow-up to ADR 0044.

---

## Who this currently applies to

As of this writing, the only contributors to this repository are the
founder (Branden Algozino) and AI coding agents (Claude, via Claude Code)
working under his direction. There is no open call for outside
contributions. This document is written now, in advance, because
`CLAUDE_CONSTITUTION.md` and this project's whole approach favor stating
intent before it's tested by a real edge case, not after.

## What contributing to this repository attests

Anyone who commits code, docs, or other content to this repository —
human or AI, under current practice or in a hypothetical future where
outside contributions are accepted — attests that:

1. **The contribution is theirs to give.** They wrote it, generated it
   under their own direction, or otherwise have the right to submit it
   under this repository's license (MPL 2.0, see `LICENSE`) — not copied
   from somewhere that forbids that.
2. **They understand the license.** Contributions become part of a
   file-level copyleft codebase; modifications to existing MPL-2.0 files
   stay under MPL-2.0 if distributed. See ADR 0044 for why that license was
   chosen and what it does and doesn't require.
3. **They've read `CLAUDE_CONSTITUTION.md`.** Not as a formality — because
   this project's actual acceptance criteria for new work is "does this
   serve real containment or performed productivity," not "does it compile
   and pass CI." A contribution that's technically correct but fails the
   Pillar Fit Check (`docs/PILLAR_FIT_CHECK.md`) is not welcome here
   regardless of code quality.
4. **They are not claiming this is a certified, clinically reviewed, or
   legally compliant product.** Nothing about contributing changes what's
   actually true about this project's maturity — see
   `docs/KNOWN_LIMITATIONS.md` and `docs/GDPR.md` §11 for what is and
   isn't actually claimed.

## For AI coding agents specifically

This repository's commit history already contains many commits authored
with AI assistance, attributed honestly via `Co-Authored-By` trailers. That
practice continues. An AI agent contributing to this repository is expected
to:

- Verify claims before making them (tests actually run, builds actually
  attempted) rather than asserting completion — see the repeated "verify
  before claiming" discipline throughout `docs/CHANGELOG.md`.
- Flag genuine ambiguity or high-stakes decisions to the human directing
  the work rather than silently choosing, per `AGENTS.md`'s autonomy rules.
- Never remove or weaken a safety invariant (Soft Signal, age gate, dual
  consent) to make a task easier, per `CLAUDE_CONSTITUTION.md`.

This is a description of existing practice, not a new rule invented for
this document.

## If this project ever accepts outside contributions

The lightweight mechanism already named in ADR 0044's follow-up work is a
**Developer Certificate of Origin (DCO) sign-off** — a `Signed-off-by:
Name <email>` trailer on each commit, certifying the same things listed
above (origin, right to submit, license acceptance), without requiring a
signed legal agreement or a corporate CLA process this project has no
infrastructure to run. That mechanism is named here as the intended
default, not yet enforced by tooling (no CI check requires it today, since
there is no outside-contribution flow to enforce it against).

## What this is not

- Not a CLA, and not legal advice. See ADR 0044's own closing line: this
  records a founder-selected governance decision, not a lawyer's opinion.
- Not currently enforced by any bot, hook, or CI check — there is nothing
  to enforce it against yet.
- Not a barrier to forking. `docs/FORK_YOUR_OWN_CATHEDRAL.md` remains the
  actual on-ramp for building your own version of this; nothing here adds
  friction to that path.

---

**Last updated:** 2026-07-14
