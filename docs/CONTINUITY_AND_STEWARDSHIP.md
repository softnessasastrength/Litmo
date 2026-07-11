# Litmo Continuity and Stewardship

## Purpose

Litmo must be understandable, operable, and governable without access to its founder, its original coding assistant, or any private conversation that contributed to the project.

The repository is the durable source of project intent.

## Stewardship principle

The founder originates the vision and currently holds decision authority, but the mission must be able to outlive any individual steward.

Litmo is therefore treated as a stewarded project rather than a personality-dependent artifact.

## Continuity requirements

The project must preserve, in the repository:

- Mission and non-goals
- Product invariants
- Consent and safety philosophy
- Architecture and data contracts
- Decision history through ADRs
- Setup, build, test, release, and recovery procedures
- Governance and succession expectations
- Licensing and ownership status
- Known limitations and unresolved risks
- Current roadmap position
- A clear next action for maintainers and coding agents

No critical project knowledge may exist only in:

- A founder's memory
- Private chat logs
- A single vendor account
- An undocumented hosted service
- An LLM-specific prompt
- An untracked local machine

## Vendor independence

The project must not depend conceptually on OpenAI, Codex, ChatGPT, or any single model provider.

Coding agents are replaceable implementation partners. The repository must provide enough context for a competent human developer or a different LLM to continue the work.

Agent instructions must use plain language, repository-relative paths, explicit acceptance criteria, and verifiable commands.

## Founder unavailability

If the founder is unavailable, future stewards should:

1. Preserve the product invariants and safety constraints.
2. Read `AGENTS.md`, `README.md`, roadmap files, ADRs, and completion reports.
3. Avoid expanding scope until the current chapter is complete and documented.
4. Never weaken consent, privacy, or moderation safeguards for growth or convenience.
5. Record all material decisions in the repository.
6. Resolve ownership, licensing, infrastructure access, and governance before public release.

## Canonical sources

When sources disagree, use this order unless a later ADR explicitly changes it:

1. Applicable law and platform requirements
2. Product invariants in `docs/roadmap/README.md`
3. Accepted ADRs
4. Current chapter specification
5. `AGENTS.md`
6. Implementation code
7. Historical notes and discussions

Code that contradicts a documented invariant is a defect, not a silent policy change.

## Succession work still required

Before Litmo becomes operationally important, create and maintain:

- `GOVERNANCE.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- A selected software license
- Maintainer and succession policy
- Infrastructure ownership inventory
- Credential and domain recovery procedures
- Release signing and artifact recovery procedures
- Data-controller and legal-entity documentation

These materials must not contain live secrets.

## Core standard

> The project must outlive the assistant that helped build it, and it must be capable of outliving its founder without losing its purpose.
