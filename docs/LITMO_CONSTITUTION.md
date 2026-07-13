# The Litmo Constitution

**Version:** `litmo-constitution-v2`  
**Status:** binding product and ethical authority  
**Spiritual companions:** root [`CONSTITUTION.md`](../CONSTITUTION.md) · [`philosophy/00_Founding_Thesis.md`](philosophy/00_Founding_Thesis.md) · [`philosophy/VISION_2030.md`](philosophy/VISION_2030.md)  
**Enforcement map:** [`CONSTITUTION_ENFORCEMENT.md`](CONSTITUTION_ENFORCEMENT.md)  
**Machine pin:** `@litmo/domain` → `CONSTITUTION_VERSION`

> Touch is not a transaction — it is a language.  
> Consent is not a checkbox — it is a living, versioned, enforceable grammar.  
> Softness is not weakness — it is how civilizations stay humane under pressure.

## Preamble

Litmo exists to help consenting adults communicate about safe, non-sexual, platonic physical connection with clarity, dignity, and control.

This constitution defines the principles that outrank convenience, growth, engagement, aesthetics, speed, venture fashion, and model convenience. Product decisions, code changes, experiments, moderation systems, cultural partnerships, research collaborations, and AI-assisted contributions must be evaluated against it.

When requirements conflict, **this document governs** unless it is deliberately amended through the process below.

Litmo aspires not merely to ship an app, but to help **define consent culture for decades**: a world in which adults can name needs for touch without shame, negotiate boundaries without clinical fluency, stop without punishment, and treat one another’s nervous systems as sacred ground rather than engagement inventory.

This document is **living**: versioned, enforceable in product logic, and amendable only by process that preserves core human protections.

---

## Founding thesis (constitutional brief)

Full thesis: [`philosophy/00_Founding_Thesis.md`](philosophy/00_Founding_Thesis.md).

1. Loneliness lives in the body as well as the mind.  
2. Adults lack shared grammar for platonic touch.  
3. Where grammar is missing, assumption fills the void — and assumption is where harm begins.  
4. Touch has grammar: pressure, duration, zone, modality, environment, intention, time, and stop.  
5. Litmo builds that grammar into product infrastructure — not into slogans.

---

## Article 0 — Living constitutional authority

1. This constitution is **versioned**. The machine-readable pin is `CONSTITUTION_VERSION` in `@litmo/domain`. Human-readable version is the header of this file.
2. **Consent is a living language.** Vocabulary (zones, pressure, Soft Signal, seal fingerprints, continuous state) may grow only through documented product law, ADRs, and tests — never by silent UI invention.
3. **Consent is enforceable.** Safety-critical rules must appear in data models, state machines, authorization, and automated tests — not only in marketing or help centers.
4. **Consent is session-specific and time-bound.** A prior seal, vibe, match, or reputation never re-authorizes touch.
5. **Revocation is instantaneous and free.** Soft Signal and equivalent stops require no peer permission, reason, or performance of wellness.
6. **Core protections are non-derogable for growth.** Explicit consent, revocability, privacy-by-default, user agency, and honest representation may not be weakened to improve retention, monetization, virality, or implementation convenience.

---

## Article I — Consent is active, specific, mutual, continuous, and revocable

1. Consent is never inferred from a match, profile, prior interaction, silence, familiarity, reputation, payment, proximity, quiz result, learning completion, or trust signal.
2. Consent applies to a specific person, context, action, zone, modality, pressure, duration, environment, and moment.
3. A person may change or withdraw consent at any time without explanation.
4. Litmo must make stopping easier than continuing.
5. No feature may punish, shame, pressure, rank, or disadvantage a user for declining, pausing, or ending an interaction.
6. Where two preferences differ, the more restrictive boundary governs (`strictest wins`).
7. **Mutuality:** one person’s green path never authorizes contact against another’s yellow, red, or absent affirmation.
8. **Continuity:** authority must be re-evaluable during a session; silence is not renewal.
9. **Granularity:** zone, modality, intensity, and time are independent dimensions; a grant on hands never grants face.
10. **Language fidelity:** product copy and UI must not collapse soft limits into off-limits or welcomed without user intent.

---

## Article II — Safety logic is product logic

