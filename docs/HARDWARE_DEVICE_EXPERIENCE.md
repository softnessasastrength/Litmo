# Litmo hardware device — end-to-end experience design

**Status:** design vision grounded in the current phone app (not a shipping hardware program)  
**Soul source:** Founding Thesis, Constitution, Consent Flow, UX/UI Philosophy, Soft Signal, Touch Language  
**Companion app:** the existing iOS Litmo client remains the place for deep editing, learning modules, and account admin  

> Touch is not a transaction — it is a language.  
> The device is not a phone with an app. It is a room for presence.

This document maps the **complete experience** of a dedicated Litmo hardware device: warm, inviting, single-purpose, optimized for human connection. It reuses the app’s consent architecture and intentionally **removes** general-purpose phone behaviors (infinite scroll, app-switcher, notification junk drawer).

---

## 1. Design north star

### Feeling words

| Word | Means on-device |
| --- | --- |
| **Warm** | Cream paper, soft amber light, rounded type, slow fade — never neon “engagement” |
| **Inviting** | Home always offers one clear next step, never a wall of tabs |
| **Focused** | Only connection-relevant states exist: rest, nearby, review, together, quiet |
| **Safe** | Soft Signal is always reachable in one press; stopping is celebrated as strength |
| **Honest** | No scores, streaks, “someone liked you,” or urgency timers that shame |

### What the device is *for*

1. Be **present** with yourself (boundaries, readiness, soft practice).  
2. Notice **who is carefully nearby** (anonymous → mutual reveal).  
3. **Review and affirm** a Consent Snapshot together.  
4. Hold an **active session** with Soft Signal as the primary control.  
5. Close with **wrap-up** and private quiet — no feed to re-enter.

### What the device is *not*

- Not a phone, browser, or messaging app  
- Not a dating surface or discovery casino  
- Not therapy, crisis care, or a safety certification  
- Not always-on RF or background social radar  

---

## 2. Physical product character (experience constraints)

These hardware assumptions shape the UI. They are product design constraints, not BOM specs.

| Element | Intent |
| --- | --- |
| **Form** | Palm-to-table object: rounded, fabric or soft ceramic feel; stable when set down during a session |
| **Display** | Single calm screen (e-ink-like calm *or* low-glare OLED with cream theme); readable at arm’s length |
| **Primary hardware control** | One physical **Soft Signal** button — raised, distinct texture, always works even if UI freezes |
| **Secondary controls** | Two soft side keys: **Back / leave** and **Confirm** (never “like”) |
| **Haptics** | Same vocabulary as the app: presence, attention, confirm, Soft Signal (optional; off by default in ND quiet) |
| **Light** | Edge glow: moss = calm present; amber = needs attention; soft rose = Soft Signal / stop (never red emergency siren aesthetics) |
| **Audio** | Optional short chimes; no speech unless user opts into ND voice aids |
| **Connectivity** | Wi‑Fi + Bluetooth LE + Multipeer/NFC for careful connect; no cellular app store rabbit hole |
| **Companion** | Phone app for account, deep Touch Language edit, learning library, data rights |

The phone remains the **studio**. The device is the **room**.

---

## 3. Information architecture (device-only)

Phone has tabs. The device has **modes** — few, named by human state, not features.

```text
                    ┌─────────────┐
                    │   RESTING   │  home / presence
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌──────────┐    ┌──────────┐
      │ NEARBY  │    │  INVITE  │    │  TOGETHER│
      │ (radar) │    │ (careful)│    │ (session)│
      └────┬────┘    └────┬─────┘    └────┬─────┘
           │              │               │
           └──────► REVIEW (Snapshot) ◄───┘
                          │
                    ┌─────▼─────┐
                    │   QUIET   │  wrap-up / aftercare
                    └───────────┘
```

**Global overlays (any mode):** Soft Signal · Pause / leave · Lock face

