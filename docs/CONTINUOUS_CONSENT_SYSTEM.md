# Continuous Consent System

**Status:** canonical product design (maximum granularity)  
**Code twin:** `app/lib/continuousConsentCore.ts`  
**Related:** `CONSENT_MICROINTERACTIONS.md` · `SOFT_SIGNAL.md` · `CONSENT_SNAPSHOT_SYSTEM.md` · ADR 0005 · Living Constitution  
**Mode note:** Semantics are **mode-agnostic**. MAXIMUM vs APP_STORE_SAFE may only change copy intensity—not stop law, escalation authority, or revocation timing.

> Consent is not a checkbox at the door.  
> Consent is a **live security property of the relationship in time**.  
> Design it like Apple designs Secure Enclave access: continuous evaluation, least privilege, instantaneous revocation, fail closed.

---

## 0. Absolute axioms (leave nothing to assumption)

| # | Axiom | Operational meaning |
| - | ----- | ------------------- |
| A1 | **Specific** | Consent is always to *this act / zone / pressure / duration / context*—never “general intimacy.” |
| A2 | **Informed** | Each party must have seen the **current** sealed package (fingerprint). Stale map = no contact authority. |
| A3 | **Mutual** | Both people must hold concurrent **green-path** authority. One green + one yellow ≠ full contact. |
| A4 | **Continuous** | Authority is re-evaluated on a clock and on every material event. Silence is not renewal. |
| A5 | **Granular** | Zones, modalities, intensity, and time are independent dimensions. Grant on hands does not grant face. |
| A6 | **Revocable** | Either person may reduce or zero authority **at any second** with zero explanation. |
| A7 | **Stop < Continue** | Soft Signal / Level-0 revoke is faster than any re-grant path. Local free before network. |
| A8 | **Fail closed** | Missing, stale, contradictory, offline-unknown → **no contact privilege**. |
| A9 | **Match ≠ consent** | Profile, vibe, prior session, trust signal, proximity, NFC scan, quiz → **never** authority. |
| A10 | **Not emergency services** | Soft Signal ends Litmo sessions; it does not dispatch crisis response. |

---

## 1. Dimensional model of consent

Consent is a **vector**, not a boolean.

```text
ConsentAuthority =
  who × what × how × where × when × with-whom × under-what-state
```

| Dimension | Type | Examples | Default if unspecified |
| --------- | ---- | -------- | ---------------------- |
| **Actor** | party id | self, peer | fail closed (no anonymous grant) |
| **Zone** | body zone id | hands, shoulders, face… | **off_limits** |
| **Modality** | hold / rest / squeeze / guide… | side-by-side, hand-hold | none allowed |
| **Pressure** | light \| medium \| firm | — | strictest of both |
| **Speed** | slow…brisk | — | strictest of both |
| **Duration** | brief \| minutes \| decide | + optional max session minutes | strictest / min minutes |
| **Environment** | public_calm, outdoors… | — | intersection only |
| **Mood/capacity** | mood + energy at seal | low_capacity → extra care | recheck on escalate |
| **Safeword layer** | stop / slow / ok | verbal + Soft Signal | always live |
| **Time window** | sealedAt → now ≤ TTL / check-in | — | expired = no authority |
| **Revocation mask** | bitfield of killed privileges | zone X killed mid-session | mask wins over seal |

### 1.1 Privilege lattice (strictest wins)

```text
NONE (0)
  <  OBSERVE_ONLY (presence, no contact)
  <  VERBAL_ONLY
  <  SOFT_LIMIT_CARE (contact only with active care + easy stop)
  <  ASK_FIRST (contact only after fresh verbal/UI ask + accept)
  <  WELCOMED_SEALED (allowed by sealed map if both continuous-green)
  <  (no level above — never “implied forever”)
```

**Rule:** Joint privilege for any (zone, modality) = **min(partyA, partyB, sealed_intersection, live_revocation_mask, continuous_state)**.

### 1.2 soft_limit is first-class

Not collapsed into ask_first or off_limits:

| Status | Contact allowed? | Continuous rule |
| ------ | ---------------- | --------------- |
| off_limits | **Never** | Mask permanent for session unless **new** dual seal |
| soft_limit | Only if both continuous-green **and** care check-in satisfied | Default Soft Signal stickiness high; escalate to full stop on any yellow |
| ask_first | Only after in-moment dual micro-yes | Micro-yes expires (see §5) |
| welcomed | Only if sealed + continuous green | Still revocable instantly |

