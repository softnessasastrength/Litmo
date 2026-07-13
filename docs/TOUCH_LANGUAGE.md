# Touch Language system

**Status:** implemented (local-first full map + encrypted partner share)  
**App paths:** `/touch-language`, `/touch-language/edit`, `/touch-language/share`  
**Storage:** Secure Store preferred (`litmo.touch_language.doc.secure.v1`)

> Touch Language is how someone describes **how** touch tends to feel okay —  
> pressure, speed, duration, preferred holds, body areas, hard limits, and soft limits.  
> **It is never consent to touch.** A match, vibe, or shared map never activates a session.

## What it includes

| Dimension | Options |
| --- | --- |
| Pressure | Feather-light · Comfortably gentle · Steady and grounding |
| Speed | Very slow · Unhurried · Moderate · Brisk but kind |
| Duration | Brief hello · Few quiet minutes · Decide together |
| Environments | Calm public · Outdoors · Hosted community (multi-select) |
| Hold types | Side-by-side, hand holding, shoulder squeeze, upper-back rest, side hug, guided walk, forearm rest, no holds |
| Body zones (12) | Hands, arms, shoulders, upper back, neck, head/scalp, face, torso, lower back, outer hips, legs, feet |
| Zone status | Welcomed · Ask first · Soft limit · Hard limit / off limits |
| Hard limits | Absolute nos (presets + custom) |
| Soft limits | Usually avoid / only with extra care (presets + custom) |
| Private notes | Device-only; **stripped from shares** |

Unset zones are **off limits** (fail closed).

## Visual map

`TouchLanguageMap` shows every zone with a status letter **and** color swatch (color is never the only cue):

- **W** Welcomed  
- **A** Ask first  
- **S** Soft limit  
- **✕** Off limits  

## Local save

`touchLanguageStore` loads/saves a versioned `TouchLanguageDocument` (v1).  
Onboarding essentials migrate into the same document via `migrateFromLegacyDemo`.

## Secure partner share

1. Owner creates an **AES-256-GCM** package (`sealTouchLanguageShare`).  
2. Private notes are **not** included.  
3. Partner receives deep link `litmo://tl/v1/…` + 6-digit unlock code.  
4. Package expires (~15 minutes).  
5. Partner must explicitly accept **“review only, not consent”** before the map is shown.  
6. Viewing a share does **not** overwrite the partner’s own map and does **not** start a session.

Safety flags on every payload: `notConsentToTouch`, `notSessionActivation`, `requiresExplicitAccept`.

## Code map

| Path | Role |
| --- | --- |
| `app/data/touchLanguageCatalog.ts` | Labels and option lists |
| `app/lib/touchLanguageCore.ts` | Document model, parse, summary, migrate |
| `app/services/touchLanguageStore.ts` | Local secure persistence |
| `app/services/touchLanguageShareCore.ts` | Encrypt / decrypt shares |
| `app/components/TouchLanguageMap.tsx` | Visual body map |
| `app/app/touch-language/*` | Hub, editor, share UI |

## Product rules

- Profile / map ≠ Consent Snapshot.  
- Soft Signal still ends contact.  
- Hard limits win over “welcomed” wording if they conflict.  
- No analytics of private notes.  
- Demo works fully offline.
