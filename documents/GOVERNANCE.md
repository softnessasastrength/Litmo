# Litmo Governance

Litmo is an open-source project with clear stewardship, distributed ownership, and a strong preference for consensus. The project is governed as a community, but it is not directionless: the founder remains responsible for protecting Litmo's purpose, design language, privacy commitments, and long-term coherence.

## 1. Core governance principles

Litmo follows five basic principles:

1. **Consensus before authority.** Decisions should be developed openly, with meaningful input from the people affected by them.
2. **Clear ownership.** Every meaningful feature, service, or submodule should have a person or small team responsible for its health.
3. **Authority follows responsibility.** People gain decision-making authority by doing the work, maintaining it over time, and becoming dependable to others.
4. **Discussion stays visible.** Important disagreements and decisions should be documented in the relevant GitHub issue, pull request, discussion, or design document.
5. **The project remains coherent.** The founder retains final responsibility for the roadmap and for decisions that affect Litmo's mission, product identity, privacy model, or overall direction.

## 2. Roles

### Contributors

A contributor is anyone who improves Litmo through code, design, documentation, testing, accessibility work, security review, research, community support, or other useful participation.

Contributors do not need a title before doing meaningful work. Good contributions should be reviewed on their merits.

### Maintainers

A maintainer is a contributor who has taken continuing responsibility for a defined part of the project.

The smallest maintainable unit is enough. A person may become a maintainer by reliably owning:

- a feature;
- a submodule;
- a package or service;
- a recurring workflow;
- a design-system area;
- an accessibility or privacy concern;
- documentation on which other contributors depend; or
- another clearly bounded area of work.

A contributor should be recognized as a maintainer when all of the following are substantially true:

- they have demonstrated sustained care for the area;
- they review, repair, document, or guide work in that area;
- other people's work reasonably depends on their judgment or follow-through;
- they communicate decisions and unresolved concerns openly; and
- the existing maintainers and founder trust them to act in the project's interest.

Maintainer status is recognition of existing responsibility, not merely a reward or honorary title.

Maintainers may review and merge changes within their area, subject to repository permissions, required reviews, automated checks, and any cross-cutting review requirements.

### Lead maintainers

A lead maintainer coordinates a larger subsystem or a group of related maintainers. This role should exist only where coordination is actually needed.

Lead maintainers do not outrank maintainers in every matter. Their responsibility is to connect work across boundaries, resolve ownership gaps, and help discussions reach a clear outcome.

### Founder and product steward

The founder serves as Litmo's product steward.

The founder:

- holds final responsibility for the roadmap;
- protects Litmo's mission, design language, privacy commitments, and product coherence;
- appoints or confirms maintainers and lead maintainers;
- may resolve a decision when consensus cannot be reached within a reasonable time; and
- may reject a change that would materially undermine the project's core principles.

This authority should be used transparently and sparingly. A final decision should explain the reasoning, acknowledge meaningful objections, and identify what evidence or changed conditions could justify revisiting it.

## 3. Roadmap decisions

The roadmap is developed with input from everyone and a strong preference for consensus.

Roadmap proposals should normally include:

- the user or project need being addressed;
- the proposed outcome;
- relevant technical, design, privacy, accessibility, and maintenance implications;
- known alternatives;
- unresolved questions; and
- the people or modules likely to be affected.

Contributors and maintainers are encouraged to challenge assumptions, propose alternatives, and identify risks.

The founder makes the final roadmap decision after considering the discussion and the emerging consensus. Final authority does not replace consultation; it exists to preserve coherence and allow the project to move when consensus remains incomplete.

## 4. Local decision-making

Maintainers should be able to make ordinary decisions within the areas they maintain without unnecessary escalation.

A local decision should be escalated when it:

- materially affects another maintained area;
- changes a public interface or data model;
- creates a privacy, security, consent, safety, or accessibility concern;
- conflicts with an existing project principle;
- creates substantial long-term maintenance obligations; or
- changes the product's overall behavior or design language.

Cross-cutting decisions should include the maintainers of every substantially affected area.

## 5. Consensus process

Litmo uses consensus as a process of finding the strongest workable agreement, not as a requirement that every person enthusiastically agree.

A rough consensus exists when:

- the relevant participants have had a fair opportunity to contribute;
- major concerns have been understood and addressed where reasonably possible;
- no unresolved objection identifies a serious technical, ethical, privacy, security, accessibility, or product risk; and
- there is a clear path that participants can support or at least live with.

