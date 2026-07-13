# Litmo Device OS

**Status:** design vision (not a shipping OS or SKU)  
**Version:** 1.0 · 2026-07-13  
**Canonical path:** `docs/HARDWARE/DEVICE_OS.md`  
**Companion docs:** [Hardware device experience](../HARDWARE_DEVICE_EXPERIENCE.md) · [Haptics](HAPTICS.md) · [Soft Signal](../SOFT_SIGNAL.md) · [Consent Snapshot](../CONSENT_SNAPSHOT_SYSTEM.md) · [Proximity](../PROXIMITY_LAYER.md) · [UX philosophy](../../documents/UX_UI_PHILOSOPHY.md)

> The device does **one thing only**: facilitate safe human connection.  
> Everything else is out of scope — not hidden in a drawer, **not on the device**.  
> Touch is not a transaction. It is a language.  
> The OS is not a phone. It is a **room for presence**.

This document designs the **entire operating surface** from cold power-on to shutdown: shell, modes, chrome, inputs, power, failure, and every human-visible state. Product journeys (nearby, snapshot, session) are specified here as **OS modes**; deeper feature behavior remains in the companion docs above.

---

## 0. One-sentence OS thesis

**Litmo OS is a single-purpose presence system that can only rest, carefully meet, mutually consent, stay together, stop freely, and be quiet — and nothing that competes with those verbs.**

---

## 1. Design north star

### 1.1 Feeling words (OS-level)

| Word | OS expression |
| ---- | ------------- |
| **Warm** | Cream field, soft amber edge light, rounded type, 200–400ms fades, sparse haptics that answer rather than demand |
| **Simple** | At most **one primary decision** on screen; two soft secondaries; one global Soft Signal |
| **Zero distraction** | No app switcher, no browser, no feed, no badges that create FOMO, no tips carousel, no “someone liked you” |
| **Safe** | Soft Signal always wins; fail closed on consent; RF off by default |
| **Honest** | No scores, streaks, rankings, or implied safety certification |

### 1.2 The only product job

Facilitate **safe, non-sexual, platonic physical connection** between consenting adults by making:

1. **Presence** easy (you are here; nothing required)  
2. **Finding carefully** optional (nearby / invite — never casino discovery)  
3. **Consent** explicit (same current snapshot, dual affirm)  
4. **Togetherness** held (timer soft; Soft Signal primary)  
5. **Stopping** free (no explanation, no peer permission)  
6. **After** private (quiet wrap; return to rest)

If a proposed OS feature does not serve one of these six, it **does not ship on the device**.

### 1.3 Explicit non-jobs (OS bans)

The following are **not implementable** as first-class OS surfaces (they live on the phone companion or nowhere):

| Banned on device OS | Why |
| ------------------- | --- |
| App store / sideload apps | Single purpose dies |
| Browser / web view rabbit holes | Attention extraction |
| Infinite discovery grid / swipe deck | Casino mechanics |
| Chat / DMs as primary | Turns device into a phone |
| Notification junk drawer + badge FOMO | Anxiety as product |
| Public scores, streaks, leaderboards | Shame and performance |
| Ads, tips carousels, growth nags | Distrust |
| Background always-on social radar | Privacy + nervous-system load |
| Full quiz library / deep learning curriculum | Studio stays on phone |
| Passkey admin, export, erase, multi-account | Account vault stays on phone |
| Camera social, stories, clips | Not connection infrastructure |

---

## 2. Hardware assumptions (OS contract)

These are **experience constraints** the OS is written against — not a BOM.

| Element | OS contract |
| ------- | ----------- |
| **Form** | Palm-to-table; stable when set down mid-session |
| **Display** | One calm screen (low-glare OLED *or* reflective calm panel); cream theme; readable at arm’s length |
| **Soft Signal** | Dedicated **physical** button — raised, distinct texture, interrupt-level path (works if UI freezes) |
| **Confirm** | Soft physical key — slower path than Soft Signal; never labeled “like” |
| **Back / leave** | Soft physical key — exit one layer; never traps |
| **Touch** | Full surface for deliberate taps; **no swipe-to-consent** |
| **Haptics** | Soft Edge vocabulary ([HAPTICS.md](HAPTICS.md)); silence default; meaning always in visual |
| **Edge light** | Moss = present · Amber = careful attention · Soft rose = Soft Signal / stop (never siren red) |
| **Audio** | Optional short chimes only; speech only if user opted into voice aids |
| **Radios** | Wi‑Fi + BLE + Multipeer/NFC for careful connect; **no** cellular app-store lifestyle |
| **Companion** | Phone = studio (account, deep Touch Language, learning, data rights) |

