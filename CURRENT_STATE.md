# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** Model-portable resumable development workflow
- **Status:** active
- **Branch:** `chore/model-portable-workflow`
- **Latest known coherent commit:** Update this after each implementation unit.

## Completed in this milestone

- Created a dedicated branch for the resumable workflow.
- Added the first durable handoff document.

## Work in progress

- Add task tracking, decision records, machine-readable state, validation, CI, and contributor instructions.

## Files changed

- `CURRENT_STATE.md`

## Verification

- **Run:** not yet run
- **Result:** pending until the workflow files and validator are complete

## Unresolved issues

- None known at this boundary.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- No agent may depend on hidden reasoning or prior chat context for continuity.
- Model switches should occur at coherent commit boundaries whenever practical.

## Exact next action

Create `TASKS.md`, `DECISIONS.md`, and `project-state.json`, then add validation and CI integration.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Run `git status`, inspect the current diff, and read recent commits.
3. Verify the last recorded tests before changing code.
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