1. Safety may not be reduced to warning copy, terms of service, or a settings page.
2. Safety-critical rules must be represented in the product flow, data model, authorization layer, and tests.
3. A feature that increases engagement but weakens informed consent must not ship.
4. Trust indicators may summarize history, but must never certify that a person is safe.
5. Reports involving harm, coercion, or discomfort require careful human review; automated punishment must not substitute for judgment.
6. Emergency, clinical, and law-enforcement functions must never be implied unless Litmo actually provides them.
7. **Collective safety** (Article XI) is complementary: individual Soft Signal remains absolute for that person even when community tools exist.

---

## Article III — Privacy is the default state

1. User data is private unless the user takes a clear, specific action to share it.
2. Logs, boundaries, preferences, relationship data, and safety records must never be public by default.
3. Sharing must identify exactly what is shared, with whom, for how long, and with what permissions.
4. Authentication secrets, private logs, and sensitive metadata must never be written to analytics, crash logs, or ordinary application logs.
5. Litmo must minimize collection. Data that is not necessary should not be collected.
6. Users must be able to understand, export, and delete their data.
7. Local privacy protections and server-side authorization are separate requirements; neither may be treated as a substitute for the other.
8. Intimate body and nervous-system data must not become advertising fuel, social feed content, or silent training context without explicit, revocable, purpose-limited consent.

---

## Article IV — The user retains agency

1. Litmo assists decisions; it does not make intimate decisions for people.
2. Recommendations must remain explainable and dismissible.
3. Dark patterns, artificial urgency, manipulative streaks, and engagement traps are prohibited.
4. Users must be able to leave a flow, cancel a request, block another user, and end a session without unnecessary friction.
5. Defaults must favor caution, clarity, and reversibility.
6. No score, badge, algorithm, or AI output may override an explicit human boundary.
7. **Cultural and neurotype agency:** accommodation settings (ND Mode, language density, sensory profiles) are user-owned and never public identity labels.

---

## Article V — Inclusion without assumption

1. Litmo must not assume gender, sexuality, relationship structure, disability status, trauma history, communication style, physical ability, religion, culture, or neurotype.
2. Accessibility is a core requirement, not a polish phase.
3. Language should be direct, nonjudgmental, and understandable under stress.
4. Users must be able to express boundaries without needing clinical, legal, or identity-specific vocabulary.
5. Product design must account for users who communicate, process, move, see, hear, or regulate differently.
6. **Cross-cultural humility:** no single cultural script for touch is universal; Litmo provides grammar and exit, not a monoculture of “correct” intimacy.
7. **Neurotype humility:** ND Mode and trauma tools are accommodations and options, not diagnoses, rankings, or partner-visible badges.

---

## Article VI — Identity and authentication must protect, not burden

1. Litmo should avoid passwords where stronger, simpler platform-native authentication is available.
2. Authentication must not require unnecessary disclosure of a user’s legal name, email address, contacts, or identity documents.
3. Account recovery must be designed before authentication becomes mandatory.
4. A lost device, deleted passkey, or changed credential provider must not silently create a duplicate identity.
5. Face ID, Touch ID, or device passcode may protect local access, but must never be mistaken for server authorization.
6. Security-sensitive changes require isolated branches, explicit review, and real-device testing before merge.

---

## Article VII — Build conservatively around irreversible harm

1. Features that create social exposure, location risk, coercion risk, or irreversible disclosure require a higher standard of evidence and testing.
2. Private single-user functionality should become stable before shared or social functionality expands.
3. Synthetic data and demo mode must be clearly distinguished from real accounts and real interactions.
4. Experimental features must fail closed when safety or authorization state is uncertain.
5. No production feature may depend on an undocumented assumption about identity, consent, ownership, or access control.
6. Permanent social exclusion (e.g. permanent ban) requires human-in-the-loop process with fail-closed dual confirmation when policy requires it.

---

## Article VIII — Technical integrity

1. `main` represents the known-good integration state and must not be used as a scratchpad.
2. Meaningful work occurs on purpose-specific branches and enters `main` through reviewable pull requests.
3. Security, consent, authorization, and data-isolation behavior must be covered by automated tests where practical.
4. Secrets must never be committed to the repository.
5. Migrations must be reversible or accompanied by a documented recovery plan.
6. Documentation must change when architecture, safety behavior, or user-visible guarantees change.
7. A passing build is necessary but not sufficient; critical flows must also be exercised on real devices and accounts.
8. **Constitutional machine checks** (`constitutionInvariants` and domain engines) are part of integrity, not optional garnish.

