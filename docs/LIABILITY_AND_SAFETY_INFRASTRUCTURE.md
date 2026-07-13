# Litmo Liability & Safety Infrastructure

> **The product can structure consent. It cannot structure a stranger's intentions.**

## Why this document exists

The Founding Thesis, Constitution, and product docs define what Litmo must protect inside the product: explicit consent, reversibility, privacy, and agency. This document exists to name what sits outside that boundary — the real-world risks that no amount of in-app consent architecture can resolve on its own — and to record that those risks were identified deliberately, before launch, rather than discovered after.

This is a living risk document, not a policy. It is expected to be revised as the product, legal counsel, and regulatory landscape evolve. Its purpose right now is to make the unresolved items visible and to explain why they are unresolved.

## What Litmo's product logic can and cannot guarantee

Litmo can guarantee, by design:

- that consent is specific to a session and never inferred from a match, profile, or history;
- that a Consent Snapshot requires mutual, explicit affirmation before a session activates;
- that a Soft Signal ends a session immediately, without requiring justification;
- that trust history is presented as context, never as certification of safety.

Litmo cannot guarantee:

- that a person's stated identity, intentions, or history are true;
- that a person who behaves safely in the app will behave safely in person;
- that harm cannot occur once two people are physically together;
- that a Trust Ledger entry predicts future conduct.

The gap between these two lists is the subject of this document. Consent infrastructure reduces ambiguity and coercion that arises from _unclear expectations_. It does not screen for bad actors who understand the rules and intend to violate them anyway. Any product communication, marketing, or internal narrative that implies otherwise is a liability risk in itself and should be treated as a defect.

## Identity verification

**Current state:** not implemented. Discovery, matches, and profiles in the current build are synthetic.

**Before real-world sessions can be arranged, Litmo needs a defined verification posture**, at minimum:

- a decision on required verification tier before a profile can initiate or accept a session (e.g., government ID match, liveness check, phone number verification);
- a policy on what verification does and does not claim to establish (identity ≠ safety, and this distinction should be user-facing, not just internal);
- a plan for handling verification failures, duplicate accounts, and re-verification after a ban;
- a decision on whether any tier of the product can exist without identity verification (e.g., profile-building and Touch Language exploration without matching), since verification cost and friction should probably not gate the parts of the product that carry no physical-meeting risk.

**Open question:** what verification vendor, and what happens to verification data — retention period, who can access it, whether it's ever shared with law enforcement on request, and under what legal process.

## Incident reporting and response

**Current state:** not implemented. The Founding Thesis states that reports and uncomfortable outcomes require careful human review, but no pipeline exists yet.

A minimum viable incident system needs:

- an in-app reporting mechanism reachable at all times, including mid-session and post-session;
- a defined response SLA — who reviews reports, how quickly, and what interim action is taken on the reported account while review is pending (e.g., temporary suspension of matching);
- a graduated response framework (warning, suspension, permanent ban) with documented criteria, so enforcement isn't ad hoc;
- a decision on when an incident triggers a recommendation or requirement to contact law enforcement, and how that's communicated to the reporting user without creating pressure either way;
- a record-keeping policy for reports — what's retained, for how long, and how it's protected, since this will be some of the most sensitive data the platform holds.

**Open question:** whether Litmo needs a human safety/trust team before any real-world session can be scheduled, or whether that function can reasonably be deferred to a later launch phase. My current lean is that it cannot be deferred — an incident pipeline should exist before the first real session, not after the first report.

## Terms of use and the liability boundary

The product needs terms that plainly state, in language a user will actually read and a court will actually enforce:

- Litmo provides a consent-coordination and communication structure; it does not vet, endorse, or guarantee the safety of any user;
- users assume responsibility for their own safety decisions in choosing to meet, and where to meet;
- Litmo is not a substitute for personal judgment, background research, or — per the Founding Thesis — therapeutic or emergency care;
- the scope of what the Trust Ledger represents (conduct history within the platform) versus what it does not represent (a safety guarantee).

**This needs actual attorney review before it's relied on.** A self-drafted terms-of-use for a platform coordinating in-person meetings between strangers is exactly the kind of document where the cost of getting it wrong is high and the cost of proper drafting is comparatively low. This is flagged here as a hard dependency before any real-world session ships, not a nice-to-have.

**Open question:** whether a liability waiver requiring affirmative click-through before a first session is legally meaningful in the relevant jurisdiction(s), and whether Litmo needs jurisdiction-specific terms if it operates beyond one state or country.

## Insurance and platform risk transfer

**Current state:** not researched.

Categories worth investigating once the product nears real-world sessions:

- general liability / platform liability coverage for harm arising from user-to-user interactions facilitated by the app (comparable in kind to coverage models used by services that facilitate in-person meetings between strangers);
- errors & omissions coverage for the verification and moderation systems themselves;
- whether standard tech E&O policies exclude this category of risk (physical harm between users) by default, which is likely, and what specialty carriers exist for platforms in adjacent categories.

**Open question:** this may be the single highest-cost unresolved item, and worth pricing out early even if implementation is far off, since it could materially affect the business model (e.g., subscription pricing needs to absorb it).

## Payment processor and platform policy risk

**Current state:** not researched.

"Non-sexual, platonic touch between strangers, coordinated by an app" does not map cleanly onto existing category definitions used by:

- app stores (Apple App Store / Google Play policies on apps facilitating in-person meetings, particularly anything adjacent to their intimacy/dating app categories, even though Litmo is explicitly not a dating app);
- payment processors (Stripe and similar have historically been cautious with platforms coordinating in-person meetings between strangers, for reasons ranging from chargebacks to liability exposure to their own risk teams).

**Open question:** whether Litmo's positioning as explicitly non-sexual and non-dating meaningfully changes how it's categorized by these gatekeepers, or whether the physical/stranger-meeting element alone triggers the same review scrutiny regardless of framing. This is worth a direct conversation with a payments/app-store specialist before assuming either answer.

## Why this isn't shipping yet

The sequencing is intentional, not a stall. The current build exists to prove the product logic and interaction design — consent flow, trust model, touch language — before any of the above is built, because building verification, incident response, and legal infrastructure for a product whose core interaction model was still unproven would have been premature spending.

The founding thesis states the priority explicitly: no growth target, engagement metric, social feature, recommendation system, or business objective may weaken explicit consent, privacy, reversibility, or user agency. The same logic applies here — no launch timeline should compress verification, incident response, or legal review below what a platform coordinating in-person meetings between strangers actually requires.

**This document should be revisited before any of the following milestones:**

- before real (non-synthetic) discovery, matching, or sessions are enabled for any user, even in closed beta;
- before any payment is processed;
- before any public launch or app store submission.

## Status

Early risk-identification pass. Not legal advice, not a finished policy, not attorney-reviewed. Intended to demonstrate that these risks were surfaced deliberately during the product's early foundation phase, and to serve as the checklist against which "ready for real-world sessions" gets evaluated.