---

## 2. Consent state machines

### 2.1 Global session lifecycle (existing + continuous overlay)

```text
draft → requested → accepted → consent_pending → ready → active → {completed | soft_signaled | safety_ended}
                              ↘ cancelled / expired / declined (terminal)
```

**Continuous consent only applies when `state === active`** (and, optionally, during `ready` as pre-contact green-hold). Terminal states clear all contact privilege.

### 2.2 Continuous contact authority state (per person, during active)

```text
┌─────────────┐
│  BLACK      │  No contact privilege. Soft Signal already fired or never sealed.
└──────┬──────┘
       │ dual seal + both continuous-enter
       ▼
┌─────────────┐
│  RED        │  Contact forbidden. Soft Signal / Level-0 just fired locally or peer.
└──────┬──────┘
       │ only NEW dual seal (never auto)
       ▼
┌─────────────┐     soft yellow / slow word      ┌─────────────┐
│  GREEN      │ ───────────────────────────────► │  YELLOW     │
│  full path  │ ◄── explicit re-green (slow) ─── │  reduce /   │
│  under seal │                                  │  check-in   │
└──────┬──────┘                                  └──────┬──────┘
       │ Soft Signal / stop word / peer red             │ Soft Signal
       └────────────────────┬───────────────────────────┘
                            ▼
                          RED / BLACK
```

| State | Contact | Required UI | Exit |
| ----- | ------- | ----------- | ---- |
| **BLACK** | None | Session ended / never started | New session only |
| **RED** | None | Soft Signal settled / free | New seal only |
| **YELLOW** | Reduced (soft_limit + ask_first only; no new welcomed starts) | Check-in banner; Soft Signal sticky | Soft Signal → RED; re-green protocol → GREEN |
| **GREEN** | Sealed intersection minus masks | Sticky Soft Signal; optional heartbeat | Soft Signal / yellow / expiry → lower |

**Both parties must be GREEN** for full welcomed contact.  
If either is YELLOW → joint max privilege = soft_limit care path only.  
If either is RED/BLACK → joint privilege = **NONE**.

### 2.3 Dual continuous joint evaluation

```ts
jointContactAllowed =
  session.state === "active"
  && sealedAt != null
  && !withdrawnAt
  && fingerprintCurrent
  && partyA.continuous === GREEN
  && partyB.continuous === GREEN
  && now < continuousExpiresAt
  && !hardTimeoutExceeded
```

Any false → **fail closed** (no contact privilege). UI must show which axis failed without blaming.

---

## 3. Escalation levels (revoke and re-grant)

Designed like security severity levels. **Lower number = more severe / faster / more complete.**

### 3.1 Withdrawal / reduce ladder (always available)

| Level | Name | Trigger examples | Local effect (≤ ms) | Peer effect | Explanation required? |
| ----- | ---- | ---------------- | ------------------- | ----------- | --------------------- |
| **L0** | **Hard Soft Signal** | Soft Signal button, hardware Soft Signal, stop safeword, panic cover path | **0ms** free; session → `soft_signaled` | Remote withdraw best-effort | **Never** |
| **L1** | **Quick exit** | Quick exit control | 0ms free; wrap-up path | Same as L0 terminal | Never |
| **L2** | **Safety end** | Safety system terminal | 0ms free; `safety_ended` | Terminal | Never |
| **L3** | **Yellow / slow** | Slow safeword, “pause”, capacity drop | Immediate YELLOW; stop **new** welcomed contact | Peer notified “pause / reduce” | Never |
| **L4** | **Zone kill** | “Not shoulders” mid-session | Mask zone off_limits for rest of session | Peer sees updated mask | Never |
| **L5** | **Modality kill** | “No squeezes” | Mask modality | Peer sees mask | Never |
| **L6** | **Intensity drop** | “Lighter only” | Cap pressure/speed to light/slow | Peer sees cap | Never |
| **L7** | **Time trim** | “Five more minutes max” | Shrink maxDurationMinutes | Peer sees new max | Never |
| **L8** | **Check-in demand** | Timeout warning, soft_limit zone, long continuous green | Require dual micro-ack to stay GREEN | Peer sees check-in prompt | Never (ack is not a reason) |

**Invariant:** L0–L2 always dominate L3–L8. You cannot “negotiate up” from L0 without a **new** dual-sealed session package.

### 3.2 Re-grant / escalate-up ladder (always slow)

