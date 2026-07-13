# Haptic Language Implementation Plan

Status: implementation-authorizing specification
Owner: current coding agent
Task: `HAPTIC-001`

> **Dedicated-device haptics (VCA + LRA, Soft Signal curtain, consent/connection patterns)** are specified in [`docs/HAPTIC_SYSTEM_DEVICE.md`](../HAPTIC_SYSTEM_DEVICE.md) and [ADR 0057](../adr/0057-device-haptic-vca-lra-architecture.md). This document remains the **phone / Expo** implementation plan. Semantic event names must stay aligned across both.

## Intent

Litmo should use haptics as a small, consistent nonverbal vocabulary—not as decoration. The first implementation should support the guided learning experience and the phone-visible demo while remaining optional, accessible, private, and safe.

Primary product idea:

> A gentle haptic can say “I’m here” without demanding attention.

Haptics must reinforce visible and spoken meaning. They must never become the only way Litmo communicates consent, safety, state, failure, or emergency information.

## Product principles

1. **Meaning before sensation.** Every pattern has one documented semantic meaning.
2. **Restraint.** Most taps should produce no haptic. Repetition erases meaning.
3. **No simulated human consent.** A device vibration never represents another person’s agreement, presence, touch, or safety.
4. **User control.** Haptics can be disabled independently of sound and visual feedback.
5. **Accessibility parity.** Every haptic event has a visible equivalent and, where appropriate, VoiceOver-readable feedback.
6. **Fail silently, never fail dangerously.** Unsupported hardware or runtime errors must not block the user flow.
7. **Local only.** Haptic preferences and playback do not create analytics or sensitive event logs.
8. **Consistent vocabulary.** Product surfaces call semantic events, not platform-specific vibration APIs directly.

## Initial vocabulary

Keep the first release to five semantic events.

| Event           | Meaning                            | Suggested platform expression                                                | Initial use                                       |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `presence`      | “You are here; pause and arrive.”  | one gentle/light impact                                                      | onboarding entry, grounding transition            |
| `attention`     | “This deserves a deliberate look.” | two soft impacts with a short interval                                       | consent checkpoint introduction                   |
| `confirmation`  | “Your local action registered.”    | success notification or medium impact                                        | lesson completion, saved preference               |
| `softSignal`    | “The stop/exit signal registered.” | immediate distinct warning pattern, strong enough to notice but not alarming | fictional practice and active-session Soft Signal |
| `emergencyStop` | “Emergency stop registered.”       | strongest available error/warning notification pattern                       | emergency-stop acknowledgement only               |

Do not add additional patterns until these five have been tested on a physical iPhone for recognizability, comfort, and confusion.

## Explicit non-goals

The first slice must not:

- attempt to imitate interpersonal touch;
- encode secret messages between users;
- transmit haptic patterns between devices;
- infer emotional state from device interaction;
- use haptics as proof of consent or acknowledgement by another person;
- vibrate repeatedly for engagement, streaks, rewards, or retention;
- require Core Haptics custom waveform authoring;
- add haptic analytics;
- block Expo Go or non-iOS development.

## Architecture

Create one semantic service owned by the mobile client, for example:

```text
app/src/services/haptics/
  HapticEvent.ts
  HapticService.ts
  HapticPreferences.ts
  __tests__/
```

Adapt paths to the existing repository structure rather than forcing this exact layout.

### Public interface

Prefer a narrow interface such as:

```ts
export type HapticEvent =
  "presence" | "attention" | "confirmation" | "softSignal" | "emergencyStop";

export interface HapticService {
  play(event: HapticEvent): Promise<void>;
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
}
```

Callers must request semantic events. Screens and components must not import `expo-haptics`, UIKit feedback generators, or Core Haptics directly.

### Platform adapter

For the first slice, prefer the existing Expo-compatible haptics package if present; otherwise evaluate `expo-haptics` before adding it. Do not add a native Swift/Core Haptics bridge unless the Expo abstraction cannot satisfy the five-event vocabulary.

The adapter must:

- no-op safely on unsupported platforms;
- catch playback errors;
- respect the local enabled preference;
- avoid throwing into navigation or safety flows;
- expose deterministic mappings that can be unit tested;
- avoid repeated playback during rerenders.

### Preference storage

Store one local preference, defaulting to enabled only when that matches the platform’s conventional behavior. The setting must be visible and changeable in app settings or the most appropriate existing preferences surface.

Preference rules:

- local device storage only;
- no account sync in this slice;
- no sensitive event history;
- changing the toggle may play `confirmation` only when enabling, not when disabling;
- disabling haptics must suppress every event, including emergency acknowledgement, while visible feedback remains intact.

## Integration points

Implement in this order.

### 1. Learning system

Add haptics only at deliberate pedagogical moments:

- `presence`: first entry into a guided module or a dedicated “arrive” step;
- `attention`: before a consent-critical scenario or checkpoint;
- `confirmation`: after a module is completed locally;
- `softSignal`: fictional practice step demonstrating that a stop request registered.

