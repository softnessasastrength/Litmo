# Decision Rights

This document identifies who may propose, implement, approve, merge, and release different classes of change.

## Roles

### Founder / accountable human owner

Owns mission, philosophy, governance, roadmap authorization, public claims, and final release authority.

### Human reviewer

Provides accountable review for safety, privacy, accessibility, security, product, legal, clinical, or operational implications according to expertise.

### Implementing contributor

May be human or AI. Implements approved work, tests it, documents it, and presents evidence through a pull request.

### Independent reviewer

Reviews implementation and evidence without being the sole author. May be human or AI, but protected changes still require accountable human approval.

### Release operator

Executes an approved release process and records the result. Release authority is not implied by repository write access.

## Decision matrix

| Change class | AI may propose | AI may implement | Human approval before merge | ADR |
|---|---:|---:|---:|---:|
| Routine bug fix inside established behavior | Yes | Yes | Normal PR review | When durable architecture changes |
| Tests, docs, tooling, CI, developer experience | Yes | Yes | Normal PR review | When difficult to reverse or policy-relevant |
| UI polish without semantic change | Yes | Yes | Normal PR review | Usually no |
| Accessibility improvement | Yes | Yes | Required when behavior or meaning changes | When establishing a durable pattern |
| Consent or session-state semantics | Yes | Only from approved specification | Explicit | Required |
| Trust, scoring, matching, verification | Yes | Only from approved specification | Explicit | Required |
| Privacy, retention, analytics, data sharing | Yes | Only from approved specification | Explicit | Required |
| Authentication, encryption, secrets, identity | Yes | Only from approved specification | Explicit | Required |
| Moderation, reporting, blocking, eligibility | Yes | Only from approved specification | Explicit | Required |
| Legal, medical, therapeutic, or safety claims | Draft only | No autonomous publication | Explicit qualified review | Required when adopted |
| Governance or protected principles | Draft only | Documentation only | Founder approval | Required |
| Production release or destructive migration | Prepare only | Only with explicit authorization | Explicit | As applicable |

## Approval is specific

Approval applies to the described change and risk boundary. It does not grant standing authority for related future changes.

## Repository permissions are not governance authority

The ability to push, merge, administer, or trigger a workflow is a technical capability. It does not by itself authorize a decision under this charter.

## Emergencies

A narrowly scoped emergency repair may bypass the normal sequence only to prevent immediate harm, exposure, corruption, or outage. It must:

- choose the least expansive reversible intervention;
- preserve evidence;
- avoid unrelated changes;
- receive prompt retrospective review and documentation.