**Rule:** Confirm is always **harder / slower** than Soft Signal (layout weight + haptic weight + optional double-gate).

---

## 3. OS architecture

### 3.1 Not a phone OS with one app

```text
┌─────────────────────────────────────────────────────────┐
│                    LITMO DEVICE OS                      │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Presence   │  │   Consent    │  │  Connection   │  │
│  │  kernel     │  │   kernel     │  │  kernel       │  │
│  │  Resting    │  │  Snapshot    │  │  Nearby/Invite│  │
│  │  Quiet      │  │  dual affirm │  │  radios gated │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         └────────────────┼──────────────────┘           │
│                          ▼                              │
│              Soft Signal interrupt (highest)            │
│                          │                              │
│              ┌───────────▼──────────┐                   │
│              │ Together (session)   │                   │
│              └──────────────────────┘                   │
│                                                         │
│  No window manager · No app switcher · No background    │
│  social processes without explicit mode entry           │
└─────────────────────────────────────────────────────────┘
```

There is **one continuous experience**, not apps. Modes are **exclusive** (one foreground mode). Global interrupts: Soft Signal, lock, power.

### 3.2 Mode machine (canonical)

```text
                         ┌────────────┐
            power on ───►│   BOOT     │
                         └─────┬──────┘
                               ▼
                         ┌────────────┐
              first run? │  WELCOME   │──► (once) ──┐
                         └─────┬──────┘             │
                               │ no                 │
                               ▼                    │
                         ┌────────────┐             │
                    ┌───►│   LOCK     │◄────────────┤
                    │    └─────┬──────┘             │
                    │          ▼ unlock             │
                    │    ┌────────────┐             │
                    │    │  RESTING   │◄────────────┘
                    │    │  (home)    │
                    │    └─┬──┬──┬──┬─┘
                    │      │  │  │  │
           sleep/   │      │  │  │  └──► CARE (drawer)
           timeout  │      │  │  └──► PRACTICE (Soft Signal drill)
                    │      │  └──► INVITE / NEARBY ──► REVIEW
                    │      └──► (session ready) ──► TOGETHER
                    │                                  │
                    │         Soft Signal / End        │
                    │                  ▼               │
                    │            ┌──────────┐          │
                    │            │  QUIET   │──────────┘
                    │            └──────────┘
                    │
                    └── power button hold ──► SHUTDOWN
```

| Mode | Human meaning | Radios | Soft Signal |
| ---- | ------------- | ------ | ----------- |
| **Boot** | Device waking | Off | N/A (until UI live) |
| **Welcome** | First-run orientation | Off | Practice at end of path |
| **Lock** | Privacy cover | Off (or frozen) | Peer-stop only if session was active (see §9) |
| **Resting** | You’re here; nothing required | Off default | Practice available |
| **Nearby** | Opt-in careful findability | On while mode open | Stops radar + any pending social |
| **Invite** | One careful request thread | Minimal | Cancels local request path |
| **Review** | Consent Snapshot co-read | Pairing only | Leaves without granting |
| **Together** | Active session | Session channel | **Ends session immediately** |
| **Quiet** | Aftercare; private | Off | Already stopped |
| **Care** | Rare device feel settings | Off | Test Soft Signal |
| **Practice** | Soft Signal muscle memory | Off | Fires practice-only |
| **Shutdown** | Full power off | Off | N/A |

### 3.3 Global chrome (always true)

```text
┌────────────────────────────────────────┐
│  [mode name · one calm status line]    │  ← optional, can hide in Together
│                                        │
│           ( content — one decision )   │
│                                        │
│  [ secondary ]          [ primary ]    │  ← max two soft actions
└────────────────────────────────────────┘
        ════════ Soft Signal ════════       ← physical + on-screen in Together
```

