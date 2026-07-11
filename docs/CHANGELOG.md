# Changelog

## 2026-07-11 — Chapter 3 consent engine property-based coverage

### Summary

Added a seeded, randomized property test proving that restricting any consent rule (stricter state, or revoking receive/offer capability) can never broaden the computed permitted or ask-first overlap, closing the remaining `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md` testing requirement.

### User-visible impact

None. Domain test coverage only.

### Developer impact

`@litmo/domain` shared tests increased from 35 to 36; the new test runs 200 seeded iterations internally. No production code changed.

### Migration and setup impact

None.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`

## 2026-07-11 — Chapter 3 consent engine started

### Summary

Added the canonical directional, version-aware consent engine and session snapshot semantics in `@litmo/domain`.

### User-visible impact

No mobile screen changes yet. Future compatibility views can distinguish welcomed, ask-first, and excluded options without exposing private notes.

### Developer impact

The domain package now exports runtime schemas, deterministic overlap computation, privacy-safe explanations, exact-version snapshots, explicit confirmation, material-change invalidation, and withdrawal behavior. Shared tests increased to 35.

### Migration and setup impact

No database migration or environment change in this slice.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`
