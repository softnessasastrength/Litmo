# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** Model-portable resumable development workflow
- **Status:** completed
- **Branch:** `chore/model-portable-workflow`
- **Latest known coherent commit:** `d5c9643ee6076e01f1959d64a263211ccfd5bb99`

## Completed in this milestone

- Added `CURRENT_STATE.md` as the human-readable handoff.
- Added `TASKS.md` as the durable task ledger.
- Added `DECISIONS.md` for workflow-level architectural decisions.
- Added `project-state.json` and its JSON Schema.
- Added `scripts/validate-project-state.mjs`.
- Added `npm run state:check`.
- Added GitHub Actions enforcement for pull requests and pushes to `main`.
- Confirmed the existing `AGENTS.md` already establishes the repository as the source of truth and requires coherent commits, documentation, and verification.

## Work in progress

None in this milestone.

## Files changed

- `CURRENT_STATE.md`
- `TASKS.md`
- `DECISIONS.md`
- `project-state.json`
- `docs/project-state.schema.json`
- `scripts/validate-project-state.mjs`
- `.github/workflows/project-state.yml`
- `package.json`

## Verification

- **Run:** GitHub file-level validation and schema/script review completed.
- **Not run locally:** `npm run state:check` and the full repository test suite were not executable through the GitHub file connector.
- **Expected CI:** the new `Project State` workflow will run `npm ci` and `npm run state:check` on the pull request.

## Unresolved issues

- CI must confirm the validator against a clean checkout.
- The workflow does not attempt to prove that every semantic detail in the Markdown handoff is current; it validates required structure and machine-readable fields.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- No agent may depend on hidden reasoning or prior chat context for continuity.
- Model switches should occur at coherent commit boundaries whenever practical.
- Security-sensitive partial work must fail closed and be explicitly documented.

## Exact next action

Open and review the pull request. Confirm the `Project State` GitHub Actions check passes, then merge when satisfied.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Run `git status`, inspect the current diff, and read recent commits.
3. Verify the last recorded checks before changing code.
4. Continue only from the exact next action above unless new evidence requires a documented change.

## Stop checklist

Before stopping because of a rate limit, context limit, tool failure, interruption, or model switch:

1. Stop at the safest coherent boundary available.
2. Preserve all working changes.
3. Run all practical checks and record the exact results.
4. Commit coherent completed work.
5. Update this file and `project-state.json`.
6. State whether the working tree is clean.
7. Record the exact next command or action required to resume.
