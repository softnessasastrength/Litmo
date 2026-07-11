# Chapter 3 — Consent Engine

## Mission

Turn the Touch Language Profile into a versioned, explainable, conservative consent system.

The system must distinguish between what a person welcomes, what requires a fresh ask, what is off limits, and what the person is personally willing or able to offer.

Compatibility is informational. It is never consent and never proof that another person is safe.

## Core model

Represent consent preferences across these dimensions:

- Body zone
- Hold or contact type
- Pressure
- Duration
- Environment
- Position
- Communication preference
- Accessibility need
- Sensory constraint

Use at least three consent states:

- `welcomed`
- `ask_first`
- `off_limits`

Also distinguish:

- `can_receive`
- `can_offer`

Missing, invalid, stale, or contradictory data must resolve conservatively.

## Requirements

### Versioned profiles

- Every material profile change creates a new immutable version.
- Active sessions retain the exact version used to compute their Consent Snapshot.
- Historical versions remain readable for authorized audit purposes but cannot be rewritten by ordinary users.
- Users can preview the practical effect of changes before saving.

### Compatibility engine

Build a pure, deterministic domain service that:

- Computes mutual overlap.
- Rejects hard incompatibilities.
- Applies the more restrictive pressure, duration, body-zone, and environment rule.
- Identifies items requiring a fresh ask.
- Produces machine-readable and human-readable explanations.
- Never converts compatibility into consent automatically.

Example explanation:

> Both people welcome side-by-side contact. Light pressure is used because it is the more restrictive shared preference. Shoulder contact requires a fresh verbal ask. Chest and lower-body contact are excluded.

### Consent Snapshot

- Generate an immutable session-specific snapshot from two exact profile versions.
- Include only mutually permitted options.
- Record excluded and ask-first categories without exposing unnecessary private reasoning.
- Require explicit confirmation from both participants.
- Invalidate confirmation after any material snapshot change.
- Permit either participant to withdraw consent at any moment.

### Privacy

- Discovery must expose only intentionally public or discovery-safe fields.
- Detailed body-zone boundaries remain private until required for a proposed session.
- Private nervous-system notes are never disclosed to another participant by default.
- Logs and analytics must not contain raw consent answers.

## Testing

Build exhaustive table-driven tests for:

- Every consent-state combination
- Receive/offer asymmetry
- Missing values
- Invalid values
- Stale profile versions
- Contradictory preferences
- Pressure and duration restriction
- Body-zone exclusions
- Ask-first handling
- Snapshot invalidation
- Withdrawal during each lifecycle state

Use property-based tests where useful to prove that adding a restriction can never broaden the computed overlap.

## Acceptance criteria

- Consent rules live in a framework-independent domain module.
- Compatibility output is deterministic and explainable.
- More restrictive preferences always win.
- A match never activates consent.
- Consent Snapshots reference immutable profile versions.
- Material changes invalidate previous confirmations.
- Sensitive data remains private by default.
- Safety-critical edge cases have automated tests.
- Architecture, threat model, and limitations are documented.