Do not trigger haptics on every Next button, answer choice, card press, or navigation change.

### 2. Soft Signal

When the user activates Soft Signal, play `softSignal` immediately after the local action is accepted. Visible state must update independently. Playback failure must not delay or undo the stop action.

### 3. Emergency stop

When emergency stop is activated, commit the stop action first, then play `emergencyStop` as acknowledgement. Haptic playback must never be awaited before executing the safety transition.

### 4. Consent checkpoints

Use `attention` only to invite a pause before a checkpoint. Never play `confirmation` in a way that could imply both participants agreed when only one local action occurred.

## Accessibility and sensory safety

- Provide an app-level haptics toggle.
- Respect reduced-motion settings where relevant, but do not assume reduced motion always means reduced haptics; keep the explicit toggle authoritative.
- Do not use long, repeating, or escalating vibrations.
- Avoid unexpected haptics on app launch before the user reaches a meaningful screen.
- VoiceOver announcements and visible copy must carry the full meaning without haptics.
- Test while the device is in silent mode and with system haptics disabled.
- Document that simulator behavior is not sufficient validation.

## State and lifecycle rules

- Prevent duplicate playback caused by React rerenders, focus changes, or navigation restoration.
- A semantic event should fire from an explicit user action or one-time state transition.
- Backgrounding or foregrounding must not replay prior haptics.
- Restoring learning progress must not replay completion feedback.
- Rapid repeated Soft Signal or emergency presses must remain idempotent at the product layer and should not create an uncontrolled vibration loop.

## Testing requirements

### Unit tests

Cover:

- each semantic event maps to the intended adapter call;
- disabled preference causes a no-op;
- unsupported platform causes a no-op;
- adapter rejection is swallowed and reported only through non-sensitive development logging if the project permits it;
- preference persistence and malformed-storage fallback;
- duplicate-transition guard where implemented.

Mock the platform haptic library. Tests must not require physical vibration.

### Integration/component tests

Cover:

- completing a learning module requests `confirmation` once;
- entering a designated learning step requests `presence` once;
- consent checkpoint requests `attention` without implying agreement;
- Soft Signal changes state even when haptic playback rejects;
- emergency stop changes state before or independently of playback;
- disabling haptics suppresses calls while visible feedback remains.

### Physical-device validation

Use a real iPhone and record results for:

1. recognizability of all five events;
2. comfort and intensity;
3. silent mode;
4. system haptics disabled;
5. app toggle disabled;
6. VoiceOver active;
7. repeated tapping/idempotency;
8. background/foreground behavior;
9. Expo Go versus development build behavior, where supported;
10. Soft Signal and emergency acknowledgement latency.

Do not claim physical validation unless it was actually performed.

## Documentation requirements for implementation

The implementing agent must update in the same PR:

- `TASKS.md` with status and verification;
- `CURRENT_STATE.md`;
- `docs/CHANGELOG.md`;
- `docs/KNOWN_LIMITATIONS.md`;
- learning-system documentation;
- accessibility documentation or test report;
- dependency/setup documentation if a package is added;
- an ADR if the implementation introduces a new platform dependency, native bridge, or materially different architecture.

## Acceptance criteria

`HAPTIC-001` is complete when:

1. one semantic haptic service exists and direct platform imports are confined to its adapter;
2. the five-event vocabulary is encoded and documented;
3. a local user-controlled haptics setting exists;
4. the guided learning system uses the approved limited integration points;
5. Soft Signal and emergency stop remain functionally independent of playback success;
6. no haptic represents remote consent, trust, safety, or another person’s presence;
7. unit and integration tests cover mappings, preference behavior, failure behavior, and duplicate prevention;
8. accessibility equivalents remain complete without haptics;
9. physical-device validation is documented or explicitly left pending under `BETA-001`;
10. all required documentation is synchronized.

## Autonomous execution sequence

The assigned coding agent should continue without routine questions:

1. Read `AGENTS.md`, `TASKS.md`, this specification, the learning-system docs, Soft Signal implementation, emergency-stop implementation, and current mobile package manifests.
2. Inspect existing haptic dependencies and current preference storage patterns.
3. Record the exact baseline and choose the smallest compatible platform adapter.
4. Implement the semantic service and preference storage with tests.
5. Add the settings control.
6. Integrate the four approved learning touchpoints.
7. Integrate Soft Signal and emergency acknowledgement without coupling safety state to playback.
8. Run relevant lint, typecheck, unit, integration, and state checks.
9. Update all required documentation and record exact command results.
10. Commit coherent units and open a PR.
11. Stop only for a genuine external blocker, an irreversible decision, or physical-device validation that requires the founder.

## Questions reserved for human review

Do not block implementation on these; surface recommendations in the PR:

- whether the default app-level haptic preference should be enabled or inherit a future onboarding choice;
- whether `presence` should occur once per module or once per app learning session;
- whether the final physical patterns are distinct and comfortable enough on the founder’s iPhone;
- whether custom Core Haptics patterns are warranted after the first physical-device study.
