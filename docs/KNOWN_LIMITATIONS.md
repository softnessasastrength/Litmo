# Known limitations

## Demo-only shortcuts

- The current mobile Consent Snapshot still uses synthetic Chapter 1 data rather than the canonical Chapter 3 engine. Impact: the visible demo does not prove live two-profile computation. Mitigation: all copy labels the flow as mock. Removal criterion: typed repository integration backed by RLS-tested profile versions.
- The legacy Express overlap route uses the original POC shape. Impact: two consent implementations temporarily coexist. Mitigation: the new engine is explicitly canonical for Chapter 3 work. Removal criterion: a versioned API migration with compatibility tests.

## Security and privacy limitations

- Snapshot fingerprints detect deterministic changes but are not cryptographic signatures. Impact: they must not be treated as tamper-proof evidence. Mitigation: confirmation compares the full canonical fingerprint in the domain. Removal criterion: server-generated cryptographic hashes stored transactionally with immutable snapshots.
- Docker-backed RLS and integration tests remain blocked on this machine. Impact: database isolation is designed but not locally demonstrated. Removal criterion: run the Chapter 2 database suite and obtain green CI.

## Safety limitations

- Consent explanations have not received independent trauma-informed, safeguarding, or legal review. Impact: wording may omit important interpretations. Mitigation: explanations disclose conservative outcomes and never private reasoning. Removal criterion: documented expert and user review.
- Duplicate rules are excluded as contradictory even when duplicates are textually identical. Impact: false exclusions are possible, but no permission is broadened. Removal criterion: canonical input deduplication with tests proving identical duplicates are harmless.

## Release blockers

- Canonical snapshot persistence, participant authorization, database immutability, mobile preview, and server-side confirmation are not implemented yet.
- Chapter 2 Docker/CI blockers remain unresolved.