**Rules:**

1. No hamburger. No tab bar. No notification shade.  
2. **Care** is a rare drawer from Resting — not a system settings app.  
3. Status never shows intimacy previews (boundary text, names on lock).  
4. Soft Signal is **never** inside a menu.

### 3.4 Process model (zero distraction)

| Allowed concurrent work | Forbidden |
| ----------------------- | --------- |
| One foreground mode UI | Multi-window, split screen |
| Soft Signal interrupt service | Background discovery scrapers |
| Bound-device auth heartbeat (minimal) | Feed prefetch, ad sync |
| Session channel while Together | Chat push storms |
| Local haptic / light compositor | Engagement analytics pipelines |

When user leaves Nearby, **radios for social discovery stop**. No “keep hunting while you sleep.”

---

## 4. Visual & motion OS language

### 4.1 Tokens

| Token | Use |
| ----- | --- |
| **Cream field** | Full-bleed background — never pure white glare |
| **Ink** | Body, unhurried, large |
| **Moss** | Primary calm actions, “present / ready” |
| **Amber edge** | Needs careful attention (invite waiting, snapshot ready) |
| **Soft rose** | Soft Signal / stop only — never marketing |
| **Paper cards** | One decision cluster |
| **Type** | Large serif for presence titles; clear sans for instructions |

### 4.2 Motion doctrine

| Principle | Spec |
| --------- | ---- |
| Motion carries state | Fade / gentle scale; never bounce for dopamine |
| Duration | 200–400ms default; reduced motion → crossfade or cut |
| Silence is allowed | Home may hold with no animation |
| Soft Signal visual | Immediate calm end field — **never delayed** for beauty |
| No parallax toys | Zero decorative motion competing with consent text |

### 4.3 Density doctrine

- **Resting:** generous empty; presence ring optional  
- **Review:** one boundary cluster per “page”; Next / Back  
- **Together:** almost empty except Soft Signal + soft timer  
- **Quiet:** two sentences max before optional note  

If a screen needs a scrollbar to find the primary action, **redesign**.

---

## 5. Input model

### 5.1 Physical

| Control | Action | Priority |
| ------- | ------ | -------- |
| **Soft Signal** | Immediate stop of session / radar / practice end | **Highest** — hardware interrupt |
| **Confirm** | Affirm selected yes / begin together | Medium — disabled until valid selection |
| **Back** | Leave one layer; never force stay | Medium |
| **Power** | Short = sleep/lock · Long = shutdown confirm | System |
| **Touch** | Select options, open Care, toggle Nearby | Normal |

### 5.2 Soft Signal interrupt path

```text
Physical Soft Signal press
  → OS interrupt (preempt UI thread if needed)
  → Local session/radar end (authoritative on device)
  → Edge light soft rose → calm
  → Haptic warmDescent / breathLeave (never gates stop)
  → Emit SoftSignalHardwareCommand to companion stack
  → Navigate QUIET (“You stopped. That’s enough.”)
  → Network withdraw best-effort; failure → pending_sync, still ended
```

**Invariant:** Stop is complete **before** any animation finishes. Beauty never delays freedom.

### 5.3 Confirm is deliberately slower

- Requires explicit on-screen “Yes” where consent is involved  
- Physical Confirm only arms after Yes  
- Optional 300–500ms arming (not a dark pattern delay on Soft Signal — only on **granting**)  
- Copy: never “Accept risk”; always “I agree to this current snapshot”

### 5.4 Accessibility inputs

- VoiceOver: mode announced on entry (“Resting. Nearby is off.”)  
- Dynamic Type: reflow; Soft Signal control grows, never shrinks below thumb  
- Option-by-number for ND “one at a time” where lists exist  
- Haptics optional; **visual fallback mandatory** ([HAPTICS.md](HAPTICS.md))

---

## 6. Full lifecycle: power-on → shutdown

### 6.1 Cold power-on → Boot

| t | Screen / state | Haptic / light | Notes |
| - | -------------- | -------------- | ----- |
| 0 | Black / off | — | User holds power |
| 1 | Soft cream glow only | Soft presence field optional | **No logo slam**, no fanfare video |
| 2 | Single word or mark: **Litmo** | — | One breath |
| 3 | Integrity: storage, Soft Signal self-test (silent) | — | Fail → Care recovery screen, not panic |
| 4 | Branch: Welcome (first run) or Lock | — | |