No hamburger. No Settings as a primary surface (settings live as **Care** drawer, rare).

---

## 4. Overall interface feel

### Visual language (carry over from app, simplify)

| Token | Device treatment |
| --- | --- |
| Cream / paper | Full-bleed background; no pure white glare |
| Moss | Primary actions, “ready / present” |
| Ink | Body text, large and unhurried |
| Soft rose / signal | Soft Signal only — never used for marketing CTAs |
| Motion | 200–400ms fades; reduced-motion = crossfade or cut |
| Type | Large serif for titles (presence), clear sans for instructions |

### Interaction rules

1. **One decision per screen** when ND Mode or “one at a time” is on.  
2. **No swipes for consent** (app concept: deliberate taps only).  
3. **Confirm is always slower than Soft Signal** (layout + haptic weight).  
4. **Silence is allowed** — home can be empty of people and still feel complete.  
5. **Copy under stress is short** — Soft Signal screens use ≤2 sentences.

### Ambient home “soul”

When nothing is pending, the home screen is not empty:

> **You’re here.**  
> No one needs anything from you right now.

Optional soft flame or breath ring (Campfire DNA) that honors reduced motion.

---

## 5. Onboarding (first power-on)

Goal: arrive at **Resting** feeling oriented, never overwhelmed. Deep quizzes stay on phone; device onboarding is **boundary + presence**.

### 5.1 Boot sequence

| Step | Screen | Notes |
| --- | --- | --- |
| 0 | Soft glow only | No logo slam; 1 breath of light |
| 1 | **Welcome** | “Litmo. For careful, platonic connection.” Adult-only statement |
| 2 | **What this is / isn’t** | Scrollable calm cards; no skip buried under “agree” |
| 3 | **Pair with phone (optional but recommended)** | QR or NFC to companion app; passkey stays on phone; device gets device binding |
| 4 | **Name yourself** | Display name only; no handle hunting |
| 5 | **How you want this device to feel** | Quiet / balanced / warm presence (maps to ND + haptics) |
| 6 | **Soft Signal practice** | Must press physical Soft Signal once in a safe drill (not a session) |
| 7 | **Touch Language lite** | 4–6 questions only: pressure, time, place vibe, hands/shoulders welcome — full TL on phone |
| 8 | **Nearby off by default** | Explicit: “Radar stays off until you turn it on.” |
| 9 | **You’re ready** | Land on Resting |

### 5.2 Pairing model

```text
Phone (account, passkey, vault)
        │  encrypted pair
        ▼
Device (session presence, Soft Signal, nearby, snapshot review)
```

- Account authority stays phone + server.  
- Device holds a **bound installation** (same soul as `auth_devices`).  
- Unpaired demo mode: fictional practice only, clearly labeled.

### 5.3 Trauma-informed onboarding rules

- Soft Signal practice is framed as **skill**, not scare.  
- No forced photo.  
- No “find friends now” at the end.  
- Exit anytime → Resting with “You can finish setup later on your phone.”

---

## 6. Home screen — **Resting**

The home screen is the emotional center of the product.

### 6.1 Layout (single screen)

```text
┌──────────────────────────────────────┐
│  good afternoon, Maya          🔒    │
│                                      │
│         ( soft presence ring )       │
│                                      │
│     You’re here. Nothing required.   │
│                                      │
│  ┌────────────┐  ┌────────────────┐  │
│  │  Nearby    │  │  Invite someone│  │
│  │  (off)     │  │  carefully     │  │
│  └────────────┘  └────────────────┘  │
│                                      │
│  Open sessions (0) · Practice soft   │
│                                      │
│  [ Care ]                      ◎ Soft│
└──────────────────────────────────────┘
     physical Soft Signal always below
```

### 6.2 States of Resting

