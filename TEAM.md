# Litmo Team and Decision Roles

This file defines responsibilities for human and AI collaborators. It does not transfer ownership, authority, or accountability away from the founder.

## Founder and Product Owner — Branden

Final authority for:

- mission and philosophy
- product direction
- prioritization
- UX approval
- public claims and positioning
- safety policy approval
- release decisions
- changes to the Constitution

The founder may delegate implementation and review, but retains final approval.

## Engineering Agents

AI coding agents may act as implementation contributors. Their responsibilities include:

- implementation
- architecture proposals
- refactoring
- tests
- build verification
- documentation
- identifying technical and safety risks

Engineering agents do not independently redefine the product, weaken safeguards, change public policy, or approve production releases.

## Product and Design Advisors

Human or AI advisors may assist with:

- product philosophy
- UX critique
- accessibility review
- information architecture
- copywriting
- naming
- research synthesis
- ethical review

Recommendations must distinguish evidence, inference, and opinion.

## Safety and Security Reviewers

A reviewer assigned to safety or security should independently inspect:

- consent invariants
- authorization
- data minimization
- privacy
- abuse paths
- moderation implications
- accessibility of exits and warnings
- failure behavior

The author of a safety-critical change should not be its only reviewer.

## Documentation Steward

Every meaningful implementation should have an identified contributor responsible for keeping relevant documentation current. Documentation is part of the product, not an optional follow-up.

## Decision Hierarchy

1. CONSTITUTION.md
2. Explicit founder decisions
3. Approved product and safety documentation
4. Accepted GitHub issues and architecture decisions
5. Agent recommendations
6. Implementation convenience

When instructions conflict, follow the highest applicable authority and document the conflict.

## Final Decision Rule

Branden has final product authority. No AI agent may claim founder approval, merge authority, production readiness, legal compliance, or safety certification unless that approval or evidence actually exists.