# Fork Your Own Cathedral

**This is currently a personal emotional containment system, not a public product.**

**Pillar Fit Check:** serves Be the Mirror You Needed (Pillar 4) and honors
Healing Is a Collective Act (Pillar 5) without a hosted platform. Strains
Do the Hard Thing (Pillar 2) if built carelessly — the tool must clear
mechanical friction only, never do the forker's emotional labor for them.
Resolved: the script touches config/copy only and generates a *template*
with real `[fill this in]` gaps, never a finished personal narrative.

> "The revolution is shared softness" (Pillar 5), made real without a
> login page. You don't get an account here. You get a copy of the
> architecture, and it's yours the moment you clone it.

**Script:** `scripts/consecrate-your-cathedral.mjs`

---

## What this actually is

This repository is licensed MPL 2.0 (see `LICENSE`) and covered by
`NON_MONETIZATION_COVENANT.md`. That means you can already legally clone
it, strip out everything specific to one founder's real relationship, and
build your own containment system for your own fear, using the same
architecture — Soft Signal, Touch Language, the ritual pattern, the
dual-mode build system. This doc and its script make that a five-minute
mechanical start instead of a scavenger hunt through 200 docs looking for
every place someone else's partner's name is hardcoded.

## What it is not

**Not a hosted service.** There is no "create an account on litmo.com and
build your cathedral in the cloud." That would reopen every SAFETY-OPS,
legal, and consent question this project has deliberately left blocked
(see `CURRENT_STATE.md`) — a real product, with real other people's real
data, run by an entity that doesn't exist. The fork model sidesteps all of
that by construction: you run it on your machine, for yourself, and no one
but you ever touches your data.

**Not a therapy-in-a-box generator.** The script does not ask you deep
questions and turn your answers into a finished psychological framework.
It asks a few mechanical questions (what do you want to call this, is
there a name to swap in, one optional sentence) and writes a *template*
with real gaps for you to fill in yourself, later, in your own words, or
never. Your inner life doesn't get auto-completed by a Node script.

## Using it

```bash
git clone <your fork's URL>
cd <your-fork>
node scripts/consecrate-your-cathedral.mjs
```

It will:
1. Ask what you want to call your cathedral, your name, an optional
   partner/person name, and one optional honest sentence.
2. If you gave a name, replace `"Renn"` with your name in
   `app/config/copy/maximumCopy.ts` — the *only* source file it touches,
   via an exact-match replace that refuses to guess if the file has
   changed shape.
3. Write `MY_REAL_PURPOSE.md` at your repo root — modeled on
   `docs/REAL_PURPOSE.md`'s structure, with `[fill this in]` placeholders
   for everything that's actually your story to tell.
4. Print a plain-language report of what's reusable as-is, what's someone
   else's personal narrative you should read for inspiration and then
   rewrite, and what license/covenant files to leave intact.

It never touches git. Nothing is committed for you. You look at the diff,
you decide.

## What's actually reusable (the architecture, not the story)

- Soft Signal — the unilateral, no-explanation stop, everywhere.
- Touch Language / the general "map a preference, never claim it's
  consent" pattern.
- The ritual pattern itself: a pure `*Core.ts` file (types + pure
  functions + defensive parsing), a thin `*Store.ts` (AsyncStorage/
  SecureStore), a screen, tests, and a doc that states hard rules and
  non-claims. Every containment protocol in this repo follows this shape —
  copy the shape, not the content.
- The dual build-mode system (`docs/BUILD_MODES.md`) if you ever want an
  App-Store-safe version of your own cathedral someday.
- `docs/PILLAR_FIT_CHECK.md`'s five questions — write your own pillars
  (or keep these seven, nothing says you can't) and use the same check.

## What's someone else's real story (read, don't copy)

`docs/REAL_PURPOSE.md`, `docs/CONTAINMENT_SYSTEM.md`,
`docs/ATTACHMENT_REPAIR_PROTOCOL.md`, and every individual containment
protocol's doc (Spooning, Morning Cuddle, Too Much, Need-Scared, etc.) are
one real person's real fears, named specifically for one real
relationship. They're there so you can see what "naming a fear precisely
enough that it gets a system" actually looks like — not so you can
find/replace your way into pretending their story is yours. Write your
own. It'll be a worse fit for you if you don't.

## Keep intact unless you have a real reason not to

- `LICENSE` (MPL 2.0) — and specifically, remember that changes to files
  that already existed in this repo flow back upstream under copyleft.
- `NON_MONETIZATION_COVENANT.md` — you can remove it from your fork, but
  that's a choice to make on purpose, not something to lose by accident.
- `CLAUDE_CONSTITUTION.md` — if you use AI coding help on your fork, this
  is worth keeping or writing your own version of, for the same reason the
  original exists: it governs how the AI treats *you*, not how your app
  treats anyone else.

**Last updated:** 2026-07-14
