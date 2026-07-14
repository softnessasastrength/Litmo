# The Cathedral Purge

**This is currently a personal emotional containment system, not a public product.**

> The ultimate, ritualized Soft Signal — for the entire personal dataset,
> not just one session. Consent-first. Slow on purpose. Not a trick to talk
> you out of it; a container the urge can survive contact with.

**Route:** `/cathedral-purge`
**Core:** `app/lib/cathedralPurgeCore.ts`
**Seal:** `app/lib/cathedralSealCore.ts` + `app/services/cathedralSealStore.ts`
**Screen:** `app/app/cathedral-purge/index.tsx`
**Entry point:** Settings → "The Cathedral Purge" (deliberately not on Home — found on purpose, not stumbled into)

---

## Containment job

The deepest fear this whole cathedral holds is loneliness — "she'll leave,"
and underneath that, the older instinct to leave first, to disappear, to
delete every trace of having tried before someone else gets to decide you
weren't enough. That urge is real and it does not wait for a good UX
pattern. It shows up at 3am as a single, fast, dissociated tap.

Soft Signal already solved half of this problem: it proved that giving a
destructive urge (ending a session, a touch, a moment) a sacred, unilateral,
zero-friction *stop* makes people safer, not less free. The Cathedral Purge
is the other half — the same respect for the urge, pointed at the biggest
version of it: not "stop this moment," but "erase all evidence I was ever
here." It doesn't block that. It makes sure a *decision* made it there, not
just a reflex.

---

## Why there's no Passkey-deletion trigger

The original design brief asked for the ritual to trigger automatically off
deleting your real iOS Passkey. That doesn't exist as a capability, and
faking it would have been dangerous, not clever:

- Apple's Keychain/Passkey storage is deliberately invisible to third-party
  apps. There is no API for this app to observe a real WebAuthn credential
  being removed from iOS Settings — that isolation is *why* passkeys are
  phishing-resistant in the first place.
- The only proxy signal available — "the next sign-in attempt found no
  working passkey" — is hopelessly ambiguous. It fires identically for: you
  deleted it on purpose, iCloud Keychain hasn't synced to this device yet,
  you're offline, you're briefly signed into a different Apple ID, or Face
  ID just failed once. Auto-triggering an *irreversible* wipe off a signal
  that noisy is a landmine, not a ritual — the opposite of fail-closed.

