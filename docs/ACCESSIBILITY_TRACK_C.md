# Track C — Accessibility (BETA-001)

**Date:** 2026-07-12  
**Status:** Engineering criteria addressed for Soft Signal + Consent Snapshot  
**Related:** `docs/PHYSICAL_BETA_WALKTHROUGH.md` Track C, ADR 0007 (Face ID)

## Checklist

| # | Criterion | Engineering result |
|---|-----------|-------------------|
| C1 | VoiceOver on consent + Soft Signal | Named controls, headers, radiogroup, row labels, Soft Signal label/hint, selected state on choices. **Founder VoiceOver smoke still recommended.** |
| C2 | Dynamic Type (largest) | Buttons/choices scale (`allowFontScaling`, `maxFontSizeMultiplier={2}`); timer capped so safety controls keep space. |
| C3 | Reduced motion | `useReducedMotion` zeros FadeIn / progress animation duration when OS reduce-motion is on. |
| C4 | Color + text | Soft Signal uses **text label + rose fill**, never color alone; explain copy under control. |
| C5 | Touch targets | Primary buttons min ~56pt; Soft Signal min ~68pt; hitSlop on signal/choices. |

## Surfaces hardened this pass

- `app/components/ui.tsx` — Button, Choice, Title/Eyebrow headers  
- `app/app/session/active.tsx` — Soft Signal a11y label/hint order  
- `app/app/match/consent-snapshot.tsx` — boundary rows, decision group, withdraw  

## Founder VoiceOver smoke (optional, 3 minutes)

1. Settings → Accessibility → VoiceOver on.  
2. Open demo or real **Consent Snapshot** — swipe through rows and Yes/No.  
3. Active session — Soft Signal is announced as end-session, not emergency services.  
4. Confirm focus order: Soft Signal before secondary actions.
