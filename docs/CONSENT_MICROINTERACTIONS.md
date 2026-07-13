# Consent micro-interactions — Apple-level granularity

**Status:** canonical product grammar  
**Code:** `app/lib/consentInteractionCore.ts`  
**Version:** 1  
**In-code bar:** [`CODE_COMMENT_STANDARD.md`](CODE_COMMENT_STANDARD.md) (WHAT / WHY / CONSENT / EDGE / NEVER)

> We are granular about consent at the same level Apple obsesses over button  
> animations and system behavior. Every consent point is intentional, clear,  
> and philosophically consistent. **No hand-waving.**

## Design law

| Law | Spec |
| --- | ---- |
| **Grant is slow** | Dual seal arms only after all required toggles + `grantArmDwellMs` (320ms) |
| **Withdraw is fast** | Soft Signal local commit `0ms`; UI settled by `120ms` budget |
| **Stop < Continue** | `softSignalLocalCommitMs < grantConfirmArmMs` (enforced in tests) |
| **Weight hierarchy** | Soft Signal 100 → dual seal 70 → share accept 40 → informational 10 |
| **Meaning never color-only** | Labels, roles, shape, position |
| **No reason at stop** | Forbidden label set rejects “why did you stop” |
| **Prepare ≠ consent** | Declaration authorizes nothing mutual |
| **Learning ≠ real** | Scenario choices are `inform` kind |

## Operating doctrine (maximum detail)

From now on every consent UI change is reviewed against this file as if it were
HIG for human safety. Ship nothing that hand-waves “users will understand.”

| Obsess over | Spec home |
| ----------- | --------- |
| Timing | `CONSENT_TIMING` |
| Color role | `CONSENT_VISUAL` (withdraw = signal rose; grant = moss) |
| Gestures | `CONSENT_GESTURES` (no swipe-to-consent; Soft Signal = single tap / hardware) |
| Edge cases | `CONSENT_EDGE_CASES` (13 explicit outcomes) |
| Motion | `consentMotionDurationMs` + ban spring bounce on consent |
| Arming | `useConsentGrantArm` + progress bar “Arming…” |
| Accept gates | `ConsentAcceptGate` for NFC/TL/share |

## Timing table (ms)

| Token | Value | Intent |
| ----- | ----- | ------ |
| `softSignalLocalCommitMs` | **0** | Body is free before beauty |
| `softSignalUiStoppedByMs` | 120 | UI must show stopped |
| `softSignalCoverEaseMs` | 280 | Cover may ease *after* end |
| `grantArmDwellMs` | 320 | Anti-accidental seal |
| `grantConfirmArmMs` | 400 | Confirm may not lead Soft Signal ease |
| `toggleDebounceMs` | 180 | Motor intentionality on checkboxes |
| `postTapAutoAcceptMs` | **null** | Never auto-accept NFC/QR |
| `reducedMotionMaxMs` | 80 | ND / Reduce Motion cap |

## Consent point catalog

Full typed inventory in code: `CONSENT_POINTS`.

### Withdraw (always offline-capable Soft Signal family)

| ID | Authorizes |
| -- | ---------- |
| `soft_signal_active` | End active session |
| `soft_signal_practice` | Practice only |
| `soft_signal_panic` | End + cover (stop never delayed) |
| `soft_signal_quick_exit` | End + wrap-up |
| `soft_signal_timeout` | Time-boundary end |
| `soft_signal_proximity` | Kill nearby RF/keys |
| `snapshot_withdraw` | Void seal path |
| `block_and_leave` | Private block + leave |

### Grant (deliberate)

| ID | Authorizes |
| -- | ---------- |
| `snapshot_mutual_self_affirm` | Your yes to fingerprint |
| `snapshot_mutual_partner_affirm` | **Demo-labeled** partner role |
| `snapshot_dual_seal` | Both sealed same package |
| `session_engine_confirm` | Server fingerprint confirm |
| `session_end_together` | Calm mutual complete (never replaces Soft Signal) |

### Prepare / share / inform

| ID | Authorizes |
| -- | ---------- |
| `snapshot_prepare_declaration` | Your side only |
| `snapshot_soft_signal_ack` | Understanding Soft Signal |
| `share_tl_accept` | Review-only TL |
| `share_local_accept` | Nearby review payload |
| `share_quiz_compare` | Weather compare after dual gates |
| `nfc_post_tap_accept` | Accept after NFC (scan ≠ accept) |
| `qr_invite_accept` | Accept after decode |
| `proximity_identity_reveal` | Names after mutual interest |
| `request_decline` | Complete no |
| `privacy_notice_accept` | Notice only |
| `backup_opt_in` | Ciphertext backup |
| `learning_scenario_choice` | **Never real consent** |

### First-open onboarding (`onboard_*`)

Canonical frame-by-frame flow: [`ONBOARDING_CONSENT_FLOW.md`](ONBOARDING_CONSENT_FLOW.md).