**Boot copy (max):**

> Litmo  
> For careful, platonic connection.

### 6.2 First-run Welcome (once)

Deep quizzes and full Touch Language stay on phone. Device Welcome is **boundary + Soft Signal + calm**.

| Step | Screen | Primary | Soft Signal |
| ---- | ------ | ------- | ----------- |
| W1 | What this is | Continue | — |
| W2 | What this is **not** (dating casino, therapy, emergency services) | Continue | — |
| W3 | Adult-only acknowledgment | I understand | — |
| W4 | Pair phone (recommended) QR/NFC | Pair / Not now | — |
| W5 | Display name only | Save | — |
| W6 | How this device should feel: Quiet / Balanced / Warm presence | Choose one | — |
| W7 | Soft Signal **practice** (required once) | — | Must press physical |
| W8 | Touch Language **lite** (4–6 prompts max) | Save | — |
| W9 | Nearby stays **off** | I understand | — |
| W10 | You’re ready | Enter Resting | — |

**Welcome rules:**

- Exit anytime → Resting with “Finish setup later on your phone.”  
- No photo. No “find people now.” No contacts permission.  
- Soft Signal practice framed as **skill**, not scare.

### 6.3 Lock

```text
┌────────────────────────────────┐
│                                │
│      ( abstract soft field )   │
│                                │
│         Litmo is locked        │
│                                │
│     Unlock with Face / code    │
│     (or phone-bound unlock)    │
│                                │
└────────────────────────────────┘
```

| Rule | Spec |
| ---- | ---- |
| Lock face content | **No** names, boundary text, or invite previews |
| Ambient signal while locked | Generic only: “Someone is waiting carefully” + amber edge |
| Unlock | Device biometrics if equipped, else phone-bound confirm |
| Session active when lock | Soft Signal **still works** physically; peer stop still ends session |
| Auto-lock | Short timeout in Resting; longer only while Together if user chose “stay awake while together” |

### 6.4 Resting (home — emotional center)

```text
┌────────────────────────────────────────┐
│  good afternoon, Maya            🔒    │
│                                        │
│           ( soft presence ring )       │
│                                        │
│      You’re here.                      │
│      Nothing required.                 │
│                                        │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Nearby (off) │  │ Invite carefully│ │
│  └──────────────┘  └─────────────────┘ │
│                                        │
│  Practice Soft Signal · Care           │
└────────────────────────────────────────┘
         physical Soft Signal always
```

| Resting state | What appears |
| ------------- | ------------ |
| Idle empty | Presence line only + two actions |
| Invite waiting | One card: “Sam is waiting for your review” → Review |
| Snapshot partial | “Your yes is recorded. Waiting for theirs — no rush.” |
| Both confirmed | “You’re both ready.” → **Begin together** |
| After Quiet | Soft return: no recap wall |
| Unpaired demo | Banner: “Practice only — not a real account” |

**Not on Resting:** discovery grid, tips carousel, quiz nags, badge FOMO, social proof.

### 6.5 Nearby (opt-in)

Entry from Resting requires **explicit ON**.

```text
NEARBY · on
Weather only — not safety, not consent.

  ( quiet constellation / calm list )

[ Turn Nearby off ]     [ Request careful hello ]
```

| Rule | Spec |
| ---- | ---- |
| Default | **Off** every cold boot and after timeout |
| Identity | Anonymous weather first; names only after mutual reveal ladder |
| Stop | Soft Signal or Turn off → radios stop → Resting |
| UI metaphor | Constellation or soft list — **not** swipe deck |
| Timeout | Auto-off; copy: “Nearby turned off to protect your quiet.” |

### 6.6 Invite carefully

One thread. No inbox maze.

```text
INVITE
A request is not consent.

[ Nearby person ]
[ Show / scan careful code ]
[ Someone already in careful circle ]

Waiting: “Request sent. They can decline without explaining.”
Decline received: “Not now. That’s a complete answer.” → Resting
```