| Level | Name | What it grants | Requirements | Min time budget |
| ----- | ---- | -------------- | ------------ | --------------- |
| **G0** | Forbidden | Nothing | — | — |
| **G1** | Observe presence | Co-location only | Session active, both not RED | n/a |
| **G2** | Verbal connect | Words only | Both GREEN or YELLOW | n/a |
| **G3** | Ask-first micro-yes | One zone/modality for TTL | Dual micro-affirm + arm dwell | **320ms** arm after both toggles |
| **G4** | Soft-limit care contact | Soft_limit zones under care rules | Both GREEN; check-in fresh | check-in max age |
| **G5** | Sealed welcomed contact | Intersection welcomed | Dual seal + both continuous GREEN | seal arm + continuous heartbeat |
| **G6** | **New map** (only path to more than sealed) | Expanded zones/pressure | **New dual seal** of new fingerprint | full prepare+seal path |

**Invariant:** There is **no G7 “implied more.”** Anything outside the sealed fingerprint requires G6.

### 3.3 Escalation matrix (from → to)

| From \ To | L0 Soft Signal | L3 Yellow | L4 Zone kill | G3 Micro-yes | G5 Sealed green | G6 New seal |
| --------- | -------------- | --------- | ------------ | ------------ | --------------- | ----------- |
| GREEN | ✅ instant | ✅ instant | ✅ instant | if ask_first | already | slow |
| YELLOW | ✅ instant | — | ✅ | re-green first | re-green first | slow |
| RED | noop (free) | forbidden | forbidden | forbidden | forbidden | only path out |
| BLACK | noop | forbidden | forbidden | forbidden | forbidden | new session |

---

## 4. Micro-interactions (every control class)

### 4.1 Catalog of micro-interaction kinds

| Kind | Purpose | Speed | Arm? | Peer? |
| ---- | ------- | ----- | ---- | ----- |
| **Inform** | Notice only | Instant | No | No |
| **Prepare** | One-sided declaration | Instant save | No | No |
| **Share accept** | Review payload | Explicit Accept/Decline | No | Payload author |
| **Micro-yes** | Ask-first moment | Dual toggle + dwell | **Yes 320ms** | Yes |
| **Dual seal** | Session package | Dual checklist + dwell | **Yes 320ms** | Yes |
| **Heartbeat ack** | Continuous green renewal | Dual light confirm | Short dwell optional | Yes |
| **Yellow enter** | Reduce path | Instant | No | Notify |
| **Re-green** | Leave yellow | Dual affirm + dwell | **Yes** | Yes |
| **Zone/modality kill** | Granular revoke | Instant | No | Notify |
| **Soft Signal L0** | Total stop | **0ms** | **Never** | Best-effort |
| **Block and leave** | Social distance | Instant local | No | Private |

### 4.2 Soft Signal micro-interaction (L0) — absolute

```text
t=0ms     finger down / hardware press
t=0ms     localEnded=true; continuous=RED; privilege=NONE; UI free
t≤120ms   UI shows stopped
t=async   remote withdraw, log, haptic, hardware (all fail-open)
t=after   optional journal note (never required)
```

**Forbidden micro-interactions on Soft Signal:** long-press required · confirm dialog · swipe-only · reason field · peer veto · network wait · spring confetti.

### 4.3 Dual seal micro-interaction (G5 entry)

```text
read package → toggle 6 protective checks (each debounced 180ms)
→ both parties complete → arm clock 320ms → Confirm enables
→ seal → continuous=GREEN for both (if enter protocol complete)
Soft Signal available every millisecond of this path
```

### 4.4 Ask-first micro-yes (G3)

```text
Proposer: "Ask: shoulders, light, 10s?"
Receiver: Accept | Decline | Soft Signal
If Accept: both must be GREEN; arm 320ms; TTL starts (default 60s)
TTL expire → privilege drops; must re-ask
Decline → no contact; no explanation
Soft Signal → L0 entire session
```

### 4.5 Yellow / slow micro-interaction (L3)

```text
Trigger: slow safeword | UI "Pause" | capacity check-in fail | soft_limit breach signal
Effect: continuous=YELLOW for actor; joint max = soft_limit care
UI: banner "Reduced · Soft Signal still free"
Re-green: dual explicit "continue under seal" + arm (never auto after yellow)
```

### 4.6 Zone kill micro-interaction (L4)