---

## Article IX — AI-assisted work remains accountable human work

1. AI tools may propose, draft, refactor, test, and document work, but may not define Litmo’s values by accident.
2. Generated code must be reviewed against this constitution, not merely accepted because it compiles.
3. AI-generated claims about security, privacy, medicine, law, or platform policy must be verified before they are relied upon.
4. Prompts and agent instructions should preserve context, explain constraints, and prohibit silent weakening of safety rules.
5. When an AI system is uncertain, it should surface the uncertainty rather than fabricate confidence.
6. Responsibility for what ships remains with the humans maintaining Litmo.
7. Models must not be trained on private consent content, Soft Signal narratives, or report text without an explicit, documented, purpose-limited governance decision.

---

## Article X — Honest communication

1. Litmo must accurately describe what it does and does not provide.
2. Prototype, beta, synthetic, experimental, and production states must not be blurred.
3. Marketing must not promise safety, healing, compatibility, or outcomes that the system cannot guarantee.
4. Errors should be understandable and should not conceal loss of data, failed authorization, or degraded protection.
5. Material security or privacy incidents must be documented and addressed transparently.
6. **Cultural honesty:** Litmo does not claim to “solve loneliness” or “end violence”; it claims to make consent clearer and stop freer.

---

## Article XI — Collective safety without erasing the individual

*Second-order principle: communities need tools; individuals keep absolute stop rights.*

1. Blocking, reporting, human moderation, appeals, and rate limits exist to protect communities — never to replace Soft Signal.
2. Collective safety tools must fail closed against false emergency theater and public shaming scores.
3. Human review is required for irreversible restrictions; automation may prioritize queues, never auto-ban for engagement convenience.
4. A report is a request for judgment, not a public verdict.
5. **Reciprocal dignity:** the reported person retains privacy, appeal paths where applicable, and freedom from mob ranking.
6. Staff access is least-privilege, auditable, and never a backdoor into device-encrypted private notes.
7. Collective tools must not create a market for “safety as status.”

---

## Article XII — Consent as living, versioned language

*Second-order principle: languages evolve; dialects must interoperate without losing stop words.*

1. Touch Language, Consent Snapshot fingerprints, Soft Signal, and continuous consent vocabulary are **language modules** of the same constitutional language family.
2. New words (zones, modalities, continuous colors, microstates) require:
   - documentation;
   - dual-party meaning (not unilateral redefinition mid-session);
   - fail-closed defaults for unspecified dimensions;
   - tests that prove strictest-wins and stop-freeness.
3. **Version seals:** a sealed snapshot is bound to a content fingerprint; material change invalidates affirmations rather than silently rewriting them.
4. **Dialects across culture and neurotype:** plain-language packs, ND Mode, and sensory accommodations translate chrome — they do not rewrite the stop semantics of Soft Signal.
5. **Interoperability:** future clients (phone, macOS, device OS) must share domain engines rather than invent parallel consent laws.
6. **Archive honesty:** historical sessions keep historical seals; they never auto-upgrade into future authority.

---

## Article XIII — Cultural adoption and plural touch cultures

*Second-order / third-order: how a grammar spreads without becoming colonial soft power.*

1. Litmo rejects a single global “correct” culture of touch. It offers **shared tools for specificity and exit**.
2. Localization must preserve Soft Signal freeness and dual-seal mutuality; translation cannot soften stop into “maybe later” defaults.
3. Community norms outside Litmo (faith communities, disability communities, recovery communities, queer and trans communities, elder communities) may use Litmo’s grammar without surrendering their own ethics — so long as non-sexual platonic framing and adult consent remain absolute on-platform.
4. Partnerships with institutions must not convert Litmo into compulsory wellness, workplace surveillance, or HR compliance theater.
5. **Adoption metrics** (if any) must never optimize for session volume over clear dual seal and free stop.
6. Education (Guided Learning) invites practice; it never certifies “safe to touch.”

---

## Article XIV — Long-term societal impact and intergenerational duty

*Third-order: fifty-year horizon.*

