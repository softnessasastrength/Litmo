# First Codex Session Prompt

**This is currently a personal emotional containment system, not a public product.** See `CURRENT_STATE.md` and `docs/REAL_PURPOSE.md` for the canonical framing before using the prompt below — it was written in an earlier "first playable prototype" framing, but the underlying reality is one founder's private tool.

Copy and paste the prompt below into Codex while it is opened in the Litmo repository root.

```text
You are joining the Litmo project as the primary implementation agent for the first playable prototype.

Before making any changes, read these files in this order:

1. CONSTITUTION.md
2. CLAUDE_CONSTITUTION.md
3. AI_COLLABORATION_CONSTITUTION.md
4. CODEX.md
5. TEAM.md
6. ROADMAP.md
7. README.md
8. NOTES.md
9. Everything in docs/

Then inspect the existing repository structure and current implementation.

First response only:

Summarize your understanding of:

- Litmo's mission
- the difference between vibe compatibility and consent compatibility
- the product and UX philosophy
- the safety invariants
- the current architecture
- the first roadmap milestone
- any conflicts, missing dependencies, or risks you found

Do not write code in the first response. Wait for founder approval of your understanding.

After approval, implement only the first playable front-end milestone.

GOAL

Create an Expo React Native prototype that Branden can launch in Expo Go and tap through on an iPhone.

SCOPE

Use mock and synthetic data only.

Do not implement:

- authentication
- real matching
- real location
- Supabase integration
- backend networking
- payments
- identity verification
- production analytics

BUILD THIS PLAYABLE FLOW

1. Welcome screen
2. Whimsical BuzzFeed-style vibe quiz
3. Animated and accessible quiz progress
4. Vibe archetype result
5. Shareable-looking Vibe Profile card inside the app
6. Touch Language setup using friendly, nonclinical language
7. Mock Discover screen with several synthetic profiles
8. Mock match-detail screen
9. Consent Snapshot review
10. Simulated Active Session with visible timer and Soft Signal
11. Session Wrap-Up
12. Mock Trust Ledger

QUIZ EXPERIENCE

The quiz should feel playful, emotionally intelligent, and slightly strange in a delightful way.

Use indirect questions such as choosing a room, rainy afternoon, movie-night behavior, comforting sounds, social pace, or how someone settles after a difficult day.

Do not present the quiz as diagnosis, attachment classification, mental-health screening, or scientific certainty.

The result should describe tendencies using warm, provisional language. It must explain that people are more nuanced than profiles.

SAFETY RULES

- Vibe matching may suggest social compatibility but must never imply consent.
- Consent screens must remain explicit and literal even when the rest of the product is whimsical.
- Soft Signal must be prominent, immediately understandable, and usable without explanation.
- Do not create a false claim that the prototype guarantees safety.
- Unknown or missing consent information must fail closed.

DESIGN DIRECTION

The app should feel like:

- a cozy room
- a beautiful journal
- an internet personality quiz made with care
- a trusted guide

It should not feel like:

- HR software
- hospital software
- a hookup app
- a swipe casino
- an enterprise dashboard

Use calm typography, rounded surfaces, generous spacing, gentle motion, strong readability, and accessible contrast. Respect reduced-motion settings and avoid using color as the only status signal.

ENGINEERING REQUIREMENTS

- Keep the app runnable with standard documented commands.
- Prefer a small, understandable component system.
- Use TypeScript.
- Keep mock data clearly separated from UI components.
- Add tests for deterministic quiz scoring and any consent-overlap behavior touched.
- Do not remove or weaken existing backend consent tests.
- Avoid unnecessary dependencies.
- Do not commit secrets.

WORKFLOW

1. Create or use a dedicated feature branch.
2. State which files you expect to change before editing.
3. Implement in small coherent commits.
4. Run available type checks, tests, and build checks.
5. Update relevant documentation and ROADMAP.md.
6. Record any new product insights in NOTES.md only when they are genuine founder-relevant observations, not routine implementation details.
7. Provide a handoff using the format required by AI_COLLABORATION_CONSTITUTION.md.
8. Stop after the first playable milestone and wait for founder review. Do not begin the next roadmap chapter automatically.

DEFINITION OF DONE

The milestone is done when:

- the prototype launches successfully
- every screen in the mock flow is reachable
- the quiz produces deterministic results
- the interface is usable on an iPhone-sized screen
- consent language remains clear and separate from vibe language
- Soft Signal is prominent
- relevant tests and checks have been run and truthfully reported
- setup instructions are current
- Branden can launch it in Expo Go using documented steps

Begin by reading and summarizing. Do not edit yet.
```