Silence alone is not consensus when the people most affected have not been invited or given reasonable time to respond.

## 6. Disagreement resolution

Disagreements should be handled in a manner inspired by Wikipedia's talk-page process: discuss the issue where the work is visible, focus on the proposal rather than the person, document the competing views, and build consensus before escalating.

### Step 1: Discuss on the relevant page

Use the relevant GitHub issue, pull request, discussion, or design document as the project's equivalent of a talk page.

Participants should:

- state the specific point of disagreement;
- explain the reasoning and evidence behind their position;
- identify the values, requirements, or tradeoffs involved;
- respond to the strongest version of other positions;
- avoid personal attacks, motive speculation, repetition, and vote-counting as a substitute for reasoning; and
- propose concrete compromises or experiments where possible.

### Step 2: Summarize the dispute

When discussion becomes long or circular, any participant may post a neutral summary containing:

- the decision to be made;
- the areas of agreement;
- the remaining points of disagreement;
- the main arguments and evidence on each side;
- proposed compromises; and
- the consequence of delaying the decision.

Participants should correct the summary for accuracy before continuing the substantive debate.

### Step 3: Seek broader input

If the directly involved participants cannot reach agreement, invite input from maintainers of related areas or other contributors with relevant expertise.

Broader input is advisory. The goal is to expose missing information and discover a workable consensus, not to assemble factions.

### Step 4: Use a reversible experiment where possible

When uncertainty is empirical and the decision is reversible, prefer a limited prototype, feature flag, time-boxed trial, benchmark, user test, or other documented experiment.

The experiment should define in advance what evidence will be considered and when the decision will be revisited.

### Step 5: Request a decision

If consensus still cannot be reached, the responsible maintainer may decide a local matter within their scope. For cross-cutting, roadmap, mission, product identity, privacy, or unresolved high-impact matters, the founder makes the final decision.

The decision must be documented with:

- the outcome;
- the reasoning;
- the principal objections considered;
- whether the decision is reversible;
- any conditions or review date; and
- what new evidence could reopen the question.

## 7. Appeals and revisiting decisions

A decision may be revisited when there is meaningful new information, changed circumstances, evidence that an assumption was wrong, or a material impact that was not considered.

Reopening a decision should not merely repeat the prior discussion. The request should identify what has changed.

## 8. Two-pizza teams

Litmo organizes sustained work through small, autonomous groups that are generally small enough to be fed by two pizzas.

A team should normally:

- have a clear area of responsibility;
- include the skills needed to maintain that area end to end;
- be able to communicate directly without excessive coordination overhead;
- document interfaces and decisions that affect other teams; and
- split or reorganize when it becomes too large to operate through direct relationships.

The two-pizza principle is a guide to preserving human-scale collaboration, not a rigid headcount formula.

## 9. Cross-cutting review

Changes involving the following areas may require review from a designated maintainer outside the originating module:

- privacy and data handling;
- authentication and identity;
- security;
- consent and trust-and-safety behavior;
- accessibility;
- public APIs or persistent data formats; and
- the shared design system.

No maintainer should be expected to approve work outside their competence merely because they hold a title.

## 10. Inactivity and succession

Maintainers may step back temporarily or permanently without stigma.

When a maintained area no longer has an active owner, the project should:

1. document the ownership gap;
2. identify contributors already doing the work;
3. appoint an interim maintainer where necessary; and
4. transfer context, permissions, and unresolved decisions as openly as security permits.

Maintainer permissions may be reduced after prolonged inactivity when necessary for security or repository health. This does not erase the person's past contributions and does not prevent them from returning.

## 11. Conduct and good faith

Governance discussions are subject to the project's Code of Conduct.

Strong disagreement is allowed. Harassment, intimidation, personal attacks, bad-faith obstruction, and the use of process as a weapon are not.

Participants should assume good faith where reasonable, while still addressing concrete harmful behavior directly.

## 12. Governance changes

Changes to this document should be proposed publicly and discussed using the same consensus process described above.

The founder approves final changes to the governance model after consultation with maintainers and contributors.

This governance document is intended to evolve as Litmo grows. Its purpose is not to predict every future conflict, but to make responsibility, participation, and final authority understandable before conflict occurs.