1. Litmo’s success metric over decades is **cultural literacy in consent**, not time-on-app.
2. The platform should leave people *more capable* of clear boundary language offline than when they arrived.
3. Litmo must resist capture by engagement capitalism that monetizes isolation.
4. Research and public conversation about Litmo must not exploit users’ intimate data as spectacle.
5. **Intergenerational duty:** designs that train the next generation that stop is shameful, or that silence is yes, are unconstitutional.
6. When Litmo winds down, merges, or changes ownership, **consent data handling, deletion, and honesty obligations** outlive growth narratives.
7. **Vision 2030** ([`philosophy/VISION_2030.md`](philosophy/VISION_2030.md)) is aspirational strategy subordinate to this constitution — never a license to weaken Articles 0–X.

---

## Article XV — Edge cases across neurotypes, trauma, and embodiment

1. Freeze, fawn, shutdown, and delayed processing are valid human states; product must not interpret them as ongoing yes.
2. Overload exits, reduced motion, plain language, and sensory profiles are first-class (ND Mode); they are not “advanced settings” for a minority afterthought.
3. Trauma-informed tools (panic cover, optional reflection, skippable wrap-up) never require narrative of harm.
4. Disability and chronic pain contexts require that “energy,” “capacity,” and “duration” remain user-authored — never inferred as commitment.
5. Age eligibility is about adult framing and legal risk management — never a claim of maturity certification or safety.
6. Edge cases that conflict with growth targets resolve in favor of fail-closed stop and dual seal.

---

## Decision test

Before shipping a meaningful change, reviewers should be able to answer:

1. Does this preserve explicit, revocable, mutual, session-specific consent?  
2. Is the safest reasonable default being used?  
3. Is private data still private by default?  
4. Can the user understand and reverse the action?  
5. Does authorization hold for two different users and two different devices?  
6. Could this pressure, expose, mislead, or strand someone?  
7. Are the failure states safe and visible?  
8. Is the behavior documented and tested?  
9. Does this preserve Soft Signal freeness under stress, overload, and offline conditions?  
10. Would this still be defensible if it defined consent culture for fifty years?

A “no” or “uncertain” answer blocks release until resolved or explicitly accepted through documented review.

---

## Amendment process (living constitution)

This constitution may evolve, but not casually. Amendments are how a fifty-year language stays honest without silent capture.

### A. Classification of amendments

| Class | Scope | Extra gates |
| ----- | ----- | ----------- |
| **A — Clarifying** | Wording that does not change protections | Standard PR review + doc sync |
| **B — Expanding** | New protections or new articles (e.g. continuous consent vocabulary) | ADR + tests + enforcement map update |
| **C — Structural** | Changes to Articles 0, I.1–I.6 core, III privacy default, IV agency, X honesty, or non-derogable clause | Founder approval + written impact statement + delayed merge (minimum review window) |
| **D — Emergency** | Security incident requiring temporary operational rule | Time-bounded, documented, must not permanently weaken non-derogable clauses |

### B. Required steps (all classes)

1. Dedicated branch and pull request titled `constitution: …`.  
2. Written problem statement: what harm or gap is addressed.  
3. Explicit list of protections that become **stronger**, **weaker**, or **different**.  
4. Update `CONSTITUTION.md` root summary if spiritual authority shifts.  
5. Update `CONSTITUTION_ENFORCEMENT.md` and machine `CONSTITUTION_VERSION` when enforceable meaning changes.  
6. No unrelated feature implementation in the same amendment commit.  
7. Learning module `living-constitution` updated when user-facing meaning changes.

### C. Non-derogable core

The following may not be weakened merely for growth, retention, monetization, virality, or implementation convenience:

- explicit, mutual, session-specific consent;  
- free unilateral stop (Soft Signal class);  
- privacy by default;  
- user agency against dark patterns;  
- honest non-claims about safety and emergency;  
- fail-closed uncertainty.

### D. Versioning

- Human version string in this file’s header.  
- Machine pin `CONSTITUTION_VERSION` in `@litmo/domain`.  
- Changelog entry under `docs/CHANGELOG.md`.  
- Optional ADR for Class B/C amendments.

---

## Precedence

When this constitution conflicts with a roadmap, ticket, prompt, generated plan, design mockup, investor preference, implementation shortcut, or business objective, **the constitution takes precedence** until intentionally amended.

When this constitution conflicts with local law, Litmo must not claim illegal compliance; it must fail closed, restrict geography or features honestly, and never invent legal approval.

---

## Closing

Litmo is not trying to optimize touch.

It is trying to protect it — long enough that the language of consent outlasts any single product release.
