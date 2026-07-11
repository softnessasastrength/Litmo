# Litmo Documentation Standard

Documentation is part of the product and part of the definition of done.

A change is incomplete when the code works but the repository no longer explains what the system does, why it does it, how to run it, or what risks remain.

## Core rule

For every meaningful architectural, product, data, safety, or implementation decision, document:

- What changed
- Why it changed
- Alternatives considered
- Tradeoffs
- Assumptions
- Known limitations
- Follow-up work
- Differences among local, demo, staging, and production behavior

Documentation must be maintained continuously while coding. Do not defer it to a final cleanup pass.

## Required living documents

Keep these current whenever relevant:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/SECURITY_MODEL.md`
- `docs/DATA_CLASSIFICATION.md`
- `docs/CONSENT_FLOW.md`
- `docs/TRUST_SYSTEM.md`
- `docs/DECISIONS.md`
- `docs/CHANGELOG.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/roadmap/`
- `docs/adr/`

Create missing files when the first relevant change requires them.

## Architecture Decision Records

Use `docs/adr/NNNN-short-decision-name.md` for substantial decisions.

Examples:

- `0001-use-expo-router.md`
- `0002-version-consent-profiles.md`
- `0003-separate-demo-data-from-production.md`

Each ADR must include:

1. Title
2. Status
3. Date
4. Context
5. Decision
6. Alternatives considered
7. Consequences
8. Follow-up work

Do not rewrite accepted ADR history to make past decisions look cleaner. Supersede an ADR with a new one when a decision changes.

## Mandatory update triggers

Update documentation in the same workstream whenever any of the following changes:

### Commands and environment

- A command is added, removed, renamed, or changes behavior.
- An environment variable is added, removed, renamed, changes default, or changes sensitivity.
- Setup requires a new prerequisite or manual step.
- A clean-clone workflow changes.

Document exact commands, working directories, prerequisites, expected results, and common failure modes.

### Data and database

- A table, column, view, function, policy, event, or migration is added or changed.
- Data ownership or visibility changes.
- Retention, deletion, export, or migration behavior changes.

Document purpose, owner, readers, writers, sensitivity, retention, deletion behavior, and RLS/security assumptions.

### User-facing behavior

- A screen, route, state, transition, error state, or recovery path changes.
- Copy changes the meaning of consent, trust, safety, identity, reporting, or moderation.
- Demo behavior differs from production intent.

Document the happy path, empty state, loading state, validation failure, network failure, permission failure, unexpected failure, recovery behavior, accessibility behavior, and analytics implications.

### Safety-sensitive behavior

- Consent logic, matching, session activation, session ending, trust signals, reporting, blocking, moderation, identity, or location behavior changes.

Document:

- Threat and abuse cases
- Conservative fallback behavior
- False-positive and false-negative risks
- What the feature does not guarantee
- Human review requirements
- Unresolved legal, safeguarding, clinical, or privacy questions

## Writing rules

- Never knowingly leave documentation stale.
- Never claim behavior was tested unless the test was actually run.
- Use exact language instead of “should work.”
- Mark incomplete features plainly.
- Keep examples copy-pasteable.
- Prefer state tables, flow diagrams, schemas, and concrete examples over vague prose.
- Explain acronyms at first use.
- Link related documents rather than duplicating long sections that will drift.
- Date baseline and completion reports.
- Include commit or version references when they improve traceability.

## TODO standard

Unexplained TODOs are prohibited.

Every TODO must include:

- Context
- Intended outcome
- Why it is not completed now
- Whether it blocks demo, alpha, beta, or production release
- A tracking issue or named follow-up document when practical

Example:

```ts
// TODO(alpha-blocker): Replace the in-memory demo adapter with the typed
// Supabase repository after RLS integration tests exist. See docs/KNOWN_LIMITATIONS.md.
```

## Changelog standard

`docs/CHANGELOG.md` records material product and engineering changes in chronological order.

Each entry should include:

- Date
- Summary
- User-visible impact
- Developer impact
- Migration or setup impact
- Related ADR or roadmap chapter

Do not use the changelog as a raw commit dump.

## Known limitations standard

`docs/KNOWN_LIMITATIONS.md` must distinguish:

- Demo-only shortcuts
- Security limitations
- Privacy limitations
- Safety and moderation limitations
- Accessibility limitations
- Reliability limitations
- Platform limitations
- Release blockers

Each limitation must state impact, affected users or environments, current mitigation, and removal criteria.

## Completion report standard

Before ending a substantial assignment, create or update the applicable completion report with:

1. What existed before the work
2. What changed
3. Major decisions
4. Alternatives and tradeoffs
5. Every materially changed file
6. Commands run
7. Exact command results
8. Tests added
9. Passing tests
10. Failing or skipped tests and why
11. Known limitations
12. Security implications
13. Data-handling implications
14. User-facing launch or verification instructions
15. Remaining blockers
16. Recommended next task

## Quality bar

A competent developer who did not participate in the work must be able to understand:

- What Litmo is
- How it is structured
- Why major decisions were made
- How to run and test it
- Which behavior is real, mocked, seeded, or unfinished
- Which safety and privacy guarantees exist
- Which guarantees do not exist
- How to continue the work without relying on undocumented context

If the code disappeared but the documentation remained, another developer should still understand the intended system well enough to reconstruct its major behavior.