# Living Constitution — enforcement by design

**Status:** active engineering map  
**Spiritual source:** [`LITMO_CONSTITUTION.md`](LITMO_CONSTITUTION.md) · root `CONSTITUTION.md`  
**Machine checks:** `@litmo/domain` → `constitutionInvariants.ts`  
**Learning surface:** Guided Learning module `living-constitution`

> The constitution is not a PDF on a shelf.  
> It is load-bearing product logic.

## How enforcement works

```text
Constitution articles (human)
  → constitutionInvariants (machine-checkable rules + tests)
  → domain engines (consent, session lifecycle, Soft Signal)
  → RLS / migrations / fail-closed services
  → UI that makes stop easier than continue
  → docs + ADRs when behavior changes
```

If a feature fails `evaluateFeatureConstitutionally`, it does not ship.

## Article → evidence matrix

| Article | Rule (summary) | Primary enforcement |
| ------- | -------------- | ------------------- |
| **I** Consent active/specific/revocable | Never infer consent; strictest wins; stop easier than continue | `consentEngine`, Consent Snapshot dual seal, Soft Signal unilateral, `strictestBoundary`, sticky Soft Signal UI |
| **II** Safety is product logic | Not just copy; no safety scores; no false emergency | Soft Signal + withdrawal RPC, no public scores, `trustNeverCertifiesSafety`, trauma safety tools, **safety-ops queue + HITL** (`safetyOpsCore`, ADR 0061) |
| **III** Privacy default | Explicit share; minimize; no secrets in logs | Local vault, E2E quiz share, local share opt-in off, encrypted backup opaque |
| **IV** User agency | No dark patterns; no score overrides boundary | Forbidden engagement patterns list, Soft Signal free, decline-first copy |
| **V** Inclusion without assumption | Accessibility core; nonjudgmental language | ND Mode, a11y roles, trauma-informed learning |
| **VI** Auth protects | Passkeys; device-bound consent | Passkey auth, `auth_devices`, Face ID step-up for sensitive |
| **VII** Conservative irreversible | Demo labeled; fail closed | Demo mode ADR 0003, `failClosedWhenUncertain`, `demoMustBeLabeled`, **permanent ban dual-HITL** (migration 042; fail closed until named second owner) |
| **VIII** Technical integrity | Tests, docs, no secrets in repo | CI, ADRs, documentation standard, constitution unit tests |

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

## Agent rule

When building features, agents must:

1. Read this file + `LITMO_CONSTITUTION.md`  
2. Call or mentally run `evaluateFeatureConstitutionally`  
3. Update docs if consent/Soft Signal/auth changes  
4. Prefer fail closed  

## Safety-ops enforcement (private alpha)

| Rule | Primary evidence |
| ---- | ---------------- |
| II.5 Human review, no auto-punish | Reports open cases; holds/bans staff-only; rate limits soft only |
| II.4 Trust never certifies safety | `trust_events` append-only; `isForbiddenTrustDisplayPattern`; peer signals not scores |
| VII Dual-HITL permanent ban | `request_permanent_ban` + distinct `confirm_permanent_ban`; `named_second_owner_configured` default false |
| I Soft Signal under pause | Matching pause preserves Soft Signal (`isRoutineMatchingPauseScopeSafe`) |
| VIII.6 Docs | `docs/SAFETY_OPS_RUNTIME.md`, ADR 0061 |

Pure API: `app/lib/safetyOpsCore.ts` — `evaluateSafetyOpsFeature`,
`permanentBanCompletionAllowed`, `SAFETY_OPS_CONSTITUTION_MAP`.

## Related

- `docs/FEATURE_SWARM_TRACKER.md`  
- `docs/NUCLEAR_SWARM.md`  
- `docs/SAFETY_OPS_RUNTIME.md` · ADR 0042 · ADR 0061  
- ADR 0058 local-first · ADR 0059 trauma safety  