### 6.7 Review (Consent Snapshot — sacred surface)

```text
CONSENT SNAPSHOT
Read every boundary before you agree.

┌ Kind · Pressure · Time · Zones · Not included ┐
│  one cluster per page · Next / Back            │
└────────────────────────────────────────────────┘

○ Yes — this matches what I agree to now
○ No — I want to change or stop

[ Soft Signal — leave without granting ]
[ Confirm this snapshot ]  ← armed only if Yes
```

| Device affordance | Spec |
| ----------------- | ---- |
| Co-read | Large type; room mode; no infinite scroll of 40 rows |
| Double gate | Yes selection + Confirm key/button |
| Peer status | Text only — no guilt progress bar |
| Fail closed | Missing / stale / mismatched fingerprint → cannot Begin |
| Soft Signal | Leaves **without** granting |

### 6.8 Together (active session)

```text
YOU’RE BOTH HERE

         12:04
        elapsed

  A gentle check-in
  Still a free yes?

┌─────────────────────────────────────┐
│                                     │
│      SOFT SIGNAL — end now          │
│                                     │
└─────────────────────────────────────┘

[ Pause quietly ]     [ End together ]
```

| Rule | Spec |
| ---- | ---- |
| Soft Signal | Largest on-screen control **and** physical |
| Chat | **None** |
| Timer | Elapsed soft clock — not a shame countdown |
| Pause | Either may pause; resume needs mutual calm confirm |
| Check-in | Optional gentle prompt — never auto-expands touch |
| Peer Soft Signal | Immediate Quiet on both; “Session ended. You’re okay to stop.” |

### 6.9 Quiet (aftercare)

```text
You stopped.
Nothing more is required.

Optional private note (syncs to your phone vault)
[ Skip ]   [ Save quietly ]
```

→ Resting. **No** rate partner. **No** public review. **No** “what went wrong?” form.

### 6.10 Care (rare)

From Resting → Care (drawer, not a settings OS):

| Item | Behavior |
| ---- | -------- |
| Nearby master | Off default |
| Device feel | Quiet / Balanced / Warm (ND + haptics preset) |
| Haptics | On / Gentle / Off + link to intensity if advanced |
| Voice read-aloud | Off default |
| Soft Signal test | Practice mode |
| Stay awake while Together | Optional |
| Quiet hours | Device signals sleep |
| Lock now | Immediate |
| Unpair | Fail-closed; phone confirm |
| About | Not clinical · not emergency services · constitution one-liners |
| Continue on phone | Calm QR for deep studio tasks |

### 6.11 Sleep / wake

| Event | Behavior |
| ----- | -------- |
| Short power / idle Resting | Sleep → Lock field (or off-display cream breath if always-warm hardware allows) |
| Wake | Soft glow → Lock → unlock → prior mode if safe, else Resting |
| Together + stay-awake | Screen stays; still can Soft Signal |
| Nearby + sleep | **Nearby turns off** (privacy) |

### 6.12 Shutdown

| Step | Screen |
| ---- | ------ |
| Long-press power | “Turn Litmo off?” |
| Confirm | Radios off · session cannot remain active (if Together: treat as End / Soft Signal path first) |
| Animation | Cream field dims over one breath — no jingle |
| Off | Full power cut |

**If Together when shutdown requested:**

1. Prefer Soft Signal / End together first  
2. Never leave a peer believing a session is active when device is dead  
3. Peer receives stop / disconnect → Quiet  

### 6.13 End-to-end journeys (OS level)

**A — Solo presence (device as companion, not social)**

```text
Power on → Boot → Lock → Resting
Optional: Practice Soft Signal
Nearby stays off
Sleep or Shutdown
```

Feeling: less alone **without pressure**.

**B — Planned together**

```text
Resting → Invite carefully → Review (both) → Begin together
→ Soft Signal or End together → Quiet → Resting → Sleep
```

**C — Opt-in nearby at a gathering**

```text
Resting → Nearby ON → careful hello ladder → optional Review
→ Soft Signal or Turn Nearby off → Resting
```

**D — Need out now**

```text
Together → physical Soft Signal
→ interrupt end → Quiet (“You stopped. That’s enough.”)
→ no explanation field → Resting when ready
```