| State | Home shows |
| --- | --- |
| Idle | Presence line + two primary actions |
| Invite waiting | One calm card: “Sam is waiting for your review” → open Snapshot |
| Session ready | “You’re both confirmed” → **Begin together** |
| Session active | Home is replaced by **Together** mode |
| After Soft Signal | Brief Quiet: “You stopped. That’s enough.” → Resting |
| Locked | Abstract pattern only; Face ID / passcode via phone or device biometrics if equipped |

### 6.3 What is *not* on home

- Notification center feed  
- Discovery grid of strangers  
- Quiz leaderboards  
- Ads, tips carousels, “complete your profile” nags  

---

## 7. Connecting with people

Connection on the device is **three deliberate paths**, reusing phone features, simplified.

### 7.1 Path A — Nearby (opt-in radar)

Maps to app **Proximity** (ADR 0054).

```text
Resting → Nearby ON (explicit)
       → Anonymous weather cards (no names)
       → Request private handshake
       → Mutual accept
       → Mutual interest
       → Mutual identity reveal
       → Optional Invite / Snapshot
       → Soft Signal / stop radar anytime
```

**UI:** soft constellation or quiet list of anonymous “weather” — never a Tinder stack.  
**Default:** OFF. Timeout turns radio off (same soul as app).  
**Copy:** “Weather resonance only. Not safety. Not consent.”

### 7.2 Path B — Careful invite (known person)

Maps to **session request** + optional **NFC / QR / Multipeer**.

```text
Resting → Invite carefully
       → Choose: Nearby person | Scan / show code | From phone contacts of trust*
       → Send request (not consent)
       → Wait in calm “holding space”
       → Both enter Snapshot review
```

\*Device does not become a contact book; it shows **people already in a careful relationship on phone**, synced as first-name + avatar optional.

### 7.3 Path C — Co-located Snapshot (together in a room)

Maps to **Consent Snapshot** + **Nearby Share / NFC**.

```text
Two devices / device + phone
  → Share snapshot review (encrypted QR / Multipeer / NFC)
  → Each person Accept carefully
  → Side-by-side or turn-taking review of the same rows
  → Each confirms independently
  → Ready → Begin together
```

**Room mode:** larger type, fewer rows per page, “Next boundary” not infinite scroll.

### 7.4 Connection principles (device)

| Principle | UI expression |
| --- | --- |
| Request ≠ consent | After invite: “They can say no without explaining.” |
| No ghost pressure | Waiting screens never show “still waiting…” guilt |
| Decline is first-class | Soft Signal-sized **Not now** on invites |
| Identity is gated | Names only after mutual reveal (proximity path) |
| Fail closed | Missing snapshot → cannot Begin |

---

## 8. Consent Snapshot on device — **Review**

This is the sacred surface. Optimize for co-reading.

### 8.1 Screen structure

```text
CONSENT SNAPSHOT
Read every boundary before you agree.

┌ Kind of connection ──────────────┐
│ Held presence, seated            │
├ Pressure ────────────────────────┤
│ Soft to medium                   │
├ Time ────────────────────────────┤
│ Up to 20 minutes                 │
├ Welcomed ────────────────────────┤
│ Hands, upper back                │
├ Ask each time ───────────────────┤
│ …                                │
├ Not included ────────────────────┤
│ All other body areas             │
└──────────────────────────────────┘

○ Yes — this matches what I agree to now
○ No — I want to change or stop

[ Soft Signal — leave without granting ]
[ Confirm this snapshot ]   (only if Yes)
```

### 8.2 Device-specific affordances

- **Physical Confirm** key only works after “Yes” is selected (double gate).  
- **Partner status** as gentle text: “Waiting for their confirmation” — not a progress bar that induces pressure.  
- **Audio optional:** ND Mode can read each row aloud.  
- **Never** auto-advance.

---

## 9. Together mode — active session

```text
YOU’RE BOTH HERE

        12:04
      elapsed

A gentle check-in
Are breath, shoulders, and attention still saying yes?

┌─────────────────────────────────┐
│                                 │
│     SOFT SIGNAL — end now       │  ← largest control
│                                 │
└─────────────────────────────────┘

[ End together ]     [ Pause quietly ]
```

