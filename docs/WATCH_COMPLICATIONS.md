# Apple Watch Complications — Nuclear Spec v0.2

**This is currently a personal emotional containment system, not a public product.**

Soft Signal access + daily reassurance on the wrist. Fail-closed. Offline-first. Soft Signal freeness **outranks** engagement.

---

## Complications (nuclear autism)

| Complication | Family | Behavior |
| ------------ | ------ | -------- |
| **Soft Signal** | Circular / Graphic Corner / Rectangular | One-tap Soft Signal entry. Always visible priority. Never buried under FOMO. |
| **Reassurance Pulse** | Modular / Inline / Circular | Cycles local soft lines hourly. No partner status. |
| **Dual-bind reminder** | Rectangular / Inline / Circular | “Need ∧ Leave-fear can coexist” — 2h calm rotation, not notification spam. |
| **Containment Hub** (intent) | Extra large | Shortcut into phone hub via Watch Connectivity. |

### Soft Signal rules

- Soft Signal complication **must not** require scrolling past social metrics.  
- Tap → haptic Soft Signal phrase + open phone Soft Signal path if reachable.  
- If offline: local Watch Soft Signal haptic still fires (session kill best-effort later).  

### Reassurance rules

- **No push notifications** for reassurance (creepy + FOMO).  
- Timeline updates at calm intervals (hourly) or on-demand reload.  
- Copy from local vocabulary only; never partner messages.  

### Local reassurance vocabulary (v0.2)

- Need is not a crime  
- Soft Signal free  
- You are not too much  
- Both poles allowed  
- Exit is success  
- Intensity ≠ unlovable  
- Conflict ≠ exile  
- Delay ≠ discard  
- Parallel play is sacred  
- Repair is allowed  
- Silence can be co-regulation  
- You can soft-signal anytime  

### Privacy hard no

- No partner location  
- No “they haven’t replied” complication (abandonment fuel)  
- Soft Signal freeness > engagement  

---

## Implementation map

| Path | Role |
| ---- | ---- |
| `watch/Sources/LitmoWatchWidgets/SoftSignalComplication.swift` | Soft Signal widget + **WidgetBundle** (`@main`) |
| `watch/Sources/LitmoWatchWidgets/ReassuranceComplication.swift` | Reassurance complication |
| `watch/Sources/LitmoWatchWidgets/DualBindComplication.swift` | Dual-bind both/and reminder |
| `docs/WATCH_INTEGRATION.md` | Broader Watch architecture |
| ADR 0064 | Co-regulation principles |

### WidgetBundle (v0.3)

```swift
@main
struct LitmoWatchWidgets: WidgetBundle {
  var body: some Widget {
    SoftSignalWidget()
    ReassuranceComplication()
    DualBindComplication()
  }
}
```

---

## Phone companion deep links (intent)

- `litmo://soft-signal/practice`  
- `litmo://too-much`  
- `litmo://containment`  
- `litmo://need-scared`  

---

**Last updated:** 2026-07-13
