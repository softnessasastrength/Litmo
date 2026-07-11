# Chapter 1: First playable

## Purpose

The first playable makes Litmo tangible enough to review on an iPhone. It uses fictional people and in-memory state to demonstrate the emotional and safety architecture without handling real intimate information.

## Flow

1. Welcome introduces softness without making a therapeutic promise.
2. Six indirect Vibe Quiz questions explore social and sensory tendencies.
3. Deterministic scoring produces one of three provisional archetypes.
4. The Vibe Profile card presents a conversation starter, not a diagnosis.
5. Touch Language setup changes from whimsical to direct preference language.
6. Discover and match detail use clearly labeled synthetic profiles.
7. Consent Snapshot shows a literal, restrictive mock agreement.
8. Active Session keeps Soft Signal visually and semantically prominent.
9. Wrap-Up records a simulated private reflection.
10. Trust Ledger shows contextual history without a score or safety claim.

## Design decisions

### Warmth without ambiguity

The quiz uses ordinary scenes—rain, kitchens, rooms, sounds, and friendship pace—to invite recognition without mental-health framing. Once consent begins, copy becomes literal. This separation protects the distinction between social affinity and permission.

### Typography

Georgia provides an available-on-device editorial voice for important headings and cards; the platform sans-serif remains the body face for legibility. Avoiding a downloaded font keeps Expo Go setup local and removes font-loading failure states.

### Color

Cream and paper establish a warm journal surface. Moss communicates grounded action, plum adds reflective character, and apricot supplies gentle progress. Soft Signal uses a deeper rose because it must remain distinct and prominent. Text labels, icons, and structure accompany color everywhere safety meaning appears.

### Shape and spacing

Rounded surfaces and generous spacing create a calm rhythm and comfortable touch targets. The interface avoids dense dashboards, card swiping, urgency, streaks, and popularity mechanics.

### Motion

Short fades, small vertical movement, and animated progress create continuity without spectacle. The app reads the operating system reduced-motion preference and removes transition duration when reduction is enabled.

### Quiz scoring

Answers add small weights to three archetypes. Ties use a stable order so identical answers always produce identical results. Tests cover winning scores, ties, empty answers, and invalid values. Results use “may” language and explicitly reject diagnosis or certainty.

### Safety boundaries

- Vibe language never grants consent.
- Consent Snapshot requires an explicit affirmative choice.
- Choosing no prevents progression and requires no explanation.
- Soft Signal ends the simulation immediately and states that it has no penalty.
- Uncomfortable wrap-up language points toward private human support without pretending that reporting exists in the prototype.
- Trust history is called context, never certification.

## Technical boundaries

Chapter 1 uses Expo Router, TypeScript, React Context, React Native Animated, and static mock modules. It performs no network requests and imports no backend or Supabase client. State disappears when the app restarts.

The prototype is not evidence of production safety, accessibility compliance, or operational readiness. It still needs founder device review and independent accessibility and safety review.
