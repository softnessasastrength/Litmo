# Litmo Governance Charter

## Purpose

This charter defines how Litmo is allowed to evolve. It governs human and AI contributors, protects the product's mission, and keeps authority, accountability, and project memory inside the repository.

> If every current contributor disappeared tomorrow, a competent engineer should be able to continue Litmo from the repository alone.

## Mission

Litmo exists to help consenting adults understand, negotiate, and practice safe, non-sexual, platonic physical connection.

Growth, engagement, speed, novelty, and convenience never take precedence over consent, safety, privacy, accessibility, or human dignity.

## Constitutional principles

1. Consent is explicit, specific, current, informed, and revocable.
2. Trust, compatibility, identity, history, verification, or learning completion never imply consent or safety.
3. Safety logic is product logic.
4. Privacy and data minimization are defaults.
5. Accessibility is a core product requirement.
6. Technology should reduce ambiguity without replacing human judgment or communication.
7. Documentation is part of implementation.
8. The repository is Litmo's institutional memory.
9. No contributor may silently weaken a constitutional principle.
10. AI contributors implement approved policy; they do not define product philosophy or governance.

## Authority

The founder retains final authority over:

- mission and philosophy;
- governance and amendments;
- consent and trust semantics;
- safety posture;
- privacy boundaries;
- public claims and legal or clinical positioning;
- roadmap promotion and release authorization.

Contributors may make conservative implementation decisions within an approved task. They may not reinterpret the mission or expand their own authority.

## Separation of powers

Whenever practical, the same contributor should not exclusively:

1. define a sensitive policy;
2. implement it;
3. approve it;
4. merge or release it.

GitHub pull requests, reviews, CI, ADRs, and explicit human approval provide separation between proposal, implementation, verification, and authorization.

## Protected change categories

The following require explicit human approval and documented reasoning before merge:

- consent semantics or lifecycle;
- emergency stop, withdrawal, blocking, reporting, or moderation;
- trust, reputation, verification, matching, or eligibility;
- authentication, encryption, secrets, or identity architecture;
- sensitive data collection, retention, sharing, deletion, or analytics;
- legal, medical, therapeutic, or safety claims;
- engagement incentives, ranking, scoring, or recommendation systems;
- public APIs, third-party data sharing, or production integrations;
- amendments to governance or constitutional principles.

## Change control

Material changes must use a pull request and include:

- the problem and intended outcome;
- affected users and data;
- safety, privacy, accessibility, and abuse implications;
- tests and exact verification results;
- documentation updates;
- an ADR when the decision is architectural, policy-sensitive, difficult to reverse, or likely to constrain future work.

Direct changes to `main` should be limited to urgent, low-risk repository repair and must remain fully auditable.

## AI contributor status

AI systems are contributors, not authorities or accountable legal actors. Their output must remain reviewable, attributable through Git history, reversible, and subject to the same standards as human work.

No AI output is trusted merely because it is detailed, confident, lengthy, or produced by a particular vendor or model.

## Operational memory

No critical project intent may exist only in a private conversation, temporary prompt, model memory, or one person's recollection. Decisions must be recorded in the appropriate durable artifact:

- governance for authority and principles;
- ADRs for durable decisions;
- roadmap documents for approved direction;
- `TASKS.md` for active work;
- `project-state.json` for machine-readable continuity;
- completion reports, changelog, and known limitations for historical memory.

## Conflicts

When documents conflict, use this precedence unless an explicit later amendment says otherwise:

1. this governance charter and `PRINCIPLES.md`;
2. approved ADRs and safety specifications;
3. active task and roadmap authorization;
4. implementation documentation;
5. code comments and informal notes.

A conflict must be surfaced and resolved explicitly. Contributors must not silently choose the less protective interpretation.

## Amendments

Governance changes require the process in `AMENDMENT_PROCESS.md`. No autonomous agent may amend governance solely to make an implementation easier.