### 6.14 Soft Signal multi-modal matrix (single source)

Stop is **local-first**. Beauty never delays freedom. Copy ≤2 sentences under stress.

| Mode | Local effect | Peer sees | Light | Haptic | Copy (device) |
| ---- | ------------ | --------- | ----- | ------ | ------------- |
| **Together** | Session ends terminal | Soft stop | Soft rose → cream | warmDescent | “You stopped. That is enough.” |
| **Review** | Leave without granting | Nothing granted | Soft rose flash | breathLeave | “Left without granting. Complete.” |
| **Nearby** | Radio off, keys wiped | Beacon gone | Amber→off | soft presence end | “Nearby is off. You’re quiet again.” |
| **Invite** | Cancel local request path | Decline-safe | Moss calm | attention optional | “Not now is complete.” |
| **Practice** | Practice log only | None | Soft moss | warmDescent gentle | “Practice only. No peer.” |
| **Lock + active** | Physical Soft Signal still ends | Soft stop | Soft rose | warmDescent | Lock face stays non-intimate |
| **Low battery** | Prefer Soft Signal path before hard cut | Disconnect/stop | Amber warn | none required | “Battery low — end gently if you can.” |
| **Peer disconnect** | Treat as stop → Quiet | N/A | Soft rose | optional | “Session ended. You’re okay to stop.” |

**Confirm key** is always slower/harder than Soft Signal. Never labeled “like.”

---

## 7. Signals & interruptions (anti-FOMO)

### 7.1 Allowed device signals

| Signal | When | Lock-safe presentation |
| ------ | ---- | ---------------------- |
| Presence | Careful invite arrives | Amber edge · “Someone is waiting carefully” |
| Attention | Snapshot ready | Moss pulse · “A boundary map is ready” |
| Ready | Both confirmed | Warm double glow · “You may begin when ready” |
| Soft stop | Peer Soft Signal | Soft rose · “Session ended. You’re okay to stop.” |
| Radar off | Timeout | Silent return Resting |

### 7.2 Forbidden signal patterns

- Badge counts  
- Message previews of boundaries or names on lock  
- Streaks, “come back,” weekly engagement digests on device  
- Sound loops  
- Time-sensitive abuse for ordinary invites  

### 7.3 Quiet hours

Default respectful of sleep. During quiet hours: buffer non-stop signals; **peer Soft Signal still breaks through** if a session was active.

---

## 8. Phone companion relationship

```text
┌──────────────────┐         encrypted pair          ┌──────────────────┐
│  Phone (studio)  │◄───────────────────────────────►│  Device (room)   │
│  Account/passkey │                                 │  Presence modes  │
│  Deep TL edit    │                                 │  Soft Signal HW  │
│  Learning        │                                 │  Nearby / Review │
│  Export / erase │                                 │  Together        │
│  Quizzes         │                                 │  Quiet           │
└──────────────────┘                                 └──────────────────┘
```

| Concern | Authority |
| ------- | --------- |
| Account identity | Phone + server |
| Device binding for consent | Device installation bound like `auth_devices` soul |
| Soft Signal local stop | **Device wins immediately** |
| Session server withdraw | Best-effort after local stop |
| Unpaired use | **Practice / demo only**, clearly labeled |

Deep-link pattern: Care → “Continue on phone” → calm QR. Never dump the user into a phone browser.

---

## 9. Safety invariants (OS-enforced)

These are **kernel-level product rules**, not copy suggestions:

1. **Consent is current, specific, dual, revocable.**  
2. **Profiles, vibes, radar, history never grant touch.**  
3. **Soft Signal needs no reason and no peer permission.**  
4. **Strictest boundary wins** in Snapshot intersection.  
5. **Fail closed** if snapshot missing, stale, mismatched, or device unbound (for real sessions).  
6. **No public safety scores** in chrome.  
7. **Not emergency services** — About and lock state this calmly.  
8. **RF social features default off**; sleep kills Nearby.  
9. **Confirm never faster than Soft Signal.**  
10. **Stopping is success** — copy, haptics, and light never punish.

---

## 10. Failure & recovery (kind, never stranded)