| ID | Authorizes |
| -- | ---------- |
| `onboard_welcome_continue` | Open entry choice only |
| `onboard_entry_demo` | Local fictional demo (no account) |
| `onboard_entry_signin` | Begin passkey sign-in |
| `onboard_entry_signup` | Begin registration |
| `onboard_platonic_adult_ack` | Purpose ack (adults, platonic) — not age proof |
| `onboard_age_self_report` | Demo/about-you 18+ self-report only |
| `onboard_age_apple_range` | Coarse adult eligibility (real accounts) |
| `onboard_age_dev_attest` | Dev-only self-attest outside production |
| `onboard_profile_name` | Display name |
| `onboard_profile_gender` | Gender self-describe |
| `onboard_profile_orientation` | Orientation self-describe (never safety) |
| `onboard_vibe_answer` | Weather scene only |
| `onboard_vibe_keep` | Keep vibe profile (not snapshot) |
| `onboard_touch_language_save` | Preference starting point |
| `onboard_boundary_zone` | Future zone preference |
| `onboard_boundary_hard_stop` | Absolute hard stop tag |
| `onboard_boundary_private_note` | Private note (not shared by default) |
| `onboard_boundary_save` | Persist map; open home — still no session consent |
| `onboard_nd_default_demo` | Calm defaults on demo entry (device-local) |

**Law:** finishing onboarding never seals a Consent Snapshot and never authorizes touch.

## Phase machines

### Soft Signal

```text
idle → firing (press) → local_ended (0ms) → syncing? → settled
```

Never: arm → confirm → stop.

### Dual seal grant

```text
idle → reading → selecting toggles → armed (dwell) → confirming → sealed
                                         ↘ withdrawn (anytime, no dwell)
```

## UI components

| Component | Role |
| --------- | ---- |
| `SoftSignalButton` | Withdraw weight 100; `sticky` mode for active session |
| `ConsentAffirmRow` | Debounced grant/prepare toggles with a11y checkbox |

## Implementation map

| Surface | Point IDs |
| ------- | --------- |
| Active session sticky | `soft_signal_active` |
| Mutual seal | `snapshot_mutual_*`, `snapshot_dual_seal`, `snapshot_withdraw` |
| Prepare | `snapshot_prepare_declaration`, `snapshot_soft_signal_ack` |
| Practice | `soft_signal_practice` |
| Panic / quick exit | `soft_signal_panic`, `soft_signal_quick_exit` |
| Proximity hub | `soft_signal_proximity` |

## Agent / review checklist

Before shipping a new consent-touching UI:

1. [ ] Add or reuse a `ConsentPointId`  
2. [ ] `kind` correct (`withdraw` vs `grant` vs `prepare` vs `share`)  
3. [ ] `neverMeans` includes non-claims  
4. [ ] Soft Signal: `requiresArm: false`, `worksOffline: true`, weight ≥ 90  
5. [ ] Grant: arm if dual seal; dwell via `mayEnableGrantConfirm`  
6. [ ] Labels pass `labelViolatesConsentGrammar`  
7. [ ] A11y label + hint; min touch target  
8. [ ] Unit test or micro-rule if new timing law  
9. [ ] Update this doc if catalog grows  

## Visual roles

| Role | Theme fill | Non-color cue |
| ---- | ---------- | ------------- |
| withdraw | `signal` (rose) | Soft Signal / Withdraw label + thick border |
| grant | `moss` | Seal / Confirm primary |
| share | `moss` | “Accept carefully — not consent” |
| demo | `apricot` | DEMO banner uppercase |
| decline | `signal` | Not now / Decline |

**Never** use moss for Soft Signal. **Never** use signal rose for dual seal.

## Gesture policy

- Soft Signal: single tap or hardware button. **Forbidden:** swipe-only, long-press-required, confirm dialog before stop.
- Grant: single tap after arm. **Forbidden:** swipe to agree, default-selected Yes.
- Share/NFC: single Accept after review. **Forbidden:** auto-accept on scan/decode.

## Edge cases (must not invent softer behavior)

See `CONSENT_EDGE_CASES` in code — includes double-tap Soft Signal, Soft Signal while sealing, offline stop, pre-dwell seal tap, stale fingerprint, unlabeled demo, scan without accept, reduced motion, Dynamic Type, background radar, one-party affirm.

## Tests

```bash
cd app && node --experimental-strip-types --test lib/consentInteractionCore.test.ts
```

Enforces: stop faster than grant; Soft Signal offline + no arm; prepare ≠ consent; learning ≠ real; forbidden labels; visual roles; gesture bans.

## Related

- [Living Constitution](LITMO_CONSTITUTION.md)  
- [Constitution enforcement](CONSTITUTION_ENFORCEMENT.md)  
- [Soft Signal](SOFT_SIGNAL.md)  
- [Consent Snapshot system](CONSENT_SNAPSHOT_SYSTEM.md)  
- UX philosophy: friction only when it protects consent  
