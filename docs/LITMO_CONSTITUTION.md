# The Litmo Constitution

## Preamble

Litmo exists to help consenting adults communicate about safe, non-sexual, platonic physical connection with clarity, dignity, and control.

This constitution defines the principles that outrank convenience, growth, engagement, aesthetics, and speed. Product decisions, code changes, experiments, moderation systems, and AI-assisted contributions must be evaluated against it.

When requirements conflict, this document governs unless it is deliberately amended through the process below.

## Article I — Consent is active, specific, and revocable

1. Consent is never inferred from a match, profile, prior interaction, silence, familiarity, or reputation.
2. Consent applies to a specific person, context, action, duration, and moment.
3. A person may change or withdraw consent at any time without explanation.
4. Litmo must make stopping easier than continuing.
5. No feature may punish, shame, pressure, rank, or disadvantage a user for declining, pausing, or ending an interaction.
6. Where two preferences differ, the more restrictive boundary governs.

## Article II — Safety logic is product logic

1. Safety may not be reduced to warning copy, terms of service, or a settings page.
2. Safety-critical rules must be represented in the product flow, data model, authorization layer, and tests.
3. A feature that increases engagement but weakens informed consent must not ship.
4. Trust indicators may summarize history, but must never certify that a person is safe.
5. Reports involving harm, coercion, or discomfort require careful human review; automated punishment must not substitute for judgment.
6. Emergency, clinical, and law-enforcement functions must never be implied unless Litmo actually provides them.

## Article III — Privacy is the default state

1. User data is private unless the user takes a clear, specific action to share it.
2. Logs, boundaries, preferences, relationship data, and safety records must never be public by default.
3. Sharing must identify exactly what is shared, with whom, for how long, and with what permissions.
4. Authentication secrets, private logs, and sensitive metadata must never be written to analytics, crash logs, or ordinary application logs.
5. Litmo must minimize collection. Data that is not necessary should not be collected.
6. Users must be able to understand, export, and delete their data.
7. Local privacy protections and server-side authorization are separate requirements; neither may be treated as a substitute for the other.

## Article IV — The user retains agency

1. Litmo assists decisions; it does not make intimate decisions for people.
2. Recommendations must remain explainable and dismissible.
3. Dark patterns, artificial urgency, manipulative streaks, and engagement traps are prohibited.
4. Users must be able to leave a flow, cancel a request, block another user, and end a session without unnecessary friction.
5. Defaults must favor caution, clarity, and reversibility.
6. No score, badge, algorithm, or AI output may override an explicit human boundary.

## Article V — Inclusion without assumption

1. Litmo must not assume gender, sexuality, relationship structure, disability status, trauma history, communication style, or physical ability.
2. Accessibility is a core requirement, not a polish phase.
3. Language should be direct, nonjudgmental, and understandable under stress.
4. Users must be able to express boundaries without needing clinical, legal, or identity-specific vocabulary.
5. Product design must account for users who communicate, process, move, see, hear, or regulate differently.

## Article VI — Identity and authentication must protect, not burden

1. Litmo should avoid passwords where stronger, simpler platform-native authentication is available.
2. Authentication must not require unnecessary disclosure of a user’s legal name, email address, contacts, or identity documents.
3. Account recovery must be designed before authentication becomes mandatory.
4. A lost device, deleted passkey, or changed credential provider must not silently create a duplicate identity.
5. Face ID, Touch ID, or device passcode may protect local access, but must never be mistaken for server authorization.
6. Security-sensitive changes require isolated branches, explicit review, and real-device testing before merge.

## Article VII — Build conservatively around irreversible harm

1. Features that create social exposure, location risk, coercion risk, or irreversible disclosure require a higher standard of evidence and testing.
2. Private single-user functionality should become stable before shared or social functionality expands.
3. Synthetic data and demo mode must be clearly distinguished from real accounts and real interactions.
4. Experimental features must fail closed when safety or authorization state is uncertain.
5. No production feature may depend on an undocumented assumption about identity, consent, ownership, or access control.

## Article VIII — Technical integrity

1. `main` represents the known-good integration state and must not be used as a scratchpad.
2. Meaningful work occurs on purpose-specific branches and enters `main` through reviewable pull requests.
3. Security, consent, authorization, and data-isolation behavior must be covered by automated tests where practical.
4. Secrets must never be committed to the repository.
5. Migrations must be reversible or accompanied by a documented recovery plan.
6. Documentation must change when architecture, safety behavior, or user-visible guarantees change.
7. A passing build is necessary but not sufficient; critical flows must also be exercised on real devices and accounts.

## Article IX — AI-assisted work remains accountable human work

1. AI tools may propose, draft, refactor, test, and document work, but may not define Litmo’s values by accident.
2. Generated code must be reviewed against this constitution, not merely accepted because it compiles.
3. AI-generated claims about security, privacy, medicine, law, or platform policy must be verified before they are relied upon.
4. Prompts and agent instructions should preserve context, explain constraints, and prohibit silent weakening of safety rules.
5. When an AI system is uncertain, it should surface the uncertainty rather than fabricate confidence.
6. Responsibility for what ships remains with the humans maintaining Litmo.

## Article X — Honest communication

1. Litmo must accurately describe what it does and does not provide.
2. Prototype, beta, synthetic, experimental, and production states must not be blurred.
3. Marketing must not promise safety, healing, compatibility, or outcomes that the system cannot guarantee.
4. Errors should be understandable and should not conceal loss of data, failed authorization, or degraded protection.
5. Material security or privacy incidents must be documented and addressed transparently.

## Decision test

Before shipping a meaningful change, reviewers should be able to answer:

1. Does this preserve explicit, revocable consent?
2. Is the safest reasonable default being used?
3. Is private data still private by default?
4. Can the user understand and reverse the action?
5. Does authorization hold for two different users and two different devices?
6. Could this pressure, expose, mislead, or strand someone?
7. Are the failure states safe and visible?
8. Is the behavior documented and tested?

A “no” or “uncertain” answer blocks release until resolved or explicitly accepted through documented review.

## Amendment process

This constitution may evolve, but not casually.

An amendment requires:

1. A dedicated branch and pull request.
2. A written explanation of the problem being solved.
3. Identification of which user protections become stronger, weaker, or different.
4. Review against existing consent, privacy, security, and trust documentation.
5. No unrelated implementation changes in the same amendment commit.

Core protections concerning explicit consent, revocability, private-by-default data, user agency, and honest representation may not be weakened merely to improve growth, retention, monetization, or implementation convenience.

## Precedence

When this constitution conflicts with a roadmap, ticket, prompt, generated plan, design mockup, implementation shortcut, or business objective, the constitution takes precedence until intentionally amended.
