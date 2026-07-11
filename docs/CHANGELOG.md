# Litmo changelog

This file records meaningful product, safety, architecture, documentation, and release changes. It is maintained alongside implementation work so the repository remains understandable without private conversation history.

## Unreleased

### Added

- An explicit prototype-entry screen separating fictional local demo mode from future real account authentication.
- Clear disclosure that demo mode creates no account, performs no identity verification, and connects no real people.
- A disabled, honestly labeled account-sign-in state while Supabase authentication remains unfinished.
- Safety language explaining that compatibility and trust examples do not establish consent or prove safety.

### Changed

- The launch screen now routes through the prototype-entry boundary instead of beginning onboarding immediately.
- Launch copy now states that the prototype uses imaginary people and creates no real connection.

### Verification status

- Changes were committed through the GitHub connector.
- Dependency installation, formatting, type checking, tests, Expo export, and physical-iPhone behavior were not run in this environment and remain to be verified locally or by the next coding agent.
