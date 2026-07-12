# Consent flow

1. Each participant maintains a personal touch profile and body-zone policy.
2. A session request creates no consent by itself.
3. The backend computes the strict intersection of both profiles.
4. The generated snapshot is immutable for that session.
5. Each participant independently confirms the same snapshot.
6. Only then may the session become active.
7. Consent remains revocable at any time; Soft Signal immediately exits the session.

## Conservative rules

- Empty overlap means the request cannot proceed.
- `off_limits` always wins.
- `ask_first` wins over `welcomed`.
- The lighter pressure and shorter duration always win.
- Unknown or malformed values fail closed.
- A prior confirmation never rolls forward into a new session.

## Canonical Chapter 3 engine

The framework-independent domain engine evaluates receiving and offering separately. Compatibility output contains welcomed directions, directions requiring a fresh ask, exclusions, stable machine-readable reasons, and privacy-safe explanations. It always reports that consent has not been granted.

A session snapshot references exact immutable profile IDs and version numbers. A participant must confirm the exact snapshot fingerprint. Any material snapshot change clears prior confirmations. Withdrawal clears confirmations in every lifecycle state and never requires an explanation.

Missing, invalid, stale, or contradictory profile data is excluded rather than interpreted as ask-first. Private nervous-system notes never enter compatibility output or explanations.

## Persisted Chapter 4 boundary

Canonical snapshots are created only by a trusted server after `@litmo/domain` computation and are tied to exact immutable participant profile IDs and versions. `POST /api/sessions/:sessionId/snapshot` authenticates the participant, loads both latest version pairs server-side, rejects ineligible overlap, and persists through the service-only database function; clients cannot supply compatibility output. Each participant's confirmation row is readable only by that participant. A second exact-fingerprint confirmation moves the session to `ready`; no path can activate without both current confirmations. Pre-activation withdrawal requires no explanation, records the actor/time, clears confirmations, and cancels the session. Snapshot replacement after a material profile edit is still pending.
