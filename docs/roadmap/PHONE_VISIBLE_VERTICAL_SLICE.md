# Phone-Visible Vertical Slice

## Goal

Create a Litmo experience that launches on a physical iPhone and can be explored from beginning to end, even when some backend capabilities still use clearly isolated demo data.

This is the first user-facing milestone within Chapter 2.

The objective is not a production release. The objective is a coherent, honest, inspectable mobile artifact that demonstrates Litmo's product language and consent flow without pretending unfinished infrastructure is complete.

## Required demo path

The app must support this complete path:

```text
launch
→ sign in or enter demo mode
→ complete Touch Language onboarding
→ configure body-zone and boundary preferences
→ browse seeded discovery profiles
→ request a session
→ review and mutually confirm a Consent Snapshot
→ begin an active session
→ use the Soft Signal or complete normally
→ complete private wrap-up
→ view private trust history
```

## iPhone launch requirement

The repository must support at least one documented physical-iPhone path:

1. Expo Go, when compatible with the app's dependencies; or
2. An iOS development build when Expo Go cannot support required native modules.

Document exact steps from a clean clone, including:

- Prerequisites
- Environment variables
- Install commands
- Start commands
- QR-code or development-build steps
- Required network conditions
- Expected launch screen
- Common failures and recovery steps

Do not claim physical-device success unless it was actually verified. When device verification is unavailable, document the exact unverified procedure and the simulator or build checks that were run instead.

## Experience requirements

- No dead-end screens in the required path.
- No blank loading or failure screens.
- No raw stack traces, database messages, or developer placeholders shown to users.
- Navigation must support forward progress and reasonable back navigation.
- Demo data must be visibly and technically separated from production data.
- The visual language should feel calm, intentional, accessible, and recognizably Litmo.
- Consent language must remain explicit, specific, and revocable.
- Compatibility and trust signals must never be described as proof of safety.
- The Soft Signal must be easy to find and must not require an explanation.

## Demo data rules

Demo data may be local or Supabase-backed, but it must:

- Use fictional adults only.
- Contain no real personal data.
- Avoid stereotypes and coercive scenarios.
- Exercise compatible and incompatible boundary examples.
- Include at least one empty state and one recoverable failure state.
- Be resettable through a documented command or in-app action.
- Be impossible to confuse with production identity verification or real safety certification.

Prefer an explicit adapter or fixture layer over scattered hard-coded values in UI components.

## Required screens and states

### 1. Launch

Show Litmo branding, a concise product statement, and a clear path to sign in or enter demo mode.

### 2. Sign-in or demo entry

Support real authentication when available. Demo entry must be clearly labeled and must not imply a real account exists.

### 3. Touch Language onboarding

Collect meaningful preferences in understandable steps. Progress must be visible and recoverable.

### 4. Body-zone and boundary setup

Represent at least:

- Welcomed
- Ask first
- Off limits

Do not use color as the only distinction.

### 5. Discovery

Show fictional profiles with compatibility explanations. Include a clear statement that compatibility does not establish safety or consent.

### 6. Session request

Allow duration, setting, and relevant session constraints to be reviewed before sending.

### 7. Consent Snapshot

Show the conservative intersection of both participants' preferences. Both parties must be represented as confirming the same immutable snapshot before the demo can activate the session.

### 8. Active session

Show timer, agreed boundaries, normal end control, and prominent Soft Signal.

### 9. Soft Signal

End the session immediately without demanding a reason. Use neutral language and provide next-step choices.

### 10. Wrap-up

Each participant's response is private. Do not expose public ratings or imply automatic punishment.

### 11. Private trust history

Show specific, legible trust events rather than a universal safety score. State what these events do and do not mean.

## State coverage

Every primary screen in the demo path must account for:

- Loading
- Empty
- Success
- Validation failure
- Network failure
- Permission failure when applicable
- Unexpected failure
- Recovery or retry behavior

At least one deterministic demo control or test must make these states inspectable.

## Accessibility baseline

- Screen-reader labels for controls and meaningful content
- Logical focus order
- Minimum practical touch-target sizing
- Dynamic text compatibility where practical
- No essential meaning conveyed only by color
- Reduced-motion behavior
- Clear language without euphemistic consent wording

## Architecture constraints

- Do not scatter demo conditionals across screen components.
- Keep demo and production adapters behind typed interfaces.
- Validate fixtures at runtime using the shared domain schemas.
- Never include service-role credentials in the app.
- Never log sensitive consent details.
- Preserve a migration path from demo adapters to real repositories.

Create an ADR describing the demo-data separation strategy.

## Verification

At minimum, verify and document:

- Dependency installation
- Lint
- Type checking
- Unit tests
- Mobile build or Expo export validation
- Deterministic traversal of the full demo path
- App restart behavior where implemented

Where practical, add an automated mobile smoke test. Otherwise provide a precise manual script with expected results and screenshots or screen names.

## Documentation updates

Update or create as relevant:

- `README.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/CONSENT_FLOW.md`
- `docs/TRUST_SYSTEM.md`
- `docs/CHANGELOG.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/adr/`
- `docs/CHAPTER_2_COMPLETION.md`

Follow `docs/DOCUMENTATION_STANDARD.md`.

## Acceptance criteria

The milestone is complete only when:

- The app has a documented physical-iPhone launch path.
- The complete required demo path is navigable.
- No required screen is a dead end.
- Demo data is isolated and clearly identified.
- Consent and Soft Signal behavior match Litmo's product rules.
- Compatibility and trust language avoid safety certification.
- Loading, empty, and failure behavior are inspectable.
- Accessibility basics are present.
- Relevant documentation is current.
- Available lint, type-check, test, and build checks have been run and their exact results recorded.
- Unverified device behavior and unfinished infrastructure are stated plainly.

## Stop condition

Work autonomously until every acceptance criterion is met or a genuine external blocker prevents further progress.

Do not pause for routine choices. Document reasonable decisions and continue. Batch non-blocking questions for the completion report.
