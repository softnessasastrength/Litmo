# Architectural Decision Ledger

Record decisions that materially affect architecture, security, privacy, operations, or development workflow.

## ADR-001 — Repository state is the continuity boundary

- **Date:** 2026-07-12
- **Status:** accepted
- **Context:** Long-running work may stop because of rate limits, context exhaustion, tool failures, interruptions, or model/provider changes. Conversational memory is not durable or portable enough to serve as the project record.
- **Decision:** Commits, tests, repository documentation, `CURRENT_STATE.md`, `TASKS.md`, and `project-state.json` are the source of truth for continuation.
- **Alternatives considered:**
  - Depend on prior chat context.
  - Depend on one model/provider's task memory.
  - Use commit messages alone.
- **Consequences:**
  - Any authorized human or coding agent can resume from the repository.
  - Handoffs require explicit updates.
  - Hidden reasoning and undocumented assumptions are not valid dependencies.

## ADR-002 — Resume at coherent commit boundaries

- **Date:** 2026-07-12
- **Status:** accepted
- **Context:** Switching agents during migrations, cryptographic changes, or state-machine edits can create architectural drift or leave unsafe partial work.
- **Decision:** Stop and switch at coherent commit boundaries whenever practical. When that is impossible, preserve the working tree, document partial state precisely, and fail closed for security-sensitive behavior.
- **Consequences:**
  - More frequent focused commits.
  - Safer rollback and review.
  - Explicit documentation of incomplete work.

## ADR-0057 — Device haptics: VCM primary + LRA, Gentle Mode, Soft Signal descent

- **Date:** 2026-07-13
- **Status:** accepted (hardware vision)
- **Context:** Dedicated Litmo hardware needs warm high-fidelity, ND/sensory-first feedback; Soft Signal must feel free/safe, not alarming.
- **Decision:** Wideband VCM primary + LRA secondary; distributed warm field; Soft Signal = long descending warm pulse with Gentle breath-fade; every pattern has Gentle Mode; Sensory-Friendly global + per-pattern presets; canonical spec `docs/HARDWARE/HAPTICS.md`.
- **Consequences:** Device manufacturing is not private-alpha blocking; phone HAPTIC-001 remains shipping path; no ERM-primary Soft Signal.

## ADR template

```md
## ADR-XXX — Title

- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | superseded | rejected
- **Context:** why a decision is required
- **Decision:** what was chosen
- **Alternatives considered:** viable alternatives
- **Consequences:** benefits, costs, risks, and follow-up work
```