| Failure | OS response |
| ------- | ----------- |
| Soft Signal hardware fault | On-screen Soft Signal still ends; visual calm end field; prompt Care → test; never block stop |
| Haptics dead | Visual-only meaning; session still ends |
| Network gone mid-Together | Local end still works; pending_sync; peer may see disconnect as stop |
| Unbound device tries real Begin | Fail closed → pair phone or practice-only |
| Corrupt local state | Resting with “We reset carefully. Your phone still holds your account.” |
| Low battery mid-Together | Amber: “Battery low — consider ending gently”; Soft Signal still first-class; auto Soft Signal path before hard power loss if imminent |
| Peer device disappears | Treat as stop → Quiet; no chase UI |

**No dead ends.** Every error screen has: Soft Signal (if session), Back to Resting, or Continue on phone.

---

## 11. Microcopy bank (OS shell)

| Moment | Copy |
| ------ | ---- |
| Boot | “Litmo. For careful, platonic connection.” |
| Resting empty | “You’re here. Nothing required.” |
| Nearby off | “Nearby is off. Turn on only when you mean to be findable.” |
| Nearby on | “Weather only — not safety, not consent.” |
| Invite sent | “Request sent. They can decline without explaining.” |
| Decline | “Not now. That’s a complete answer.” |
| Review title | “Read every boundary before you agree.” |
| Waiting peer confirm | “Your yes is recorded. Waiting for theirs — no rush.” |
| Begin | “You’re both ready. Begin only if you still want to.” |
| Soft Signal | “Session ended. You don’t owe an explanation.” |
| Quiet | “You stopped. Nothing more is required.” |
| Radar timeout | “Nearby turned off to protect your quiet.” |
| Shutdown | “Turn Litmo off?” |
| Not emergency | “Litmo is not emergency services.” |

Voice: calm, adult, non-clinical, non-shaming. Under stress: **≤2 sentences**.

---

## 12. What lives only on the phone (keep the OS pure)

| Phone studio | Device room |
| ------------ | ----------- |
| Full Vibe / self quizzes | — |
| Guided Learning curriculum | Soft Signal practice only |
| Passkeys, export, erase | Lock + unpair |
| Deep Touch Language editor | TL lite + Review rows |
| Profile long-form | Display name |
| Moderation / staff | — |
| Diagnostics | Minimal Care about |

---

## 13. Success criteria (OS experience)

Litmo Device OS is right if:

1. A tired person can power on and feel **grounded without a to-do list**.  
2. The path **invite → review → together → stop** needs no phone UI maze.  
3. Soft Signal is **faster and more obvious** than continuing.  
4. Turning Nearby **off** feels like relief, not FOMO.  
5. Someone can use the device **only as a presence object** and still feel designed-for.  
6. A stranger glancing at a locked device learns **nothing intimate**.  
7. There is **nowhere to doomscroll**.

---

## 14. Open design questions (not implementation authorization)

1. Low-glare OLED vs reflective calm panel  
2. On-device biometrics vs phone-only unlock  
3. Always-warm edge light vs battery (presence vs sleep)  
4. Whether offline snapshot rows ever rest on device (prefer phone vault)  
5. Multi-person Campfire hardware vs two-person-first OS  
6. Whether “Begin together” requires devices to remain co-located (RF proximity check)

---

## 15. Document map

| Doc | Role |
| --- | ---- |
| **This file** | Device **OS** — shell, modes, power lifecycle, bans, interrupts |
| [HARDWARE_DEVICE_EXPERIENCE.md](../HARDWARE_DEVICE_EXPERIENCE.md) | Broader product experience narrative + journey map |
| [HAPTICS.md](HAPTICS.md) | Soft Edge multi-modal feedback spec |
| [SOFT_SIGNAL.md](../SOFT_SIGNAL.md) | Soft Signal product + hardware command |
| [CONSENT_SNAPSHOT_SYSTEM.md](../CONSENT_SNAPSHOT_SYSTEM.md) | Snapshot prepare / mutual seal |
| [PROXIMITY_LAYER.md](../PROXIMITY_LAYER.md) | Nearby / radar consent ladder |

---

*This is operating-system experience architecture for a possible Litmo device. It does not claim hardware or an OS is in production, and it does not authorize manufacturing.*
