# Litmo Documentation Map

This map identifies which documents are authoritative, which preserve historical completion evidence, and which describe future intent. It exists to prevent an old chapter plan or completion report from being mistaken for current execution state.

## Read first

1. [`README.md`](../README.md) — current public repository overview.
2. [`CURRENT_STATE.md`](../CURRENT_STATE.md) — current handoff, priorities, risks, and exact next-action rule.
3. [`TASKS.md`](../TASKS.md) — prioritized execution ledger and task status.
4. [`FEATURE_SWARM_TRACKER.md`](FEATURE_SWARM_TRACKER.md) — five-stream product swarm status (TL, safety, proximity, learning, hardware).
5. [`NUCLEAR_SWARM.md`](NUCLEAR_SWARM.md) — six-agent maximum-ambition command center.
6. [`CONSTITUTION_ENFORCEMENT.md`](CONSTITUTION_ENFORCEMENT.md) — Living Constitution → code/tests map.
7. [`project-state.json`](../project-state.json) — machine-readable handoff validated by `npm run state:check`.
8. [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) — unresolved product, safety, technical, and operational limits.

When these disagree, stop and reconcile them before implementing new work.

## Governing product intent

These documents define why Litmo exists and the principles that outrank implementation convenience:

- **[`EXORCISM_MANIFESTO.md`](EXORCISM_MANIFESTO.md)** — **primary framing**: private Trauma-to-Code Exorcism Dojo (not a product)
- **[`DOJO_GUIDELINES.md`](DOJO_GUIDELINES.md)** — how to work in this repo (radical honesty)
- **[`DOJO_CONTINUE.md`](DOJO_CONTINUE.md)** — what “continue” means under dojo law (not product milestones)
- **[`LOGICAL_EXTREME.md`](LOGICAL_EXTREME.md)** — full control tower, theorems T1–T12, D01–D24, burn gates
- **[`BURN_PROTOCOL.md`](BURN_PROTOCOL.md)** — how to graduate / release the artifact
- **[`exorcism-inventory.json`](exorcism-inventory.json)** — machine-readable defense inventory for agents
- **[`TRAUMA_ARCHITECTURE.md`](TRAUMA_ARCHITECTURE.md)** — systems mapped to defenses / wounds
- [`philosophy/00_Founding_Thesis.md`](philosophy/00_Founding_Thesis.md) — founding thesis (now subordinate residue + living consent language)
- [`philosophy/VISION_2030.md`](philosophy/VISION_2030.md) — fifty-year cultural horizon (subordinate to Constitution)
- [`LITMO_CONSTITUTION.md`](LITMO_CONSTITUTION.md) — binding articles 0–XV (`litmo-constitution-v2`)
- Root [`CONSTITUTION.md`](../CONSTITUTION.md) — human charter twin
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
- [`LOCAL_SHARE.md`](LOCAL_SHARE.md) — AirDrop-style Multipeer nearby share (profiles / snapshot review)
- [`PROXIMITY_LAYER.md`](PROXIMITY_LAYER.md) — opt-in anonymous radar, handshake, identity gates, Soft Signal
- [`NFC_FEATURES.md`](NFC_FEATURES.md) — NFC tag careful-connect, post-tap consent, QR/manual fallback
- [`PRIVACY_POLICY_DRAFT.md`](PRIVACY_POLICY_DRAFT.md)
- [`AUTHENTICATION.md`](AUTHENTICATION.md) — canonical passkey auth architecture (WebAuthn + Edge rate/audit + device-bound consent)
- [`PASSKEY_AUTHENTICATION.md`](PASSKEY_AUTHENTICATION.md) — deployment detail and threat model for passkeys
- [`SENSITIVE_DATA_ENCRYPTION.md`](SENSITIVE_DATA_ENCRYPTION.md)
- [`CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md`](CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md)
- [`LEARNING_SYSTEM.md`](LEARNING_SYSTEM.md)
- [`TOUCH_LANGUAGE.md`](TOUCH_LANGUAGE.md) — full Touch Language map (local save + encrypted partner share)
- [`CONSENT_SNAPSHOT_SYSTEM.md`](CONSENT_SNAPSHOT_SYSTEM.md) — pre-session declaration + mutual seal (Soft Signal, safewords, aftercare)
- [`CONSENT_MICROINTERACTIONS.md`](CONSENT_MICROINTERACTIONS.md) — Apple-level consent timing, weight, catalog, phase machines
- [`CONTINUOUS_CONSENT_SYSTEM.md`](CONTINUOUS_CONSENT_SYSTEM.md) — continuous granular revocable consent (states, L0–L8, check-ins, session architecture)
- [`ONBOARDING_CONSENT_FLOW.md`](ONBOARDING_CONSENT_FLOW.md) — first-open onboarding consent flow (frame-by-frame, every control)
- [`CODE_COMMENT_STANDARD.md`](CODE_COMMENT_STANDARD.md) — mandatory in-code WHAT/WHY/CONSENT/EDGE/NEVER documentation bar
- [`BUILD_MODES.md`](BUILD_MODES.md) — Maximum vs App Store Safe dual-mode operator manual (ADR 0060)
- [`DUAL_MODE_ARCHITECTURE.md`](DUAL_MODE_ARCHITECTURE.md) — full folder tree, SPM, flags, consent flows by mode
- [`DUAL_MODE_16_AGENT_SWARM.md`](DUAL_MODE_16_AGENT_SWARM.md) — 16-role swarm synthesis: gaps, backlog, flow matrix
- [`SOFT_SIGNAL.md`](SOFT_SIGNAL.md) — Soft Signal product system (app, hardware contract, private log)
- [`LOCAL_FIRST.md`](LOCAL_FIRST.md) — local-first personal vault + optional encrypted cloud backup
- [`TRAUMA_INFORMED_SAFETY.md`](TRAUMA_INFORMED_SAFETY.md) — panic, quick exit, timeout, verification, reflection
- [`HARDWARE/HAPTICS.md`](HARDWARE/HAPTICS.md) — **canonical** dedicated-device haptics (VCM primary, Gentle Mode, Soft Signal warm descent, ND/sensory)
- [`HAPTIC_SYSTEM_DEVICE.md`](HAPTIC_SYSTEM_DEVICE.md) — pointer to `HARDWARE/HAPTICS.md`

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

