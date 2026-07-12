# Development Workflow

Litmo uses repository-based continuity so work can survive model changes, rate limits, interruptions, and human handoffs.

## Source of truth

The repository, commits, tests, ADRs, and documentation are authoritative. No critical project intent may exist only in a private conversation or model context.

## Handoff files

- `CURRENT_STATE.md` — human-readable active state
- `TASKS.md` — prioritized durable task ledger
- `DECISIONS.md` — significant workflow and architecture decisions
- `project-state.json` — machine-readable state

## Work cycle

1. Read the handoff files and relevant documentation.
2. Inspect Git status, branch, diff, and recent commits.
3. Identify the next unmet acceptance criterion.
4. Implement one safe, coherent unit.
5. Update tests and documentation.
6. Run the relevant checks.
7. Commit the coherent change.
8. Update the handoff state before stopping.

## Model or developer switch

A replacement developer or coding agent must verify existing work before continuing and must not silently reinterpret earlier decisions.

Switch at a coherent commit boundary whenever practical.

## Stop procedure

Before stopping because of a rate limit, context limit, tool failure, interruption, or provider switch:

- preserve working changes;
- run practical verification;
- record exact results and failures;
- commit coherent completed work;
- update the handoff files;
- state whether the working tree is clean;
- record the exact next action.

## Quality rules

- Never weaken tests merely to make CI green.
- Never claim a command passed unless it was actually run.
- Never commit secrets or real sensitive user data.
- Keep the repository usable after every coherent commit.
- Documentation is part of implementation, not optional cleanup.