```text
Actor selects zone → "Off for this session"
Effect: revocation mask[zone]=off_limits; peer device shows mask update
No arm; no reason; Soft Signal still available
Cannot un-kill without G6 new seal (fail closed)
```

### 4.7 Heartbeat / check-in micro-interaction (L8 / continuous)

```text
When: continuous green age > checkInIntervalMs OR entering soft_limit zone contact
Prompt: "Still good?" [Yes] [Pause/Yellow] [Soft Signal]
Yes: both must Yes within responseWindowMs or drop to YELLOW
Missed check-in: fail closed → YELLOW then RED if still no response
```

---

## 5. Real-time revocation mechanics

### 5.1 Revocation channels (all valid)

| Channel | Latency target | Works offline? | Maps to |
| ------- | -------------- | -------------- | ------- |
| Soft Signal UI | 0ms local | **Yes** | L0 |
| Hardware Soft Signal | 0ms local | **Yes** | L0 |
| Stop safeword (verbal) | Partner honor + optional UI mark | Offline social | L0 if stop; L3 if slow |
| Yellow / Pause UI | 0ms local | Yes | L3 |
| Zone/modality kill UI | 0ms local | Yes | L4/L5 |
| Peer Soft Signal (remote) | Network; local already free if self | Self always offline-capable | Peer → you see RED |
| Timeout boundary | Clock | Yes (local clock) | L0 or L3 per prefs |
| Fingerprint invalidate | Profile edit | Yes for local | RED until new seal |
| Block | Instant social | Yes local | L0 + block |

### 5.2 Propagation protocol

```text
SELF L0:
  1. Local privilege zero + continuous RED + session terminal soft_signaled
  2. Emit SoftSignalHardwareCommand (preempt, localOnly)
  3. Haptic softSignal
  4. Best-effort remote withdraw_session_consent (idempotent key)
  5. Peer device: on receipt → continuous RED + UI free (if not already)
  6. If peer offline: peer remains free locally when they Soft Signal; server reconciles

SELF L3–L7:
  1. Update local continuous state / mask immediately
  2. Best-effort realtime event continuous.reduced / continuous.mask
  3. Peer applies min() with own state (never upgrades privilege from peer)
  4. Fail open on notify; fail closed on privilege (local already reduced)
```

### 5.3 Conflict resolution

| Conflict | Winner |
| -------- | ------ |
| One GREEN, one YELLOW | Joint YELLOW rules |
| One GREEN, one RED | Joint NONE |
| Mask says off, seal said welcomed | **Mask** |
| Local Soft Signal, remote still “active” | **Local free**; remote pending_sync |
| Two Soft Signals | Idempotent; already_ended no penalty |
| Clock skew on heartbeat | Prefer **earlier** expiry (fail closed) |

### 5.4 Revocation is write-once-down

Privilege may only **decrease** without a G3/G5/G6 slow path.  
No “oops undo Soft Signal.” Soft Signal is permanent for that session id.

---

## 6. Check-in systems

### 6.1 Classes of check-in

| Class | When | Failure |
| ----- | ---- | ------- |
| **Seal-time Soft Signal ack** | Prepare | Cannot save declaration |
| **Dual protective checklist** | Mutual seal | Cannot seal |
| **Continuous heartbeat** | During GREEN active | → YELLOW → RED |
| **Soft-limit entry check** | Before soft_limit zone contact | Contact forbidden until dual care-yes |
| **Ask-first micro-yes** | Each ask_first contact | No contact |
| **Timeout warning** | Before maxDuration | Banner; optional auto Soft Signal |
| **Capacity re-ask** | Mood was low_capacity / unsure | Require re-green or stay YELLOW |
| **Post-stop reflection** | After L0 | Optional; skip = success |

### 6.2 Timing tokens (continuous layer)

| Token | Default | Intent |
| ----- | ------- | ------ |
| `continuousHeartbeatIntervalMs` | 300_000 (5 min) | Green renewal prompt |
| `checkInResponseWindowMs` | 60_000 | Both must answer or YELLOW |
| `microYesTtlMs` | 60_000 | Ask-first grant lifetime |
| `reGreenArmMs` | 320 | Same as grant arm (anti-accidental continue) |
| `softLimitCareAckMaxAgeMs` | 120_000 | Care yes freshness |
| `maxDurationMinutes` | dual min / null | Session clock (Soft Signal anytime sooner) |
| `timeoutWarnBeforeMinutes` | 5 | Warning before hard end |
| `softSignalLocalCommitMs` | **0** | Never raised by check-ins |

