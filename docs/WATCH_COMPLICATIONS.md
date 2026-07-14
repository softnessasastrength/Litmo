# Apple Watch Complications — Nuclear Spec v0.1

**This is currently a personal emotional containment system, not a public product.**

Soft Signal access + daily reassurance on the wrist. Fail-closed. Offline-first.

---

## Complications (nuclear autism)

| Complication | Family | Behavior |
| ------------ | ------ | -------- |
| **Soft Signal** | Circular / Graphic Corner / Rectangular | One-tap Soft Signal entry (or deep link to practice). Always visible priority. Never buried under FOMO. |
| **Reassurance Pulse** | Modular / Inline | Cycles short lines: “Need is not a crime” · “Soft Signal free” · “You are not too much”. Local strings only. |
| **Dual-bind reminder** | Modular small | “Need ∧ Leave-fear can coexist” — not a notification spam. |
| **Containment Hub** | Extra large (when available) | Shortcut into phone hub (Watch Connectivity open companion). |

### Soft Signal rules
- Soft Signal complication **must not** require scrolling past social metrics.
- Tap → haptic Soft Signal phrase + open phone Soft Signal path if reachable.
- If offline: local Watch Soft Signal haptic still fires (session kill best-effort later).

### Reassurance rules
- No push notifications for reassurance (creepy + FOMO).
- Complication **timeline** updates at calm intervals (e.g. hour) or on-demand reload.
- Copy from local vocabulary; never partner messages.

### Privacy
- No partner location.
- No “they haven’t replied” complication (that is abandonment fuel).
- Soft Signal freeness > engagement.

---

## Implementation map

| Path | Role |
| ---- | ---- |
| `watch/Sources/LitmoWatchWidgets/SoftSignalComplication.swift` | Soft Signal entry |
| `watch/Sources/LitmoWatchWidgets/ReassuranceComplication.swift` | Daily reassurance |
| `docs/WATCH_INTEGRATION.md` | Broader Watch architecture |
| ADR 0064 | Co-regulation principles |

---

## Phone companion deep links (intent)

- `litmo://soft-signal/practice`
- `litmo://too-much`
- `litmo://containment`

---

**Last updated:** 2026-07-13
