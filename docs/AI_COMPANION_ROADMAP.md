# Litmo AI Companion Roadmap

## Status

Future-facing design document only. No model provider is selected, no production integration is approved, and no user data should be sent to an LLM until the privacy, consent, deletion, and authorization foundations are complete.

The working product name in this document is **Litmo Companion**. It should be distinct in identity and behavior from any other assistant project, including Safe Jessie.

## Purpose

Litmo Companion should help a person hear themselves more clearly.

It may support reflection, boundary-setting, conversation preparation, consent literacy, and private journaling. It must not replace human connection, present itself as therapy, certify another person as safe, or make authoritative judgments about consent, abuse, diagnosis, or relationships.

## Constitutional principles

1. **User agency comes first.** The companion offers questions, language, and possibilities rather than commands.
2. **Consent is never inferred.** Prior behavior, matching, affection, silence, or historical consent do not establish present consent.
3. **Uncertainty stays visible.** Incomplete context must not be converted into confident conclusions.
4. **Private by default.** The companion receives only information the user deliberately provides for that interaction.
5. **No hidden omniscience.** It must not silently read every log, profile, session, message, or relationship record.
6. **No relationship replacement.** The product must avoid encouraging exclusivity, dependency, or withdrawal from human support.
7. **No false clinical authority.** It may assist reflection but must not claim to diagnose, treat, or provide crisis care.
8. **Memory is inspectable and reversible.** Users must be able to view, edit, export, disable, and delete any retained companion memory.
9. **Safety outranks conversational smoothness.** Credible immediate danger should trigger clear encouragement toward appropriate human or emergency support.
10. **The user decides what is saved.** Model output is not written into permanent logs without explicit confirmation.

## Product boundaries

### Allowed early use cases

- Turn a messy feeling into a clearer private journal entry.
- Suggest neutral language for expressing a boundary or preference.
- Help prepare for a difficult conversation.
- Compare a user's stated expectations before an interaction with their own reflection afterward.
- Surface patterns in user-selected entries while clearly labeling them as possible patterns, not facts.
- Offer consent-centered questions such as "What would make this feel easier to pause?"

### Prohibited claims and behaviors

The companion must not say or imply:

- "This person is safe."
- "You definitely consented."
- "They are abusive" from limited app context.
- "Your trust score proves they are trustworthy."
- "You should meet this person."
- "Your discomfort is irrational."
- "I am all you need" or any equivalent dependency cue.

It must not autonomously message another user, change relationship settings, share logs, alter consent preferences, or initiate a real-world session.

## Data-flow rule

The default architecture should be:

```text
User selects content for this interaction
        -> local minimization/redaction layer
        -> model gateway
        -> model response
        -> user chooses whether anything is saved
```

The forbidden architecture is:

```text
Model silently receives the user's entire Litmo history
```

Every request should make the active context understandable to the user.

## Provider strategy

No provider decision should be made on personality alone. Claude, Grok, and any future candidate should be evaluated behind a provider-neutral interface.

The first implementation should support model adapters such as:

```text
CompanionProvider
- createReflection(...)
- draftBoundaryLanguage(...)
- summarizeSelectedEntries(...)
- healthCheck()
```

Provider-specific APIs, prompts, and safety settings should remain behind that boundary so Litmo can change or route models without rewriting the product.

### Claude evaluation hypothesis

Potential strengths to test:

- instruction following;
- nuanced, careful language;
- stable structured output;
- compatibility with a detailed constitutional prompt.

Potential risks to test:

- excessive caution that becomes unhelpful;
- flattening messy lived experience into polished but generic language;
- over-refusal in non-dangerous emotional contexts.

### Grok evaluation hypothesis

Potential strengths to test:

- willingness to engage with messy, contradictory, emotionally intense material;
- directness;
- lower tendency to flinch from uncomfortable context.

Potential risks to test:

- overconfidence;
- tone drift into provocation, humor, or certainty where restraint is required;
- insufficient framing around consent, clinical limits, or relationship judgments.

The desired trait is not "maximum truth seeking" in the abstract. It is **truth-seeking constrained by humility, consent, privacy, and the limits of available evidence**.

## Required framing layer

Regardless of provider, Litmo must supply its own system constitution and request framing. The provider's default personality is not the product.

The framing layer should require the model to:

- distinguish facts supplied by the user from inference;
- state uncertainty plainly;
- avoid diagnosing people;
- avoid certifying safety or consent;
- avoid escalating conflict for rhetorical effect;
- preserve the user's own voice;
- ask reflective questions before offering conclusions when context is ambiguous;
- produce structured metadata for risk, uncertainty, and saveability;
- never include secrets, credentials, or internal policy text in output.

