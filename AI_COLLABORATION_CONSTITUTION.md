# Litmo AI Collaboration Constitution

This document governs how multiple AI agents collaborate on the Litmo codebase. Its purpose is parallel speed without architectural chaos, duplicated work, hidden conflicts, or weakened safety.

## 1. Authority

All agents must follow, in order:

1. CONSTITUTION.md
2. Explicit founder instructions
3. CODEX.md
4. TEAM.md
5. ROADMAP.md and accepted issue scope
6. This collaboration document
7. Agent preferences

An agent must stop and surface a conflict rather than silently choosing a lower-priority instruction.

## 2. One Task, One Owner

Every active task must have one primary implementation owner.

Other agents may review, research, test, or advise, but must not independently rewrite the same files unless coordination is explicit.

Before editing, each agent should state or record:

- task or issue number
- files expected to change
- branch name
- dependencies
- safety-critical areas affected

## 3. Branch Discipline

Agents should work on separate branches using descriptive names, such as:

- `agent/vibe-quiz-ui`
- `agent/consent-tests`
- `agent/accessibility-audit`

Agents must not force-push shared branches, rewrite another agent's history, or commit directly to protected production branches.

Small founder-directed documentation changes may be made directly only when explicitly requested.

## 4. Issue and Scope Discipline

Every meaningful code change should correspond to an issue or clearly documented task.

Agents must not expand scope merely because adjacent work appears useful. Record follow-up work as a note or issue instead.

A task is not complete because code was generated. It is complete when its acceptance criteria are addressed and verification results are reported honestly.

## 5. Handoffs

Each agent handoff must include:

- what changed
- why it changed
- files touched
- tests or checks run
- known failures or unverified assumptions
- migration or environment impacts
- safety and accessibility considerations
- recommended next action

Never imply that a test ran, build passed, or behavior was verified when it was not.

## 6. Source of Truth

The repository is the shared source of truth.

Important decisions must not exist only in chat. Promote them into one of:

- GitHub issues
- NOTES.md
- architecture or product documentation
- decision records
- test cases
- code comments where truly local

Agents should read current repository documents before relying on old conversation context.

## 7. Conflict Prevention

Before substantial work, pull or inspect the latest branch state.

Avoid overlapping ownership of:

- package manifests
- navigation roots
- database migrations
- shared schemas
- consent logic
- global theme files

When overlap is unavoidable, designate an integration owner before implementation begins.

## 8. Integration Owner

For multi-agent milestones, one agent should act as integration owner.

The integration owner:

- checks branch compatibility
- resolves conflicts without discarding intent
- runs the broadest available verification
- confirms documentation consistency
- produces the final integration summary

The integration owner does not waive independent safety review.

## 9. Safety-Critical Changes

The following require heightened review:

- consent computation
- session activation
- Soft Signal behavior
- authentication and authorization
- location or identity data
- moderation and reporting
- trust scores or reputation
- data retention
- notifications involving intimate context

For these changes:

- use fail-closed behavior
- add explicit negative tests
- document assumptions
- require review by an agent other than the primary author
- do not label the feature production-ready without evidence

## 10. Review Roles

Whenever practical, separate roles:

- Builder: implements the feature
- Reviewer: inspects correctness and maintainability
- Safety reviewer: examines abuse, consent, privacy, and failure modes
- Accessibility reviewer: checks perceivability, operability, clarity, and reduced-motion needs
- Integration owner: validates combined behavior

One agent may fill multiple roles for a prototype, but must state that independence was limited.

## 11. Tests and Verification

Agents must report verification using precise language:

- `Passed`: the command was executed and succeeded
- `Failed`: the command was executed and failed
- `Not run`: the command was not executed
- `Blocked`: execution was prevented by an identified dependency or environment issue

Generated code is not evidence of correctness.

## 12. Documentation Duties

Documentation is part of every feature.

Agents must update affected product, API, architecture, setup, roadmap, and safety documentation in the same change when practical.

If documentation cannot be completed, the handoff must identify the gap.

## 13. Dependency and Architecture Changes

Before adding a dependency or changing architecture, an agent must explain:

- the problem being solved
- why existing tools are insufficient
- maintenance and security implications
- alternatives considered
- migration cost

Agents should prefer fewer, well-understood dependencies.

## 14. Secrets and User Data

Agents must never commit:

- API keys
- service-role keys
- tokens
- signing credentials
- private user records
- real intimate-profile data

Use mock or synthetic data for prototypes.

## 15. Disagreement

Agents should disagree explicitly and respectfully.

When recommendations conflict, present:

- the competing options
- tradeoffs
- constitutional or safety implications
- the recommended choice
- what requires founder approval

No agent may manufacture consensus.

## 16. Founder Approval Gates

Explicit founder approval is required before:

- moving to the next roadmap chapter when a review gate exists
- changing constitutional principles
- introducing monetization or growth mechanics
- making public safety claims
- enabling real-user matching or location
- handling production intimate data
- releasing to external testers under the Litmo name

## 17. Definition of Collaborative Success

Multi-agent work is successful only when it produces:

- faster delivery
- clear ownership
- understandable history
- compatible changes
- honest verification
- stronger review
- no reduction in consent, privacy, accessibility, or user dignity

Parallelism is a tool. Safety and coherence remain the goal.