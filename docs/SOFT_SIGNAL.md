# Soft Signal system

**Status:** implemented in-app; hardware bridge ready for future device  
**Routes:** active session control · `/soft-signal/practice` · `/soft-signal/log`

> Soft Signal ends a session **immediately**.  
> No explanation. No penalty. No social negotiation.  
> It is **success to stop safely** — never failure.

## Product invariants

1. **Impossible to miss** — primary control on active session: large signal button, protective banner, border weight, label + a11y (not color-only).  
2. **Local stop first** — UI ends before/despite network; pending sync never re-enables the session.  
3. **Emotionally safe** — copy never blames, never requires a reason at stop time.  
4. **In-app + hardware** — same semantic fire path; hardware receives `SoftSignalHardwareCommand`.  
5. **Personal log** — private device records for the user only; optional journal note *after* stop.  
6. **Not crisis services** — always disclosed.

## Fire order (`softSignalService.fire`)

```text
1. Decide local end (caller freezes UI)
2. Remote withdraw when sessionId present (emergencyStopService)
   — failure → pending_sync, still ended locally
3. Append personal log entry (fail open if storage fails)
4. Haptic softSignal (never gates stop)
5. Hardware emit warmDescent / breathLeave (never gates stop)
6. Return result + navigate to wrap-up
```

## Personal log (private)

Stored in Secure Store (`litmo.soft_signal.log.secure.v1`):

| Field | Notes |
| --- | --- |
| firedAt | When you stopped |
| source | active_session, practice, hardware_device, … |
| outcome | stopped_local / stopped_synced / pending_sync / practice_only |
| sessionId | Opaque optional |
| privateJournalNote | Optional, after the fact, max 500 chars |
| flags | noExplanationRequired, notEmergencyServices |

Never a public score. Never shared with partners automatically.

## Hardware contract

```ts
SoftSignalHardwareCommand {
  v: 1
  kind: "soft_signal"
  patternId: "warmDescent" | "breathLeave"  // see HARDWARE/HAPTICS.md
  intensity: "primary" | "gentle"
  preempt: true
  localOnly: true
  visualHint: "calm_end_field"
  firedAt: ISO
}
```

Phone uses `nullSoftSignalHardware` until a native module is registered via `setSoftSignalHardwareBridge`.

## Code map

| Path | Role |
| --- | --- |
| `app/lib/softSignalCore.ts` | Types, copy, parse, hardware command |
| `app/services/softSignalService.ts` | Orchestration |
| `app/services/softSignalLogStore.ts` | Private log persistence |
| `app/services/softSignalHardware.ts` | Device bridge |
| `app/components/SoftSignalButton.tsx` | Impossible-to-miss control |
| `app/app/session/active.tsx` | Live session Soft Signal |
| `app/app/soft-signal/practice.tsx` | Practice without a peer |
| `app/app/soft-signal/log.tsx` | Personal records |

Server authority for real sessions remains `withdraw_session_consent` (see `CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md`).
