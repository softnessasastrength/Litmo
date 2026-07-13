# Trauma-informed safety system

**Status:** implemented in mobile app (local-first; Soft Signal remains stop authority)  
**ADR:** [0059-trauma-informed-safety-system.md](adr/0059-trauma-informed-safety-system.md)  
**Routes:** `/safety` · `/safety/panic-cover` · `/safety/verify` · `/safety/reflection` · active session · wrap-up

> Stopping is success.  
> Processing is optional.  
> Verification is diligence, not a certificate.  
> Litmo is not emergency response or crisis services.

## Purpose

Give people tools that protect **choice and nervous-system capacity** during and after platonic connection:

1. **Panic mode** — Soft Signal + calm cover screen  
2. **Quick exit** — Soft Signal + wrap-up without pressure  
3. **Session timeout** — optional agreed time boundary  
4. **Partner / present-moment verification** — orientation checks, not safety scores  
5. **Post-session reflection** — skippable tools that help process without forcing narrative  

This layer builds on **Soft Signal** and emergency withdrawal. It does not replace them.

**Neurodivergent Mode** (see [`NEURODIVERGENT_MODE.md`](NEURODIVERGENT_MODE.md)) is the complementary
device-local accommodation layer: pacing, sensory density, reduced motion/haptics,
plain language, and overload exits. Demo turns ND Mode on by default. Accommodations
never gate Soft Signal or consent — they make pause and leave easier under overload.

## Invariants

| Rule | Meaning |
| ---- | ------- |
| Unilateral stop | Panic, quick exit, Soft Signal, timeout exit need no peer permission |
| No reason required | Never a form at stop time |
| Local first | Stop commits on device even offline |
| Not emergency services | Copy states this; no automatic emergency dispatch |
| Not clinical therapy | Reflection is self-help, not treatment |
| Not a safety certificate | Verification never proves anyone is safe |
| Not consent | Checks and reflections never authorize touch |
| Skip is success | Leaving reflection unfinished is valid |

## Components

### 1. Soft Signal (existing core)

Immediate session end. Personal log. Hardware contract. See `docs/SOFT_SIGNAL.md`.

### 2. Panic mode

- Fires Soft Signal **first** (never delayed for animation).  
- Navigates to `/safety/panic-cover` — large clock, calm copy, no session chrome.  
- User may later open wrap-up, reflection, or Home.  
- Pref: cover on/off (`traumaSafetyStore` prefs).

### 3. Quick exit

- Soft Signal + navigate to private wrap-up.  
- Same stop authority; less “process now” pressure than staying on the active screen.

### 4. Session timeout

- **Off by default.**  
- Configurable max minutes + warn-before.  
- Warning banner during active session.  
- At time-up: either **auto Soft Signal** or **calm prompt** (Soft Signal / extend +15).  
- Extending is local preference only — still not a new Consent Snapshot (user reminded Soft Signal remains available).

### 5. Present-moment verification

`/safety/verify` checklist:

- I am present as myself for this moment  
- Reviewed Consent Snapshot  
- Soft Signal known  
- Exit path known  
- Space feels workable  
- Can stop without managing their feelings  

Stored privately. Flags: `notSafetyCertificate`, `notConsent`, `notIdentityProof`.

### 6. Post-session reflection

`/safety/reflection` optional ladder:

1. Body now  
2. What helped  
3. What was hard  
4. Aftercare next half hour  
5. Enough for today  

Chips + optional note. Every step skippable. Skip-all is first-class. Archived on device; never partner-visible.

Wrap-up links into reflection without requiring it.

## Active session UI

On `/session/active`:

- Soft Signal (primary)  
- Quick exit  
- Panic mode — stop & cover  
- End together  
- Report / block (when peer known)  
- Timeout banner + due prompt when enabled  

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/traumaSafetyCore.ts` | Pure types, timeout math, copy, reflection ladder |
| `app/services/traumaSafetyStore.ts` | Secure Store prefs / verification / reflections |
| `app/services/traumaSafetyService.ts` | Orchestration with Soft Signal |
| `app/app/safety/index.tsx` | Hub + prefs |
| `app/app/safety/panic-cover.tsx` | Calm cover |
| `app/app/safety/verify.tsx` | Present-moment checks |
| `app/app/safety/reflection.tsx` | Optional reflection player |
| `app/app/session/active.tsx` | Wired exits + timeout |
| `app/app/session/wrap-up.tsx` | Reflection CTA |

## What this is not

- Not 911 / crisis dispatch  
- Not a wearable panic button network  
- Not partner-visible “safety scores”  
- Not mandatory counseling  
- Not a replacement for block, report, or Soft Signal  

## Future work

- Hardware Soft Signal button → panic cover path  
- Optional trusted-contact SMS (explicit opt-in; legal review)  
- Server-side agreed session duration on dual snapshot (today timeout is local pref)  
- VoiceOver smoke of panic cover under stress simulation  