### 6.3 Check-in is not interrogation

- No required free-text “why”  
- Options: Yes / Pause / Soft Signal (or equivalent)  
- Pause → YELLOW  
- Soft Signal → L0  
- Silence past window → fail closed (not “assume yes”)

---

## 7. Session architecture

### 7.1 Layers

```text
┌─────────────────────────────────────────────────────────────┐
│ Presentation (copy packs, a11y, MAXIMUM vs APP_STORE skin)  │
├─────────────────────────────────────────────────────────────┤
│ Continuous consent controller (per device)                  │
│  continuous state · masks · check-in clocks · Soft Signal   │
├─────────────────────────────────────────────────────────────┤
│ Sealed package (fingerprint · intersection · dual affirm)   │
├─────────────────────────────────────────────────────────────┤
│ Session lifecycle FSM (draft…active…terminal)               │
├─────────────────────────────────────────────────────────────┤
│ Domain engines (@litmo/domain compatibility · soft_limit)   │
├─────────────────────────────────────────────────────────────┤
│ Local vault + Soft Signal log (offline personal)            │
├─────────────────────────────────────────────────────────────┤
│ Server: snapshot confirm · withdraw · RLS · realtime        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Authority sources ranked (highest wins for *denial*)

1. Soft Signal / L0 local (absolute)  
2. Continuous RED / BLACK  
3. Revocation mask  
4. Continuous YELLOW (caps privilege)  
5. Sealed intersection  
6. Domain compatibility map  
7. UI “wants to continue” (never elevates alone)

### 7.3 Active session UI architecture

```text
┌──────────────────────────────────────────┐
│ Sticky Soft Signal (weight 100) always   │  ← never scroll away
├──────────────────────────────────────────┤
│ Continuous status chips: You · Peer      │  GREEN / YELLOW / RED
│ Heartbeat / check-in banner when due     │
│ Mask chips: killed zones                 │
├──────────────────────────────────────────┤
│ Scroll: timer · sealed summary · care    │
│ Ask-first micro-yes sheet when needed    │
│ Yellow re-green protocol when needed     │
└──────────────────────────────────────────┘
```

### 7.4 Data objects (logical)

```ts
ContinuousConsentSession {
  sessionId: string
  lifecycle: ConsentLifecycleState
  sealedFingerprint: string
  sealedAt: string
  intersection: { welcomed, askFirst, softLimit, excluded, maxDurationMinutes, … }
  partyA: ContinuousPartyState
  partyB: ContinuousPartyState
  revocationMasks: { partyA: Mask, partyB: Mask }
  continuousExpiresAt: string | null  // next heartbeat deadline
  hardEndsAt: string | null           // max duration
}

ContinuousPartyState {
  continuous: "BLACK" | "RED" | "YELLOW" | "GREEN"
  lastHeartbeatAt: string | null
  lastSoftSignalAt: string | null
  capacity: { mood, energy } // from seal; optional live update = prepare-only unless re-seal
}

Mask {
  zones: Partial<Record<ZoneId, "off_limits">>
  modalities: string[]
  maxPressure?: "light" | "medium" | "firm"
  maxSpeed?: …
}
```

### 7.5 Offline / online matrix

| Condition | Self Soft Signal | Peer notified | Privilege |
| --------- | ---------------- | ------------- | --------- |
| Online | Immediate | Realtime | NONE |
| Offline self | Immediate | pending_sync | NONE |
| Offline peer | Self free | When back | Self NONE; peer free when they stop |
| Split brain | Local free always | Server idempotent | Never re-enable on sync failure |

---

## 8. Second-by-second mental model

```text
Every second while active:
  if Soft Signal pressed → L0 (0ms)
  else if peer Soft Signal received → RED
  else if hardEndsAt passed → L0 or prompt per prefs
  else if continuousExpiresAt passed without dual Yes → YELLOW
  else if yellow and no re-green → stay reduced
  else if mask forbids zone → contact that zone forbidden
  else if ask_first and microYes expired → forbidden until G3
  else if both GREEN and sealed → contact only within intersection ∩ ¬mask
  else → NONE