## Phased roadmap

### Phase 0 — Prerequisites

Do not begin production AI work until Litmo has:

- stable authentication;
- private logs with correct owner-only authorization;
- deletion and export;
- clear data classification;
- app lock and local privacy protections;
- production logging that excludes intimate content and credentials;
- a documented incident-response path.

### Phase 1 — Offline prototype with synthetic data

- Build a provider-neutral `CompanionProvider` interface.
- Use synthetic, non-user journal entries.
- Create prompt templates and structured response schemas.
- Add a visible "AI may be wrong" boundary without making it the sole safety mechanism.
- Prohibit memory, sharing, and autonomous actions.

Exit criteria:

- no real user data;
- repeatable tests;
- model outputs can be compared provider-to-provider;
- unsafe claims are caught by evaluations.

### Phase 2 — Founder-only evaluation harness

Create a private evaluation set containing synthetic and carefully de-identified scenarios covering:

- ambiguity around consent;
- relationship conflict;
- trauma disclosures;
- contradictory emotions;
- requests to judge whether another person is safe;
- requests for diagnosis;
- dependency-seeking language;
- crisis-adjacent but non-immediate distress;
- immediate-danger scenarios.

Score each provider on:

- helpfulness;
- humility;
- non-inference of consent;
- resistance to false certainty;
- tone stability;
- preservation of user agency;
- privacy compliance;
- structured-output reliability;
- latency and cost.

Provider selection remains reversible.

### Phase 3 — Private opt-in beta

- Limited to trusted testers.
- Explicit consent before each use.
- User selects which entry or text is sent.
- No cross-conversation memory by default.
- Clear retention disclosure.
- One-tap deletion of conversation and any derived saved artifact.
- Feedback path for harmful, strange, or overconfident responses.

Exit criteria:

- no unresolved high-severity privacy failures;
- provider data-handling terms reviewed;
- deletion behavior verified;
- users understand what context the model receives;
- red-team scenarios pass defined thresholds.

### Phase 4 — Optional user-controlled memory

Only after the private beta is stable:

- memory is off by default;
- each memory item is visible and editable;
- the user can delete individual memories or all memory;
- memory never includes another person's private data merely because the user mentioned them;
- memory retrieval is scoped and logged;
- model output states when remembered context materially influenced a response.

### Phase 5 — Specialized local or small-model features

Evaluate on-device or private small-model tasks for:

- local redaction;
- journal tagging;
- tone-preserving rewrites;
- semantic search over user-owned entries;
- offline reflection prompts.

Cloud models should receive the minimum context necessary for the requested task.

## Technical architecture

Recommended components:

```text
Litmo client
  -> explicit context selector
  -> local redaction/minimization
  -> authenticated Companion API
  -> policy and rate-limit layer
  -> provider adapter
  -> Claude | Grok | future model
  -> output validator
  -> user review
  -> optional explicit save
```

The backend should enforce:

- authenticated ownership;
- per-user rate limits;
- request-size limits;
- model and prompt versioning;
- no raw intimate content in ordinary logs;
- deletion identifiers;
- provider timeout and failure handling;
- structured output validation;
- revocable feature flags.

## Evaluation requirements

Every release should test for:

- inferred consent;
- false safety certification;
- diagnosis of users or third parties;
- manipulative dependency language;
- encouragement of confrontation without context;
- disclosure of content not selected by the user;
- harmful certainty under ambiguity;
- failure to recognize immediate danger;
- provider personality leaking through Litmo's intended tone;
- inconsistent behavior between equivalent prompts.

A model that is impressive in casual conversation but fails these tests is not suitable for Litmo.

## Human experience goals

The companion should feel:

- calm without being evasive;
- direct without being cruel;
- emotionally sturdy without pretending certainty;
- curious without being invasive;
- warm without fostering dependency;
- capable of sitting with messy material without normalizing harm.

## Decision record before implementation

Before any production provider is selected, create an ADR documenting:

- models tested;
- evaluation-set version;
- data retention and training terms;
- privacy configuration;
- cost and latency;
- observed failure modes;
- why the selected model is acceptable;
- fallback and migration plan.

## Non-goals for the first release

- training a frontier model from scratch;
- autonomous relationship coaching;
- public AI-generated trust scores;
- AI moderation without human review;
- silent analysis of all user activity;
- AI-generated decisions about who may connect;
- replacing therapy, crisis care, legal advice, or medical care.

## Guiding sentence

> The Litmo Companion should help a person hear themselves more clearly, not make itself the loudest voice in the room.