### Rules

- Soft Signal is **hardware + on-screen**; either fires the same reason-free stop.  
- Pause does not require the other person’s approval to *request* quiet; resume requires mutual calm confirm.  
- No chat feed. Optional one-tap “need a moment” soft pulse to the other device (not a message thread).  
- Timer is soft; not a countdown to shame.

---

## 10. Quiet — aftercare / wrap-up

After Soft Signal or End together:

```text
You stopped. Nothing more is required.

Optional private note (stays on phone when synced)
[ Skip ]
[ Save quietly ]
```

Then Resting. No “rate your partner.” No public review.

---

## 11. Notifications — careful signals only

Phone notifications are generic; the **device** can be more ambient because it is single-purpose — still never leak intimate detail on a lock surface.

### 11.1 Device signal types

| Signal | When | Presentation |
| --- | --- | --- |
| **Presence** | Trusted invite arrives | Soft amber edge + one chime; lock shows “Someone is waiting carefully” |
| **Attention** | Snapshot ready to read | Moss pulse; “A boundary map is ready” |
| **Together** | Both confirmed | Warm double glow; “You may begin when ready” |
| **Soft stop** | Peer Soft-Signaled | Immediate rose edge; “Session ended. You’re okay to stop.” |
| **Radar timeout** | Nearby auto-off | Silent return to Resting |

### 11.2 Rules

- **No** message previews of boundaries or names on the always-on lock face.  
- **No** badge counts that create FOMO.  
- **Quiet hours** default on for ND / quiet preference.  
- All signals dismissible with Back; Soft Signal never buried.  
- If device is face-down / “Do not disturb presence,” only Soft Signal peer events break through (safety-relevant stop).

### 11.3 Relationship to phone push

Phone still gets generic push when device is off. Device does not replace phone for account security alerts.

---

## 12. Care drawer (rare settings)

Opened from Resting → **Care** (not “Settings”).

| Item | Behavior |
| --- | --- |
| Nearby master switch | Off by default |
| Quiet / ND feel | Maps to Neurodivergent Mode preferences |
| Haptics | On/off |
| Voice read-aloud | On/off |
| Soft Signal test | Safe practice |
| Lock now | Immediate privacy cover |
| Unpair device | Fail-closed; requires phone confirm |
| About Litmo | Limits: not clinical, not emergency |

Deep account, passkeys, export/erase → **open on phone**.

---

## 13. End-to-end journey map (day in the life)

### Journey 1 — Solo evening (no social)

```text
Power on → Resting
Optional: Soft Signal practice / breath ring
Nearby stays off
Power down or sleep
```

Feeling: the device can be a **companion for presence**, not only for meeting people.

### Journey 2 — Two friends, planned hang

```text
Both Resting
A: Invite carefully → B receives Presence signal
Both: Review Snapshot (device or device+phone)
Both: Confirm
Together: held presence, timer soft
Either: Soft Signal or End together
Quiet → Resting
```

### Journey 3 — Opt-in nearby at a known gathering

```text
Resting → Nearby ON (spoken intention: “I’m open to careful hello”)
Anonymous weather appears
Handshake → mutual interest → names
Optional Snapshot if both want touch later
Soft Signal radar off when done
```

### Journey 4 — “I need out” mid-session

```text
Together → press hardware Soft Signal
Immediate stop both devices
Quiet: “You stopped. That’s enough.”
No explanation field
```

---

## 14. Mapping from current app → device