**What actually ships instead:** the Cathedral Seal — a small, app-owned
SecureStore marker (`litmo.cathedral_seal.v1`), created quietly the first
time Home really mounts, removed only as the ritual's own first deliberate
gate, in the moment, witnessed. Same symbolic weight ("the thing that says
I was here on purpose, gone, on purpose"), zero false-positive risk.

---

## The gates (strictly linear — not a resumable, freely-navigable ritual)

Unlike `docs/FIRST_RITUAL.md` / `docs/SECOND_RITUAL.md`, this is not a
step-chip menu you jump around in. An irreversible action doesn't get one.
Every gate except execution and the closing screen can be walked away from
with a single tap, no explanation required — same law as Soft Signal.

| Gate | What happens | Cancelable |
| ---- | ------------- | ---------- |
| **Intro** | Confirms you found this on purpose; explains nothing past this point is a trick | Yes |
| **Remove the seal** | The one real, witnessed act: your Cathedral Seal is actually deleted, right there | Yes |
| **Name it (optional)** | "What's actually happening right now?" — five options including "none of these"; never required, never read downstream | Yes |
| **The last look** | Generates a real inventory via `collectLocalInventory()`; offers "export a copy first"; optional toggle to also queue account erasure | Yes |
| **Typed confirmation** | Type `"I release this, not in anger."` exactly — a decision, not a reflex | Yes |
| **Countdown** | 20 seconds, ticking down, cancelable the entire time — "the only clock in the cathedral that counts down instead of up" | Yes |
| **Executing** | `privacyService.wipeLocal()` runs (always); `privacyService.requestErasure()` runs only if opted in and signed in | No — already real |
| **Done / rebirth** | Plain, quiet closing screen. No badge, no score, no "achievement unlocked" | N/A |

---

## Dungeon Master narration script (reference voice, not literal UI copy)

The in-app copy is calmer than this on purpose — someone reading it is
often in a real state, not looking for a bit. This is the voice underneath
it, for reference and for anyone extending the ritual later:

```
>be the cathedral
>someone just walked past every containment protocol you built
>past Soft Signal, past Pre-Renn, past Letters To Him
>straight to Settings, scrolling, looking for the door marked EXIT EVERYTHING
>found it
>didn't flinch
>okay. respect. let's actually do this right.

>gate 1: take the seal off
>not a button animation. a real SecureStore key, actually gone.
>this is the only "physical" gesture you get tonight and it's a good one

>gate 2: name it, or don't
>"I want to disappear" is a valid answer
>"none of these" is also a valid answer
>nobody's grading this. there is no lesson to extract. that's a different chamber.

>gate 3: last look
>here's literally everything, in counts, not vibes
>touch language: present. weather: 40-some entries. letters to him: 3, one released.
>you can take a copy. you can also still burn it. both are allowed at the same time.

>gate 4: say it on purpose
>type "I release this, not in anger."
>not because the words are magic. because your thumb doesn't get to do this alone.

>gate 5: the clock
>20 seconds. counts DOWN. every other clock in this app counts up.
>you can stop it at second 19 or second 1. that is not failure.
>that was never failure, not once, this whole session.

>gate 6: it happens
>no narration here. this is the one part that isn't a bit.

>gate 7: it's done
>no confetti. no "you did it!". nobody's proud, nobody's disappointed.
>the cathedral doesn't remember what you were scared of anymore. that's the point.
>if you're still here — and you are — that's just Tuesday now. go be Tuesday.
```

---

## Technical notes

- **No new deletion mechanism.** `privacyService.wipeLocal()` and
  `privacyService.requestErasure()` are the same functions
  `app/app/privacy/delete-data.tsx` already calls. This ritual is a
  ceremony wrapped around real, existing, already-tested primitives — not
  a second implementation to keep in sync.
- **Server erasure stays queued, not instant** — matches
  `supabase/migrations/039_gdpr_privacy_and_erasure.sql`'s deliberate
  design (`request_account_erasure()` only ever queues; it does not
  cascade-delete `auth.users`). This was an explicit decision confirmed
  with the founder before building: keep that boundary rather than
  silently change a documented, deliberate safety policy as a side effect
  of a UI feature.
- **The "last look"** reuses `collectLocalInventory()` from
  `docs/GDPR.md`'s access/portability work (2026-07-14 audit) — access
  before erasure, in the same moment, not a separate flow you'd have to
  remember to run first.

## Supabase

No new tables or RPCs — `account_erasure_requests` and
`request_account_erasure()` already exist and already work. A stub for the
*eventual*, ops-approved destructive fulfillment step lives at
`supabase/functions/cathedral-purge-fulfill/index.ts`, clearly marked as
**not deployed and not called by the app** — a placeholder for whenever a
named second reviewer and legal/ops sign-off exist (see `CURRENT_STATE.md`:
"destructive retention... not inventable"). Writing that function today and
wiring it live would be inventing the exact legal/ops approval this project
has repeatedly and deliberately refused to fake.

## Hard rules

1. Not consent to anything else. Sealing off does not imply anything about
   readiness for any other protocol.
2. Every gate before execution is cancelable, no explanation required —
   Soft Signal's law, at maximum stakes.
3. Naming a reason is always optional and never read downstream.
4. The typed phrase must match — a decision, not a reflex, gets to trigger
   an irreversible local wipe.
5. Account erasure (if requested) is queued for human fulfillment, never
   claimed as instant or complete.
6. No badge, no score, no congratulations screen. The closing gate is
   allowed to be quiet.
7. Wipeable stores are the same list `docs/GDPR.md` and
   `app/services/localDataWipe.ts` already maintain — this ritual does not
   fork a second, divergent list of what gets cleared.

## Code map

| Path | Role |
| ---- | ---- |
| `docs/CATHEDRAL_PURGE.md` | This spec |
| `app/lib/cathedralSealCore.ts` | Seal shape + parse (pure) |
| `app/lib/cathedralSealCore.test.ts` | Invariants |
| `app/services/cathedralSealStore.ts` | Seal persistence (SecureStore) |
| `app/lib/cathedralPurgeCore.ts` | Gate sequence, reason options, confirmation-phrase check |
| `app/lib/cathedralPurgeCore.test.ts` | Invariants (linear order, always-cancelable-but-two-gates) |
| `app/app/cathedral-purge/index.tsx` | Runnable UI |
| `app/services/privacyService.ts` | Reused, unmodified: `wipeLocal()`, `requestErasure()` |
| `app/services/localDataInventory.ts` | Reused, unmodified: the "last look" |
| `supabase/functions/cathedral-purge-fulfill/index.ts` | Stub only — not deployed, not called |

## Non-claims

Not a guarantee of complete server-side erasure. Not instant account
destruction. Not clinical crisis intervention — if you are in danger, use
local emergency services, not this. Not a public product — see
`docs/REAL_PURPOSE.md`.

**Last updated:** 2026-07-14