```

No second may “assume still yes” after expiry.

---

## 9. Mapping to shipped Litmo (honest)

| Continuous design element | Status in repo today |
| ------------------------- | -------------------- |
| Dual seal fingerprint | ✅ local + server paths |
| soft_limit first-class | ✅ engine + snapshot core |
| Soft Signal L0 0ms local | ✅ softSignalServiceCore |
| Session FSM terminal soft_signaled | ✅ sessionLifecycle |
| Grant arm 320ms | ✅ useConsentGrantArm |
| Ask-first micro-yes TTL protocol | ⚠ partial (status exists; full G3 UI TBD) |
| Continuous GREEN/YELLOW heartbeat | ⚠ design in this doc + pure core types |
| Mid-session zone kill mask | ⚠ design; not full product UI |
| Peer continuous realtime | ⚠ depends on session realtime |
| Safeword slow → YELLOW | ⚠ product copy exists; FSM overlay TBD |

**Implementation rule:** ship continuous controller **without** weakening Soft Signal or dual seal. Prefer additive layer on `active` sessions.

---

## 10. Edge-case encyclopedia (fail closed)

| # | Situation | Required behavior |
| - | --------- | ----------------- |
| E1 | Double Soft Signal | Idempotent free; no error shame |
| E2 | Soft Signal while sealing | Stop wins; seal abandoned |
| E3 | Soft Signal offline | Local free; pending_sync |
| E4 | Heartbeat missed by one | YELLOW then RED; never assume yes |
| E5 | Peer silent forever | Treat as not GREEN; do not expand privilege |
| E6 | Profile edit mid-active | Invalidate fingerprint → RED; new seal required |
| E7 | Micro-yes expired mid-contact | Stop that contact path; Soft Signal free |
| E8 | Yellow then Soft Signal | L0 terminal |
| E9 | Re-green without dwell | Confirm disabled |
| E10 | Zone kill shoulders then ask welcomed | Forbidden without G6 |
| E11 | Demo partner continuous | DEMO labeled; not real peer |
| E12 | Color-only red/green | Forbidden; chips need text |
| E13 | Reduce Motion | No meaning-only animation; Soft Signal still 0ms |
| E14 | ND Mode | Larger targets; Soft Signal never harder |
| E15 | App Store copy | Calm labels; same L0 law |

---

## 11. Security parallels (Apple-style)

| Apple security idea | Continuous consent analog |
| ------------------- | ------------------------- |
| Least privilege | Intersection ∩ mask only |
| Secure Enclave | Local Soft Signal decision authoritative offline |
| Certificate expiry | Heartbeat / micro-yes TTL |
| Certificate revocation list | Soft Signal + masks |
| No silent key reuse | No privilege reuse across sessions without new seal |
| Fail closed on tamper | Stale fingerprint → RED |
| User presence (Face ID) | Device lock / UV ≠ consent; separate axes |
| Updates require re-auth | Map change requires G6 |

---

## 12. Forbidden designs (never ship)

1. Silence = yes after check-in timeout  
2. Soft Signal requires peer approval  
3. Soft Signal requires reason  
4. Auto-renew green without dual Yes  
5. Swipe-to-consent or long-press-to-stop  
6. Match/vibe/proximity auto-GREEN  
7. Un-kill zone without new dual seal  
8. Soft Signal delayed for beauty, network, or “are you sure?”  
9. Public continuous state as safety score  
10. Mode-specific weaker stop law  

---

## 13. Implementation phases (recommended)

| Phase | Deliverable |
| ----- | ----------- |
| **P0** | Pure `continuousConsentCore` types + tests (this workstream) |
| **P1** | Active session: continuous chips + Soft Signal L0 (already) + yellow pause control |
| **P2** | Heartbeat check-in dual Yes + fail closed |
| **P3** | Zone kill masks + peer realtime apply min() |
| **P4** | Ask-first micro-yes sheet with TTL |
| **P5** | Hardware Soft Signal multi-modal matrix (Maximum mode) |

---

## 14. Tests that must exist

1. `jointContactAllowed` false if either not GREEN  
2. L0 sets continuous RED and privilege NONE in 0 logical steps  
3. L3 caps joint privilege below welcomed  
4. Mask beats sealed welcomed  
5. Heartbeat miss → not GREEN  
6. Micro-yes past TTL → not allowed  
7. Soft Signal faster than re-green arm  
8. No path soft_signaled → active  
9. soft_limit remains first-class under continuous eval  
10. App Store copy does not change L0 timing tokens  

---

*Touch is not a transaction — it is a language spoken in continuous time.*  
*The seal is the certificate. Soft Signal is the kill switch. Check-ins are the heartbeat. Privilege only decreases without a slow new yes.*