| Phone app surface | Device mode | Optimization |
| --- | --- | --- |
| Home tab | Resting | Presence-first, fewer CTAs |
| Discover | Nearby (subset) | Anonymous-first, opt-in only |
| Match / request | Invite carefully | One-thread waiting space |
| Consent Snapshot | Review | Large type, co-read, double gate |
| Active session | Together | Soft Signal hardware primacy |
| Wrap-up | Quiet | Shorter, optional |
| Quizzes / Learn | Phone (or future “Practice” lite) | Keep device free of long forms |
| Settings / security | Care + phone | Passkeys stay phone-primary |
| Multipeer / NFC / QR | Invite + Nearby tools | Same consent ladder, bigger targets |
| Passkey + Face ID | Device lock + phone account | Device binding for consent (AUTH-003 soul) |

---

## 15. Accessibility & neurodivergence (device)

- **One-at-a-time** is the default device layout (phone ND Mode teaches the pattern).  
- Physical Soft Signal is non-visual, non-color.  
- Dynamic Type up to very large; rows reflow.  
- Reduced motion: no breath ring animation.  
- VoiceOver: every mode announces state on entry (“Resting. Nearby is off.”).  
- No timed auto-advance on Snapshot.  
- Haptics optional; meaning always in text + shape.

---

## 16. Safety & product constraints (non-negotiable)

Carried from the app constitution onto hardware:

1. Consent is session-specific and revocable.  
2. Profiles, vibes, radar, and history never grant touch.  
3. Soft Signal requires no reason and no peer permission.  
4. Strictest boundary wins in Snapshot.  
5. Fail closed when data is missing or device unbound.  
6. No public safety scores on device chrome.  
7. Not emergency services — lock-screen and About state this calmly.  
8. RF features default off; easy stop.

---

## 17. Content voice (device microcopy bank)

| Moment | Copy |
| --- | --- |
| Resting empty | “You’re here. Nothing required.” |
| Nearby off | “Nearby is off. Turn on only when you mean to be findable.” |
| Invite sent | “Request sent. They can decline without explaining.” |
| Snapshot title | “Read every boundary before you agree.” |
| Waiting on peer | “Your yes is recorded. Waiting for theirs — no rush.” |
| Soft Signal | “Session ended. You don’t owe an explanation.” |
| Decline invite | “Not now. That’s a complete answer.” |
| Radar timeout | “Nearby turned off to protect your quiet.” |

---

## 18. What we deliberately leave on the phone

To keep the device single-purpose:

- Full Vibe Quiz (100) and deep self-quizzes  
- Guided Learning curriculum library  
- Passkey management, export, erasure requests  
- Staff / moderation tools  
- Long profile editing and bio  
- Multi-account / developer diagnostics  

The device may deep-link “Continue on phone” with a calm QR.

---

## 19. Open design questions (for later product decisions)

These are **not** implementation authorization:

1. Screen tech: low-glare OLED vs reflective calm panel  
2. Whether device has its own biometrics or only phone unlock  
3. Multi-person “circle” hardware (Campfire) vs two-person first  
4. Battery / always-warm presence light tradeoffs  
5. Whether device stores any offline snapshot rows at rest (prefer phone vault)

---

## 20. Success criteria (experience)

The hardware experience is right if:

- A tired person can power on and feel **less alone without pressure**.  
- Two careful adults can go **invite → snapshot → together → stop** without a phone UI maze.  
- Soft Signal is **faster and more obvious** than continuing.  
- Turning people-finding **off** feels like relief, not missing out.  
- Someone can use the device **only as a presence object** and still feel it was designed for them.

---

## Related

- [Founding Thesis](philosophy/00_Founding_Thesis.md)  
- [Concept](CONCEPT.md)  
- [Consent Flow](CONSENT_FLOW.md)  
- [Proximity Layer](PROXIMITY_LAYER.md)  
- [NFC Features](NFC_FEATURES.md)  
- [Authentication](AUTHENTICATION.md)  
- [UX/UI Philosophy](../documents/UX_UI_PHILOSOPHY.md)  
- Phone app: `app/`  

---

*This is experience architecture for a possible Litmo device. It does not claim hardware is in production or authorize manufacturing.*
