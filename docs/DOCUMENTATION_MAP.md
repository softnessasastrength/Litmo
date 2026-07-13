# Litmo Documentation Map

This map identifies which documents are authoritative, which preserve historical completion evidence, and which describe future intent. It exists to prevent an old chapter plan or completion report from being mistaken for current execution state.

## Read first

1. [`README.md`](../README.md) — current public repository overview.
2. [`CURRENT_STATE.md`](../CURRENT_STATE.md) — current handoff, priorities, risks, and exact next-action rule.
3. [`TASKS.md`](../TASKS.md) — prioritized execution ledger and task status.
4. [`project-state.json`](../project-state.json) — machine-readable handoff validated by `npm run state:check`.
5. [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) — unresolved product, safety, technical, and operational limits.

When these disagree, stop and reconcile them before implementing new work.

## Governing product intent

These documents define why Litmo exists and the principles that outrank implementation convenience:

- [`philosophy/00_Founding_Thesis.md`](philosophy/00_Founding_Thesis.md)
- [`LITMO_CONSTITUTION.md`](LITMO_CONSTITUTION.md)
- [`CONCEPT.md`](CONCEPT.md)
- [`../documents/GOVERNANCE.md`](../documents/GOVERNANCE.md)
- [`../documents/DESIGN_PRINCIPLES.md`](../documents/DESIGN_PRINCIPLES.md)
- [`../documents/UX_UI_PHILOSOPHY.md`](../documents/UX_UI_PHILOSOPHY.md)

A change that conflicts with these documents requires an explicit product/governance decision, not a silent code edit.

## Current system behavior

Use these documents when modifying or reviewing implemented behavior:

- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`CONSENT_FLOW.md`](CONSENT_FLOW.md)
- [`TRUST_SYSTEM.md`](TRUST_SYSTEM.md)
- [`SECURITY_MODEL.md`](SECURITY_MODEL.md)
- [`DATA_CLASSIFICATION.md`](DATA_CLASSIFICATION.md)
- [`GDPR.md`](GDPR.md) — engineering GDPR alignment (not certified legal compliance)
- [`ISO27701.md`](ISO27701.md) — ISO/IEC 27701 PIMS roadmap for a small team
- [`PRIVACY_POLICY_DRAFT.md`](PRIVACY_POLICY_DRAFT.md)
- [`PASSKEY_AUTHENTICATION.md`](PASSKEY_AUTHENTICATION.md)
- [`SENSITIVE_DATA_ENCRYPTION.md`](SENSITIVE_DATA_ENCRYPTION.md)
- [`CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md`](CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md)
- [`LEARNING_SYSTEM.md`](LEARNING_SYSTEM.md)
- [`RELEASE_AND_TESTFLIGHT.md`](RELEASE_AND_TESTFLIGHT.md)
- [`PHYSICAL_BETA_WALKTHROUGH.md`](PHYSICAL_BETA_WALKTHROUGH.md) — founder/private on-device checklist (not external TestFlight)
- [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md)
- [`MACHINE_SETUP.md`](MACHINE_SETUP.md)

For security-critical behavior, the code, migrations, database policies, and tests must agree with the documentation. Documentation alone is not proof of enforcement.

## Architecture Decision Records

The files under [`adr/`](adr/) record material decisions and their tradeoffs. Read the relevant ADR before altering authentication, consent, session transitions, withdrawal, encryption, realtime behavior, or release configuration.

ADRs are historical decisions. If implementation has superseded an ADR, add a new ADR rather than rewriting history without explanation.

## Completion reports

Files such as `CHAPTER_2_COMPLETION.md` and `CHAPTER_3_COMPLETION.md` preserve what was completed and what was verified at a specific point in time.

Completion reports are evidence, not current task assignments. Do not use their “next task” sections when `CURRENT_STATE.md` or `TASKS.md` has moved forward.

## Roadmaps and future intent

- [`../ROADMAP.md`](../ROADMAP.md) — concise current status and explicitly deferred work.
- [`roadmap/README.md`](roadmap/README.md) — detailed chapter sequence and planning documents.
- [`TODO.md`](TODO.md) — future work not necessarily authorized.
- [`AI_COMPANION_ROADMAP.md`](AI_COMPANION_ROADMAP.md) — future AI-companion intent and safeguards.
- [`SAFETY_OPS_DESIGN.md`](SAFETY_OPS_DESIGN.md) — draft proposal for SAFETY-OPS-001 (moderation/beta-ops design); explicitly not approved policy or implementation authorization until founder/safety review.
- [`SAFETY_OPS_FOUNDER_DECISIONS.md`](SAFETY_OPS_FOUNDER_DECISIONS.md) — founder decision worksheet for SAFETY-OPS-001; records options and review gates but does not authorize Chapter 6 implementation.

A roadmap item is not implementation authorization. It becomes active only when recorded as `active` in `TASKS.md` and reflected in `CURRENT_STATE.md` and `project-state.json`.

## Wiki

The `wiki/` directory contains publish-ready GitHub Wiki source. It is a navigable summary, not the authoritative specification. When the wiki conflicts with repository documentation, the repository documents listed above win and the wiki should be refreshed.

## Maintenance rule

Every meaningful implementation change should update, as applicable:

- `CURRENT_STATE.md`;
- `TASKS.md`;
- `project-state.json`;
- `CHANGELOG.md`;
- `KNOWN_LIMITATIONS.md`;
- architecture or security documentation;
- relevant ADRs;
- release and setup instructions;
- wiki summaries when externally visible behavior changes.

Never leave a critical product or safety decision only in a model prompt, private conversation, PR description, or commit message.