- [`HARDWARE/DEVICE_OS.md`](HARDWARE/DEVICE_OS.md) — **Litmo Device OS**: single-purpose OS from power-on to shutdown (not a shipping OS)
- [`HARDWARE_DEVICE_EXPERIENCE.md`](HARDWARE_DEVICE_EXPERIENCE.md) — product experience narrative for a dedicated Litmo hardware device (not a shipping program)
- [`HARDWARE/HAPTICS.md`](HARDWARE/HAPTICS.md) — Soft Edge multi-modal haptics for dedicated hardware
- [`../ROADMAP.md`](../ROADMAP.md) — concise current status and explicitly deferred work.
- [`roadmap/README.md`](roadmap/README.md) — detailed chapter sequence and planning documents.
- [`TODO.md`](TODO.md) — future work not necessarily authorized.
- [`AI_COMPANION_ROADMAP.md`](AI_COMPANION_ROADMAP.md) — future AI-companion intent and safeguards.
- [`SAFETY_OPS_DESIGN.md`](SAFETY_OPS_DESIGN.md) — draft proposal for SAFETY-OPS-001 (moderation/beta-ops design); explicitly not approved policy or implementation authorization until founder/safety review.
- [`SAFETY_OPS_FOUNDER_DECISIONS.md`](SAFETY_OPS_FOUNDER_DECISIONS.md) — founder decision worksheet for SAFETY-OPS-001; records options and review gates but does not authorize Chapter 6 implementation.
- [`SAFETY_OPS_RUNTIME.md`](SAFETY_OPS_RUNTIME.md) — runtime ground truth for queue, reports, appeals, restrictions, rate limits, trust ledger, HITL permanent ban, Constitution map (ADR 0061).
- ADR 0062 — nuclear session lifecycle + Consent Snapshot machine (`sessionConsentNuclear`, migration 043).
- [`NEURODIVERGENT_MODE.md`](NEURODIVERGENT_MODE.md) — v3 second-level accommodations (sensory, motion, haptics, language, overload exits); demo-strength defaults.
- [`HAPTIC_LANGUAGE.md`](HAPTIC_LANGUAGE.md) — composable semantic haptic grammar (curves, rhythm, interrupts); ADR 0063.

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
