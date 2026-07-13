# Code comment standard — maximum intentionality

**Status:** durable · mandatory for all new and modified code  
**Parent:** [`DOCUMENTATION_STANDARD.md`](DOCUMENTATION_STANDARD.md)  
**Bound by:** Living Constitution · consent philosophy · fail-closed safety

> From this point forward, every line of code that ships must carry reasoning.  
> Hand-waving is a product defect. Silent cleverness is a safety defect.

This is not decoration. Comments exist so a human or agent who never saw the
chat can reconstruct **what**, **why**, **edge cases**, and **consent
philosophy** without guessing.

---

## 1. Non-negotiable rule

**No function, type that encodes product meaning, constant that affects safety,
or non-obvious line ships without documentation of the reasoning behind it.**

“It works” is incomplete. “It is obvious” is not a free pass for consent,
auth, age, Soft Signal, encryption, or boundary logic.

Repo docs (`docs/*`, ADRs) remain required. **In-code comments do not replace
docs** — they bind the implementation to those docs at the point of truth.

---

## 2. Required block on every function / method / hook

Place a block comment **immediately above** every exported and non-trivial
local function. Template:

```ts
/**
 * WHAT: One precise sentence — what this function does when called.
 * WHY: Why this exists instead of inlining / another API / “just return true”.
 * CONSENT: How this fits Litmo philosophy (or explicit “not a consent surface”).
 * EDGE CASES:
 *   - case → required behavior
 *   - case → required behavior
 * NEVER: Explicit non-claims (what callers must not infer from success).
 * SEE: docs path, ADR, or ConsentPointId when applicable.
 */
```

Minimum fields: **WHAT**, **WHY**, **CONSENT** (or N/A with reason), **EDGE CASES**
(at least one real edge, or “none — pure transform of validated input”), **NEVER**.

### Examples of CONSENT lines

| Good | Bad |
| ---- | --- |
| “Prepare-only: stores local preferences; does not seal a snapshot.” | “Handles user data.” |
| “Withdraw path: may not require peer, dwell, or reason.” | “Stops session.” |
| “Not a consent surface: formats display names only.” | *(omit)* |

---

## 3. Required documentation on types and constants

### Product types (`ConsentPointId`, session status, boundary status, …)

Document:

- What each variant means in product language  
- What it does **not** mean  
- Fail-closed default when unknown  

### Magic numbers and timing tokens

Document:

- Unit (ms, pt, count)  
- Why this value (constitution, motor intentionality, Apple-level anti-accident)  
- What breaks if raised/lowered  

### Feature flags and environment gates

Document demo vs production and fail-closed direction.

---

## 4. Line-level comments (when required)

Comment a **line or short block** when any of the following is true:

| Trigger | Example |
| ------- | ------- |
| Order matters for safety | local end before network I/O on Soft Signal |
| Fail-closed branch | `if (!eligible) return deny` |
| Non-obvious boolean | `fingerprintCurrent !== false` means “default true unless explicitly stale” |
| Debounce / dwell / race | grant arm clock; toggle debounce |
| Demo vs real divergence | self-report age ≠ Apple age range |
| Privacy | “never log private note body” |
| Forbidden pattern avoidance | “no auto-accept after NFC scan” |
| Mapping / coercion | unset zone → off_limits |
| Why not the “simpler” code | “cannot use swipe-to-consent (grammar forbidden)” |

### Density guidance

- Prefer **one reasoning comment per decision**, not a paraphrase of syntax.  
- Do **not** write `// increment i` on `i++`.  
- **Do** write why the increment is capped, reset, or skipped.  
- Inside hot paths, comment the **invariant**, not the language feature.

Bad:

```ts
// Set name
setName(text);
```

Good:

```ts
// Display name only — not legal identity, not matching eligibility, not consent.
// Empty trim is rejected by the step gate so we never persist whitespace-as-name.
setAboutYou({ name: text });
```

---

## 5. Consent-critical surfaces (stricter bar)

These modules/directories require the full template on **every** export and on
every branch that can authorize, refuse, withdraw, or prepare human contact:

- `app/lib/consentInteractionCore.ts`  
- `app/lib/sessionConsentSnapshotCore.ts`  
- `app/lib/softSignalCore.ts`  
- `app/lib/touchLanguageCore.ts`  
- `app/lib/traumaSafetyCore.ts`  
- `shared/src/consentEngine.ts`  
- Soft Signal / snapshot / emergency services  
- `ConsentAffirmRow`, `ConsentAcceptGate`, `SoftSignalButton`, `useConsentGrantArm`  
- Onboarding age / boundary / TL save paths  
- Age gate, passkey auth ceremony, biometric lock  

For these, **EDGE CASES** and **NEVER** are mandatory even if the function is short.

---

## 6. What comments must never do

| Forbidden | Why |
| --------- | --- |
| Log or embed real user secrets, tokens, or private notes as examples | Privacy |
| Claim legal, clinical, or safeguarding approval | Governance |
| Soften a fail-closed rule (“usually ok to skip”) | Safety |
| Document aspirational behavior as if shipped | Honesty |
| Leave `// TODO` without context / release impact | DOCUMENTATION_STANDARD |
| Contradict `CONSENT_POINTS` / Living Constitution without an ADR | Integrity |

If code and comment disagree, **fix both** — do not ship the ambiguity.

---

## 7. Tests

Test files must document:

- **WHAT** invariant is proven  
- **WHY** that invariant is constitutional / product-critical  
- **EDGE** case name when testing an edge from `CONSENT_EDGE_CASES`  

Example:

```ts
// WHAT: Soft Signal local commit is strictly faster than grant arm.
// WHY: Constitution I.4 — body freedom before beauty; stop must not lose a race to continue.
// NEVER: This does not prove UI wiring; only the timing tokens.
test("stop is faster than grant (constitution I.4)", () => { ... });
```

---

## 8. Definition of done (code review / agent self-check)

Before committing any code change, verify:

1. Every new/changed function has the full block (or is a one-line pure alias with a one-line WHY).  
2. Every safety-relevant branch has a line comment or is covered in the function EDGE CASES list.  
3. CONSENT / NEVER lines are present on consent-critical surfaces.  
4. Related `docs/*` updated in the same workstream.  
5. No unexplained TODO.  
6. Comments match actual control flow (read the code after writing comments).  

A PR/commit that adds behavior without this bar is **incomplete**, even if tests pass.

---

## 9. Retrofit policy

- **New code:** full standard, no exceptions.  
- **Touched code:** bring the edited function/file up to standard in the same change.  
- **Untouched legacy:** not a free-for-all rewrite; raise the bar when the file is next materially edited.  
- **Consent-critical legacy:** prefer proactive retrofit when working in the area.

---

## 10. Relationship to other docs

| Doc | Role |
| --- | ---- |
| `DOCUMENTATION_STANDARD.md` | Repo-level docs, ADRs, changelog |
| `CONSENT_MICROINTERACTIONS.md` | Product grammar for consent UI |
| `ONBOARDING_CONSENT_FLOW.md` | First-open frame-by-frame |
| `LITMO_CONSTITUTION.md` | Binding philosophy |
| This file | **How code itself carries that philosophy** |

---

*Touch is not a transaction — it is a language. Code that touches consent must speak clearly.*
