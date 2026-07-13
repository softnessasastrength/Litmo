# ADR 0063 — Composable semantic haptic language

- **Status:** accepted for phone engineering; hardware still design  
- **Date:** 2026-07-13  
- **Updated:** 2026-07-13 — Nuclear Autistic Edition v0.1 (`hapticLanguageNuclear`)  
- **Supersedes in part:** extends ADR 0039 (does not remove five-event public API)  
- **Constitution:** I.4 Soft Signal freeness · IV no engagement haptics · X honesty  

## Nuclear v0.1 addendum

Adds second/third-level primitives (duration classes, 5-step intensity, body zones,
texture, context tags, safety envelopes), bracket syntax, consent-bound
`HapticConsentVocabulary`, phrase library, Soft Signal kill-all, ND envelopes.
Live session UI for dual-preview remains Phase B; pure law is enforceable now.

## Context

ADR 0039 shipped a five-event Expo haptic vocabulary. Hardware docs (ADR 0057,
`HARDWARE/HAPTICS.md`) define rich warm waveforms for a future device. Product
ambition requires a **single language** that is:

- programmable (curves, rhythm, location, emotion);  
- composable;  
- transmissible as recipes (self/device, never peer consent codes);  
- device-agnostic in IR;  
- excellent on iOS phone paths today.

Without a pure grammar, phone and device will invent conflicting meanings.

## Decision

1. Add **`hapticLanguageCore`** as the pure grammar: pressure curves, rhythms,
   locations, emotional modifiers, safety interrupts, lexemes, phrases,
   compositions, IR compile, phone call mapping, serialize/parse.
2. Soft Signal default phrase uses **`descend_warm` + breath_slow + solemn** and
   raises a **soft_signal interrupt** that aborts decorative playback.
3. Keep **`hapticService.play(HapticEvent)`** as the stable public API; implement
   via grammar `defaultPhraseForLexeme`.
4. Add **`playPhrase`** for Touch Language zone preview and future seal steps.
5. Expo adapter executes impact/notification/delay; **`core_haptics_hint`** is
   recorded for future Core Haptics without blocking Expo Go.
6. Explicit non-goals remain: peer consent encoding, FOMO loops, secret codes,
   delaying Soft Signal commit for motors.

## Alternatives considered

- Only expand the five-event switch without grammar. Rejected: not composable.  
- Core Haptics only, drop Expo. Rejected: Expo Go / Android path.  
- Transmit “touch messages” between users. Rejected: unconstitutional.

## Consequences

- Soft Signal haptic feel changes to multi-step descend (still warning notification first).  
- Physical device smoke still required.  
- Hardware firmware must map the same lexemes.  
- ND intensity policy can gate lexemes via `lexemeAllowedAtIntensity`.

## Related

- `docs/HAPTIC_LANGUAGE.md`  
- ADR 0039 · 0057  
- `app/lib/hapticLanguageCore.ts`  
