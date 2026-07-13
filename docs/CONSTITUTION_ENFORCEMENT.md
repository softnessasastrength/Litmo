# Living Constitution — enforcement by design

**THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT.**  
Primary framing: Trauma-to-Code Exorcism Dojo — [`EXORCISM_MANIFESTO.md`](EXORCISM_MANIFESTO.md) · [`DOJO_GUIDELINES.md`](DOJO_GUIDELINES.md) · [`TRAUMA_ARCHITECTURE.md`](TRAUMA_ARCHITECTURE.md).

**Status:** active engineering map  
**Constitution version:** `litmo-constitution-v2`  
**Spiritual source:** [`LITMO_CONSTITUTION.md`](LITMO_CONSTITUTION.md) · root [`CONSTITUTION.md`](../CONSTITUTION.md)  
**Thesis / Vision:** [`philosophy/00_Founding_Thesis.md`](philosophy/00_Founding_Thesis.md) · [`philosophy/VISION_2030.md`](philosophy/VISION_2030.md)  
**Machine checks:** `@litmo/domain` → `constitutionInvariants.ts` (`CONSTITUTION_VERSION`)  
**Learning surface:** Guided Learning module `living-constitution`

> The constitution is not a PDF on a shelf.  
> It is load-bearing product logic — versioned, amendable only by process, enforceable in engines.

## How enforcement works

```text
Constitution articles (human, versioned)
  → constitutionInvariants (machine-checkable rules + tests)
  → domain engines (consent, session lifecycle, Soft Signal, nuclear seal, ND accommodations)
  → RLS / migrations / fail-closed services
  → UI that makes stop easier than continue
  → docs + ADRs when behavior changes
  → amendment process (Class A–D) when the law itself changes
```

If a feature fails `evaluateFeatureConstitutionally`, it does not ship.

## Article → evidence matrix

| Article | Rule (summary) | Primary enforcement |
| ------- | -------------- | ------------------- |
| **0** Living authority | Versioned, non-derogable core | `CONSTITUTION_VERSION`, docs, amendment process |
| **I** Consent active/specific/revocable | Never infer; strictest wins; stop freer; continuous/granular | `consentEngine`, dual seal, Soft Signal, `strictestBoundary`, continuous/nuclear cores |
| **II** Safety is product logic | Not just copy; no safety scores; no false emergency | Soft Signal RPCs, no public scores, trauma tools, safety-ops HITL |
| **III** Privacy default | Explicit share; minimize; no secrets in logs | Local vault, E2E quiz, share opt-in off, encrypted backup |
| **IV** User agency | No dark patterns; scores never override | Forbidden engagement patterns, Soft Signal free |
| **V** Inclusion without assumption | A11y core; ND not a public trait | ND Mode v3, plain language, learning |
| **VI** Auth protects | Passkeys; device-bound consent | Passkey auth, Face ID step-up |
| **VII** Conservative irreversible | Demo labeled; fail closed; dual-HITL bans | Demo ADR 0003, permanent ban dual-confirm |
| **VIII** Technical integrity | Tests, docs, no secrets | CI, ADRs, constitution unit tests |
| **IX** AI accountable | Humans own values | Review norms, no private consent training by default |
| **X** Honest communication | No false safety promises | Non-claims in copy, beta labeling |
| **XI** Collective safety | Human review; no shame scores | Reports, queue, appeals, restrictions |
| **XII** Living consent language | Versioned seals; shared domain | Snapshots, nuclear machine, multi-client domain |
| **XIII** Cultural adoption | Grammar not monoculture | Localization rules; institutional non-capture |
| **XIV** Societal impact | Literacy over DAU | Vision 2030 subordinate; metric discipline |
| **XV** Neurotype/trauma edges | Freeze ≠ yes; accommodations | ND Mode, trauma safety, Soft Signal |

## Machine API (`constitutionInvariants`)

| Function | Guards |
| -------- | ------ |
| `strictestBoundary` | I.6 |
| `stopIsEasierThanContinue` | I.4 |
| `unilateralStopValid` | I.3 Soft Signal |
| `trustNeverCertifiesSafety` | II.4 |
| `mustNotImplyEmergencyServices` | II.6 |
| `sharingRequiresExplicitAction` | III |
| `isForbiddenEngagementPattern` | IV |
| `boundaryOutranksScore` | IV.6 |
| `failClosedWhenUncertain` | V/VII |
| `demoMustBeLabeled` | VII.3 |
| `requiresDocUpdate` | VIII.6 |
| `softSignalConstitutionContract` | Soft Signal sacred contract |
| `evaluateFeatureConstitutionally` | Aggregate feature gate |
| `accommodationsMustNotExportAsProfileTrait` | V / ND |
| `consentLanguageMustBeVersioned` | 0 / XII |

Run: `npm --workspace shared test` (includes `constitutionInvariants.test.ts`).

## Soft Signal sacred contract

```ts
{
  unilateral: true,
  noReasonRequired: true,
  localStopAuthoritative: true,
  notEmergencyServices: true,
  notAPenalty: true,
  peerPermissionNotRequired: true,
}
```

UI copy lives in `SOFT_SIGNAL_COPY` — voice is dignity, not clinic.

## Amendment enforcement checklist

When amending the constitution (see `LITMO_CONSTITUTION.md`):

1. Bump human version header + `CONSTITUTION_VERSION` if enforceable meaning changes.  
2. Update this matrix.  
3. Add/adjust machine invariants and tests.  
4. Changelog + optional ADR.  
5. Update `living-constitution` learning module if user-facing meaning changes.  

## Agent rule

When building features, agents must:

1. Read this file + `LITMO_CONSTITUTION.md` + Founding Thesis  
2. Call or mentally run `evaluateFeatureConstitutionally`  
3. Update docs if consent/Soft Signal/auth/accommodations change  
4. Prefer fail closed  
5. Never treat Vision 2030 as license to weaken Articles 0–X  

## Related

- `docs/FEATURE_SWARM_TRACKER.md`  
- `docs/NUCLEAR_SWARM.md`  
- `docs/SAFETY_OPS_RUNTIME.md` · ADR 0042 · 0061 · 0062  
- ADR 0058 local-first · ADR 0059 trauma safety · `NEURODIVERGENT_MODE.md`  
