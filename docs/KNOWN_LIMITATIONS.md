# Known limitations

## Demo-only shortcuts

- The mobile Consent Snapshot screen now runs the real canonical Chapter 3 engine (via `toConsentProfileVersion` and `computeCompatibility`), but both participants are still fixed mock fixtures in `app/data/mockConsentProfiles.ts`, not the signed-in user's actual saved profile versions. Impact: the visible demo proves live two-profile computation, but not live repository integration. Mitigation: all copy labels the flow as mock; the counterpart persona now varies by which mock match was tapped. Removal criterion: typed repository integration backed by RLS-tested profile versions (depends on resolving the Docker/RLS blocker below).
- The legacy Express `/api/consent/overlap` route uses the original POC shape and is now explicitly marked deprecated (`Deprecation: true` response header, `docs/adr/0002-legacy-profile-adapter.md`). Impact: two consent implementations temporarily coexist. Mitigation: `POST /api/consent/compatibility` is canonical for all new Chapter 3+ work and is backed by the documented legacy-profile adapter (`toConsentProfileVersion` in `@litmo/domain`). Removal criterion: no client calls `/overlap`.
- The legacy-profile adapter assumes Chapter 2's touch and consent profile versions always move in lockstep (both written by the same `save_profile_versions` call) and throws if they diverge; it has no way to represent directional receive/offer asymmetry, since Chapter 2 never captured it. Impact: every mapped rule is symmetric (`canReceive: true, canOffer: true`) except hard stops. Removal criterion: a profile-editing UI that captures direction explicitly.

## Security and privacy limitations

- Snapshot fingerprints detect deterministic changes but are not cryptographic signatures. Impact: they must not be treated as tamper-proof evidence. Mitigation: confirmation compares the full canonical fingerprint in the domain. Removal criterion: server-generated cryptographic hashes stored transactionally with immutable snapshots.
- Docker-backed RLS and integration tests remain blocked on this machine. Impact: database isolation is designed but not locally demonstrated. Removal criterion: run the Chapter 2 database suite and obtain green CI.

## Safety limitations

- Consent explanations have not received independent trauma-informed, safeguarding, or legal review. Impact: wording may omit important interpretations. Mitigation: explanations disclose conservative outcomes and never private reasoning. Removal criterion: documented expert and user review.
- Duplicate rules are excluded as contradictory even when duplicates are textually identical. Impact: false exclusions are possible, but no permission is broadened. Removal criterion: canonical input deduplication with tests proving identical duplicates are harmless.

## Release blockers

- Canonical snapshot persistence, participant authorization, database immutability, mobile preview, and server-side confirmation are not implemented yet.
- Chapter 2 Docker/CI blockers remain unresolved.
