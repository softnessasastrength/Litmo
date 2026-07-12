# Task Ledger

Allowed statuses: `pending`, `active`, `blocked`, `completed`, `abandoned`.

Only one task should normally be `active`. Every status change must include a short note.

## Active

### RESUME-001 — Model-portable resumable development workflow

- **Status:** active
- **Owner:** current human or coding agent
- **Goal:** Make long-running repository work resumable across rate limits, context limits, tool failures, interruptions, and model/provider changes.
- **Acceptance criteria:**
  - durable human-readable handoff;
  - machine-readable state;
  - architectural decision log;
  - validation script;
  - CI enforcement;
  - contributor/agent instructions;
  - documented stop and resume procedures.
- **Next action:** Add remaining state files, validator, CI, and documentation.

## Pending

### RESUME-002 — Adopt workflow for future milestones

- **Status:** pending
- **Depends on:** RESUME-001
- **Goal:** Require future implementation milestones to update handoff state at coherent boundaries.

## Blocked

None.

## Completed

None yet.

## Abandoned

None.

## Task template

```md
### ID — Concise title

- **Status:** pending | active | blocked | completed | abandoned
- **Owner:** person or agent
- **Goal:** one clear outcome
- **Depends on:** task IDs or `none`
- **Acceptance criteria:** observable definition of done
- **Verification:** commands and results
- **Notes:** constraints, risks, or handoff details
- **Next action:** exact next step
```
