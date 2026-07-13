# Initial onboarding consent flow

**Status:** canonical product design for first-open → home  
**Audience:** product, engineering, accessibility, safety review  
**Code surfaces:** `app/app/index.tsx`, `entry.tsx`, `onboarding/*`, `auth/*`, `profile/vibe.tsx`, `context/AuthContext.tsx`, `context/authState.ts`, `lib/consentInteractionCore.ts`  
**Grammar:** `docs/CONSENT_MICROINTERACTIONS.md` · points `onboard_*` in `CONSENT_POINTS`  
**Related:** ADR 0003 (demo), ADR 0010 (passkeys), ADR 0025 (age range), `docs/TOUCH_LANGUAGE.md`, `docs/CONSENT_FLOW.md`

> Touch is not a transaction — it is a language.  
> **Onboarding is preparation, never consent to touch.**

---

## 0. Design law for first open

| Law | Spec |
| --- | ---- |
| **Prepare ≠ consent** | Every onboarding save authorizes *profile/local state only*. No peer, no session, no body access. |
| **Demo ≠ real** | Demo creates no account, no real matching, no Apple age range. Real accounts do. |
| **Age is eligibility** | Self-report (demo) and Apple Declared Age Range (real) never become safety/trust scores. |
| **Vibe ≠ safety** | Quiz answers are social weather. Forbidden: rank, match, “safe person,” auto-consent. |
| **Map ≠ grant** | Body zones and hard stops are *future snapshot inputs*. Unset = off limits. |
| **Stop stays later** | Soft Signal does not appear as a session stop control during pure onboarding; it appears when a session or practice path exists. |
| **No dead ends** | Every disabled primary has a spoken/visible reason path (a11y hint or copy). |
| **Meaning never color-only** | Zone statuses use labels (Welcomed / Ask first / Off limits), not hue alone. |
| **ND calm by default (demo)** | Demo entry enables Neurodivergent Mode device-locally; not clinical, not matching. |
| **Grant is slow / withdraw is fast** | Does not apply to onboarding *inform* taps. When later grant surfaces appear, grammar still holds. |

### What completing onboarding **never** means

- Consent to any touch, now or later  
- A Consent Snapshot sealed  
- A match, partner obligation, or real person connection (demo)  
- Government ID, birthday storage (Apple path stores coarse eligibility only)  
- Safety certification, diagnosis, or “ready for strangers”  
- Public directory listing of private notes  
- Soft Signal practiced or required  

### What completing onboarding **does** mean

- User chose demo **or** created/signed into a real account path  
- Local (and for real: persisted) display/vibe/preference/boundary *starting points* exist  
- User can open Home and explore prepare flows (discovery, learning, practice Soft Signal)  
- Real accounts still face age gate if not yet adult-eligible  
- Face ID device lock may still apply on real sessions for sensitive surfaces  

---

## 1. Cold launch — before first pixel of product UI

### 1.1 Process start

| Step | System | User-visible | Choice |
| ---- | ------ | ------------ | ------ |
| L0 | OS launches Expo / native binary | System splash (OS/Expo) | None |
| L1 | Load fonts (`CormorantGaramond-Italic`, `BeauRivage-Regular`) | “Preparing Litmo…” if slow | None — wait |
| L2 | Font error | Still continues (stack mounts) | None |
| L3 | Providers mount: Theme → ErrorBoundary → Neurodivergent → Prototype → Auth → BiometricLock | None extra | None |
| L4 | Auth restore | | |

### 1.2 Auth restore matrix (`AuthProvider`)

| Condition | `status` | Route behavior |
| --------- | -------- | -------------- |
| `environmentError` (no Supabase) | `locked` after RESTORED null | Demo path free; real sign-in disabled on entry |
| No session | `locked` | Public routes: `/`, `/entry`, `auth/*` stay; other routes → `/entry` |
| Session + onboarding incomplete | `onboarding` | May navigate away from auth group; product onboarding screens |
| Session + onboarding complete + not adult | `age_gate` | Force `/onboarding/age-gate` |
| Session + onboarding complete + adult | `authenticated` | Auth group → `/home` |
| Session restore fail expired | `expired` | → `/entry` if not public |
| Session restore fail revoked | `revoked` | → `/entry` if not public |
| Other restore fail | `error` | Full-screen failure + Retry (`refreshProfile`) |
| Mid passkey ceremony | `authenticating` / `registering` | “Restoring your private session…” |

### 1.3 Biometric privacy cover

| Condition | Cover |
| --------- | ----- |
| Real account session requires lock + not unlocked | `BiometricLockScreen` over stack |
| Demo mode | Lock rules: Face ID mandatory only for *real* account sessions (see biometric auth state) |
| First open, no account | No cover — welcome is public |

**User actions on lock (if shown):** authenticate with device biometrics / fall through to product fail states per lock screen — **not** part of first-open demo path.

### 1.4 Initial navigation for true first open

| Case | First product screen |
| ---- | -------------------- |
| Clean install, no session | `/` welcome (`index.tsx`) |
| Returning demo (in-memory only) | Lost on kill unless local stores; typically re-entry |
| Returning real, incomplete onboarding | Product may land per restore; onboarding incomplete |
| Returning real, complete, no age | Age gate |
| Returning real, complete, adult | Home |

---

## 2. Global state machines

### 2.1 Path choice (entry)

```text
welcome
  → entry
      ├─[demo]→ about-you → quiz → result → vibe card → touch-language → boundaries → home
      ├─[sign-in]→ auth/sign-in → (restore) → onboarding | age_gate | home
      └─[sign-up]→ auth/sign-up → (restore onboarding) → about-you… → completeProfile → age_gate → home
```

### 2.2 Consent weight along the path

| Phase | Typical `kind` | Weight family |
| ----- | -------------- | ------------- |
| Welcome, name, gender, vibe answers | `inform` | informational (10) |
| Demo entry, TL save, boundary zone, age | `prepare` | prepareNext |
| Platonic adult ack (spec; partial UI) | `prepare` | mutualAffirm-class **purpose** only — still not touch |
| Dual seal / Soft Signal | **not in onboarding** | grant / withdraw — later |

### 2.3 Data stores touched

| Store | Demo | Real |
| ----- | ---- | ---- |
| `PrototypeContext` (name, age, gender, orientation, quiz, TL choices, zones, hard stops, note) | Yes, memory | Yes during path + server |
| `touchLanguageStore` (device) | On TL save | On TL save |
| `NeurodivergentContext` prefs | Default **on** at demo entry | Unchanged unless user sets |
| `profileRepository` progress / complete | No user | Yes |
| Apple age range / age eligibility | **No** | After onboarding complete |
| Supabase session | No | Yes after passkey |

---

## 3. Frame-by-frame — Welcome (`/`)

**File:** `app/app/index.tsx`  
**Consent point:** `onboard_welcome_continue`  
**Kind:** inform · offline · no arm · haptic presence (spec)

### 3.1 Layout (top → bottom)

1. Full-bleed wallpaper (`wallpaper-welcome.png`)
2. Safe area
3. **Mark:** circle with wordmark “L” (brand, not a button)
4. **Kicker:** `WELCOME TO LITMO`
5. **Title:** `Connection can be soft.`
6. **Body (muted):** playful place to learn vibe, name boundaries, practice clear consent
7. **Primary button:** `Explore the prototype`
8. **Caption:** tap-through prototype · imaginary people · local data · **no real account or connection**
9. **Link:** `softnessasastrength.com` → browser

### 3.2 Controls inventory

| Control | Role | Enabled when | On press | Authorizes | Never means |
| ------- | ---- | ------------ | -------- | ---------- | ----------- |
| Explore the prototype | Primary CTA | Always | `router.push("/entry")` | Open entry choice | Account, matching, touch |
| softnessasastrength.com | Link | Always | `Linking.openURL` | Leave app to marketing site | In-app consent |
| System back | OS | If stack allows | Leave app / previous | — | — |

### 3.3 Micro-interactions

| Event | Behavior |
| ----- | -------- |
| Appear | `FadeIn` on mark + hero (respect Reduce Motion via FadeIn impl) |
| Primary press | Standard button press opacity; navigate push (can back to welcome) |
| Link press | `hitSlop={8}`; underline muted text |
| VoiceOver | Button hint: “Opens options for entering the Litmo prototype”; link opens browser |

### 3.4 Choices the user can make

1. Tap primary → Entry  
2. Tap external link → Safari/browser (app remains under)  
3. Kill app  
4. Background app  
5. **Cannot:** skip to Home, Discovery, or demo without Entry  
6. **Cannot:** create account from this screen  

### 3.5 Forbidden patterns

- Auto-enter demo on launch (`forbidden: auto_enter_demo`)  
- Skip to discovery (`forbidden: skip_to_discovery`)  
- Implying “you’re matched” or “you’re safe”  

---

## 4. Frame-by-frame — Entry (`/entry`)

**File:** `app/app/entry.tsx`  
**Consent points:** `onboard_entry_demo`, `onboard_entry_signin`, `onboard_entry_signup`, side-effect `onboard_nd_default_demo`  
**Footer copy (always):** adults · non-sexual · platonic · consent specific, mutual, revocable  

### 4.1 Layout

1. Eyebrow: `Choose how to enter`  
2. Title: `Explore Litmo honestly.`  
3. Body: local prototype · demo = fictional adults · no account / verify / real person  
4. **Card A (if `runtimeConfig.allowDemo`):** Demo mode  
5. **Card B:** Real account · passkeys  
6. Footer legal-purpose line  

### 4.2 Demo card (when allowed)

| Element | Content |
| ------- | ------- |
| Title | Demo mode |
| Body | Path summary: TL, boundaries, discovery, quizzes, learning, fictional peer, consent, Soft Signal, wrap-up; **ND Mode on by default** |
| Notice “Important” | Educational signals only · not consent · not safety proof · partner compare still needs consents · progress may be device-local only |
| Primary | `Enter the fictional demo` |

#### Button: Enter the fictional demo

| Field | Value |
| ----- | ----- |
| Point | `onboard_entry_demo` |
| Sequence | (1) `enterDemoMode()` → status `demo` (2) `setNeuroEnabled(true)` → `onboard_nd_default_demo` (3) `router.replace("/onboarding/about-you")` |
| Stack | **replace** — Entry not under About You (back may leave product path) |
| Network | None required |
| Haptic (spec) | presence |
| A11y hint | No account · ND quieter walkthrough · local progress may remain |

**Side effects of ND default:**

- Short vibe path (~10 scenes) on onboarding quiz  
- Calmer boundary UX (copy about “Mark remaining ask first”)  
- Device-local only · Settings can disable later  
- **Never** clinical diagnosis or match trait  

#### Choices

| Choice | Result |
| ------ | ------ |
| Enter demo | About You step 1 |
| Do nothing | Stay |
| System back | Welcome (if push history) |

### 4.3 Real account card

| Element | Content |
| ------- | ------- |
| Title | Real account · passkeys |
| Body | WebAuthn · Face ID / Touch ID · no passwords · profile/TL/boundaries persist · sensitive screens re-check owner |
| Notice (if env error) | Local service not configured · demo still works |
| Secondary | `Sign in with passkey` → `/auth/sign-in` |
| Secondary | `Create account with passkey` → `/auth/sign-up` |

| Button | Point | Disabled when | On press |
| ------ | ----- | ------------- | -------- |
| Sign in with passkey | `onboard_entry_signin` | `environmentError` | push sign-in |
| Create account with passkey | `onboard_entry_signup` | `environmentError` | push sign-up |

**Disabled state:** controls present but inert; notice explains Supabase missing.  
**Never means:** touches granted; age confirmed without later gate.

### 4.4 Platonic adult purpose ack (`onboard_platonic_adult_ack`)

| Status | Spec vs code |
| ------ | ------------ |
| Catalog | Full point with mutualAffirm-class purpose weight |
| Current UI | **Footer text only** on Entry — **not** a required checkbox yet |
| Recommended | Before demo or before sign-up primary enables: `ConsentAffirmRow` with exact copy primary; fail-closed disable primaries until on |

**Authorizes:** purpose understanding (adults, platonic, non-sexual).  
**Never:** Apple age verification; legal identity.

### 4.5 Micro-interactions

| Event | Behavior |
| ----- | -------- |
| FadeIn | Heading |
| Demo notice | Apricot left border · cream bg · accessible `text` role |
| Env notice | Same pattern |
| Primary demo | Full-width button |
| Secondary real | Two stacked secondary buttons |

### 4.6 Edge cases

| Case | Outcome |
| ---- | ------- |
| `allowDemo === false` | Demo card absent; only real account |
| Supabase missing | Real buttons disabled; demo available if allowDemo |
| User enters demo then kills app | Demo status not durable like session; re-open may show welcome/locked → entry |
| User on Entry while already `demo` | Can re-enter or navigate; no hard block |

---

## 5. Frame-by-frame — About You (`/onboarding/about-you`)

**File:** `app/app/onboarding/about-you.tsx`  
**Steps:** `name` → `age` → `gender` → `orientation` (local index 0…3)  
**Progress:** `Progress current/total` + `A LITTLE ABOUT YOU · N OF 4`  
**Footer always:** “You can change any of this later. None of it is shared until you choose to share it.”

### 5.0 Shared chrome every step

| Control | Behavior |
| ------- | -------- |
| Back (secondary) | step 0 → `router.back()`; else decrement step |
| Next / Continue | Disabled until `canContinue`; last step label `Continue to the quiz` |
| FadeIn | Re-keys on `step` |

`canContinue` matrix:

| Step | Condition |
| ---- | --------- |
| name | `name.trim().length > 0` |
| age | `/^\d{1,3}$/` and `Number(age) >= 18` |
| gender | selection set; if “Something else” then custom non-empty |
| orientation | selection set; if “Something else” then custom non-empty |

---

### 5.1 Step: Name · `onboard_profile_name`

| Element | Spec |
| ------- | ---- |
| Header | What should we call you? |
| Prompt | Just your name — nothing formal. |
| Input | a11y “Your name”; autoCapitalize words; autofocus; placeholder “Your name” |
| Storage | `setAboutYou({ name })` in PrototypeContext |

| User action | Result |
| ----------- | ------ |
| Type characters | Live state |
| Clear all | Next disabled |
| Whitespace only | Next disabled |
| Valid name + Next | Step age |
| Back | Prior screen (Entry if demo replace path may vary) |

**Never:** legal name verification; public directory.

---

### 5.2 Step: Age · `onboard_age_self_report`

| Element | Spec |
| ------- | ---- |
| Header | How many trips around the sun? |
| Prompt | Litmo is for adults only — 18+. |
| Input | number-pad; maxLength 3; strip non-digits |

| Input | canContinue |
| ----- | ----------- |
| empty | false |
| 17 | false |
| 18 | true |
| 99 | true |
| 100–999 | true if digits (no upper cap in code beyond 3 digits) |
| 18a blocked | non-digits stripped |

| User action | Result |
| ----------- | ------ |
| Under 18 | Next stays disabled — **cannot proceed** (`forbidden: allow_under_18_continue`) |
| 18+ + Next | Gender step |
| Back | Name step |

**Authorizes:** local 18+ self-report for **demo/about-you path only**.  
**Never:** Apple Declared Age Range; government ID; consent to touch.

> **Real accounts:** this self-report is **not** a substitute for `/onboarding/age-gate` after profile completion.

---

### 5.3 Step: Gender · `onboard_profile_gender`

| Options (radio) | From `genderOptions` + `Something else` |
| --------------- | ---------------------------------------- |
| Woman, Man, Non-binary, Genderfluid, Genderqueer, Transgender woman, Transgender man, Agender, Two-Spirit | Choice chips |
| Something else | Reveals free-text “In your own words” autofocus |

| User action | Result |
| ----------- | ------ |
| Select preset | Selected; custom ignored for canContinue |
| Select Something else without text | Next disabled |
| Select Something else + text | Next enabled |
| Change selection | Replaces prior |
| Next | Orientation |
| Back | Age |

**Never:** medical classification; matching requirement; binary-only forced.

---

### 5.4 Step: Orientation · `onboard_profile_orientation`

| Options | Straight, Gay, Lesbian, Bisexual, Pansexual, Asexual, Demisexual, Queer, Questioning + Something else |
| Prompt | “helps us understand attraction, **never anything about safety**” |

Same selection/custom rules as gender.

| Final Next label | `Continue to the quiz` |
| On success | `router.push("/onboarding/quiz")` |

**Never:** sexual content invitation; consent to touch; safety signal.

### 5.5 About You edge cases

| Case | Outcome |
| ---- | ------- |
| Rotate device | State preserved in memory |
| Leave mid-flow real user | Progress not yet on server until quiz persist |
| Keyboard covering Next | Screen scroll via Screen component |
| VoiceOver radiogroup | options container role radiogroup |
| Paste age with letters | stripped |

---

## 6. Frame-by-frame — Vibe quiz (`/onboarding/quiz`)

**File:** `app/app/onboarding/quiz.tsx`  
**Point per answer:** `onboard_vibe_answer`  
**Question source:** `vibeQuestionsForMode(short|deep)`  

### 6.1 Mode selection (critical)

| Condition | Mode | Scenes |
| --------- | ---- | ------ |
| `status === "demo"` | short | ~10 (`SHORT_VIBE_IDS`) |
| ND prefs enabled **or** reducedStimulation | short | ~10 |
| Real account, ND off | deep | full bank (100) |

Copy always states: **never consent to touch**.

### 6.2 Per-scene layout

1. Top row: `← Back` (hidden placeholder on first) · counter `i / total`  
2. Progress bar  
3. Theme label (dimension → `quizDimensionLabels`)  
4. Mode hint (short vs deep)  
5. Kicker + prompt (header)  
6. Answer Choices (radiogroup)  
7. Footer note: not a diagnosis; no answer more evolved  

### 6.3 Single answer micro-interaction (full autism)

| t | Event |
| - | ----- |
| 0 | User taps Choice |
| 0 | `setAnswer` in PrototypeContext |
| 0 | `hapticService.play("presence")` |
| 0 | If real user: `profileRepository.saveProgress` (fire-and-forget) with answers + index |
| 0–140ms | Delay (`0` if reduced motion) with selected state visible |
| after | If last → `router.replace("/onboarding/result")`; else index++ |

| Choice property | Behavior |
| --------------- | -------- |
| Re-tap different answer | Replaces answer for that questionId |
| Re-tap same | Still advances after delay (choose always advances) |
| Back | Previous index; re-persist index; **does not clear** prior answer |
| First scene Back | Control absent (placeholder) — cannot go to About You from back control |

### 6.4 Empty / load failure

If no questions: header “Vibe scenes could not load” + note to try About you or Quizzes.

### 6.5 Real-user hydration

On mount with `user`: load draft quizAnswers + questionIndex; filter to known ids; resume index.

### 6.6 Forbidden

- score_as_safety  
- auto_match_from_vibe  
- Interpreting “correct” answers  

### 6.7 User choices summary

| Choice | Effect |
| ------ | ------ |
| Pick A/B/C… | Weather scores accumulate; advance |
| Back | Revisit prior scene |
| Kill app mid-quiz (demo) | Memory lost |
| Kill app mid-quiz (real) | Draft may resume |
| Leave via system (if stack allows) | Depends on navigation history |

---

## 7. Frame-by-frame — Vibe result (`/onboarding/result`)

**File:** `app/app/onboarding/result.tsx`  
**Point:** `onboard_vibe_keep` on primary keep  

### 7.1 Content blocks

1. Eyebrow `A SMALL REVEAL`  
2. Title = archetype name; Body = description  
3. `VibeCard` (primary, optional blend secondary)  
4. Weather mix card — bars per archetype % · model version · “Higher is not better”  
5. Optional signature themes  
6. Meta: answered/count · themes · model fill % · confidence copy · insights  
7. Center muted: **not diagnosis, safety score, or consent. A vibe never grants touch.**  

### 7.2 Buttons (all optional branches)

| Button | Variant | Destination | Consent meaning |
| ------ | ------- | ----------- | --------------- |
| Keep this Vibe Profile | primary | `/profile/vibe` | `onboard_vibe_keep` — save weather only |
| Browse Short & Deep Quizzes | secondary | `/(tabs)/quizzes` | **Detour** — still not consent; can return |
| Try Deep Vibe (100 scenes) | secondary | `/quizzes/play?quizId=vibe-deep` | Optional deeper weather |
| Change answers | secondary | replace `/onboarding/quiz` | Restart path |

### 7.3 Keep path — Vibe card screen (`/profile/vibe`)

Not “home” yet. Controls:

| Button | Goes to |
| ------ | ------- |
| Open full Touch Language | `/touch-language` (full system) |
| Quick touch preferences (onboarding) | `/onboarding/touch-language` **canonical onboarding next** |
| Open Quizzes hub | Quizzes |
| Start Short / Deep Vibe | Play |
| Retake onboarding vibe path | reset answers (+ server draft clear if user) → quiz |

**Recommended happy path:** Keep → Quick touch preferences (onboarding).

### 7.4 Edge cases

| Case | Outcome |
| ---- | ------- |
| Zero answers (deep-linked) | Model still runs; low confidence copy |
| Skip Keep, open Deep Vibe | Leaves linear onboarding; TL/boundaries not forced |
| Skip to Quizzes tab | Same — product allows exploration; **session consent still later** |

> **Product tension (document honestly):** result offers detours that can skip TL/boundaries before Home. Demo happy path expects TL → boundaries. Implementation may later gate Home until `onboard_boundary_save`; today boundaries save is the main gate to `/home` on the linear path.

---

## 8. Frame-by-frame — Touch Language quick onboarding (`/onboarding/touch-language`)

**File:** `app/app/onboarding/touch-language.tsx`  
**Point:** `onboard_touch_language_save`  
**Principle copy:** Preferences are a starting point. Full editor later.

### 8.1 Four required groups (each radio)

| key | Question | Options (label / detail from catalog) |
| --- | -------- | -------------------------------------- |
| pressure | What kind of pressure tends to feel kind? | Feather-light · Comfortably gentle · Steady and grounding |
| speed | What speed feels kindest? | Very slow · Unhurried · Moderate · Brisk but kind |
| duration | How long sounds comfortable? | A brief hello · A few quiet minutes · Let’s decide together |
| environment | Where might your system settle easiest? | Calm public · Outdoors · Hosted community |

`complete` = every group has a selection.  
Selection stored as **label** string in `touchChoices` (migrated to ids on save).

### 8.2 Safety callout (non-dismissible block)

- Title: **Your profile is not consent.**  
- Body: conversation start · every session needs new explicit agreement · Soft Signal ends immediately  

### 8.3 Buttons

| Button | Enabled | Action |
| ------ | ------- | ------ |
| Save and set body areas | `complete && !busy` | Build TL document · `touchLanguageStore.save` · if user: `completeProfile` + boundaries bootstrap · `refreshProfile` · push boundaries |
| Open full Touch Language editor | always | push `/touch-language/edit` — **detour** |

Busy label: `Saving privately…`  
Error: alert role text.

### 8.4 Document flags forced on save

```text
notConsentToTouch: true
shareIsReviewOnly: true
version: 1
```

### 8.5 Real-account `completeProfile` on this screen

When `user` present, save also writes:

- vibe archetype name  
- pressure, duration, environments, holdTypes default, private notes  
- body zones from existing TL zones (or default hands ask_first)  
- hard limits or default “All unlisted body areas are off limits”  

> Note: demo path has **no user** → only local store + PrototypeContext; zones mainly set on next screen.

### 8.6 User choices

| Choice | Result |
| ------ | ------ |
| Pick 4 groups + Save | Boundaries intro |
| Missing one group | Save disabled |
| Open full editor | Non-linear; may return |
| Mid-save error | Stay; show message |
| Back (header) | Prior stack (vibe / result) |

---

## 9. Frame-by-frame — Boundaries (`/onboarding/boundaries`)

**File:** `app/app/onboarding/boundaries.tsx`  
**Points:** `onboard_boundary_zone`, `onboard_boundary_hard_stop`, `onboard_boundary_private_note`, `onboard_boundary_save`  
**Eyebrow:** `BOUNDARIES · LOCAL ONLY · EXPANDED`  
**Progress:** `Step i of 7 · setCount/total zones named`

### 9.1 Step order (7)

| i | Step id | Title focus |
| - | ------- | ----------- |
| 1 | intro | Full map intro + fail-closed + quick mark all |
| 2 | upper | Hands, arms, shoulders, upper back, neck, head/scalp, face |
| 3 | core | Torso, lower back, outer hips |
| 4 | lower | Legs, feet |
| 5 | hard_stops | Absolute hard stop chips |
| 6 | note | Private nervous-system note |
| 7 | review | Summary + save to home |

Zones catalog (`demoBodyZones`) — 12 zones. Unlisted body areas remain off limits by product law.

### 9.2 Status radio per zone (`onboard_boundary_zone`)

| Value | Label | Detail |
| ----- | ----- | ------ |
| welcomed | Welcomed | Usually okay if both confirm in session |
| ask_first | Ask first | Only with clear fresh ask in moment |
| off_limits | Off limits | Not available — silence still means no |

**Tap:** `setBodyBoundary(zoneId, status)` · selected Choice  
**Authorizes:** preferred future snapshot input only  
**Never:** partner may touch now; session consent  

Section complete rule: every zone in section has a status **or** user used “Mark remaining… ask first”.

#### Section chrome

| Control | Behavior |
| ------- | -------- |
| Mark remaining in this section ask first | Fills only unset in section |
| Back | Previous step |
| Continue | Disabled until `groupComplete` |

### 9.3 Intro step detail

| Control | Action |
| ------- | ------ |
| Mark all ask first | `setAllBodyBoundaries("ask_first")` |
| Start body map | goNext → upper |
| ND copy (if enabled) | Explains mark-remaining escape hatch |

Fail-closed card: unset & unlisted = off limits; match/vibe/prior never flip off-limits to welcomed.

### 9.4 Hard stops (`onboard_boundary_hard_stop`)

Multi-select chips (checkbox a11y):

| id | Label |
| -- | ----- |
| face | Face / head contact |
| neck | Neck |
| torso_front | Front of torso / chest |
| hips | Hips / waist grip |
| legs | Legs / thighs |
| surprise | Any surprise touch |
| from_behind | Approach from behind |
| tickling | Tickling or sudden pressure |
| photos | Photos or recording of touch |
| alcohol | Sessions involving alcohol for me |

| User action | Result |
| ----------- | ------ |
| Tap chip | Toggle membership in `hardStops` |
| Zero selected | Allowed — Continue still enabled |
| Continue | Note step |

**Hard stops win** over welcomed zones in product semantics (reinforced in copy).

### 9.5 Private note (`onboard_boundary_private_note`)

| Control | Spec |
| ------- | ---- |
| Multiline input | max 400; char counter |
| Optional | empty allowed |
| Review map | goNext |

**Never:** default share; public bio.

### 9.6 Review + save (`onboard_boundary_save`)

Shows counts:

- Welcomed list · Ask first list · Off limits (incl. unset) · Hard stops · Note if any  

If unset zones remain:

- Warning card  
- Button: Mark remaining ask first  

Safety card: Missing means off limits · Soft Signal still ends anything.

| Button | Action |
| ------ | ------ |
| Back | Note step |
| Save boundaries and continue | `router.replace("/home")` |

**Authorizes:** persist map in PrototypeContext (demo local); open home.  
**Never:** ready to meet strangers; Consent Snapshot sealed.  

> Demo path: **no upload** (a11y hint says so). Real path may have already persisted partial data at TL save via `completeProfile`.

### 9.7 Boundary micro-interaction inventory (exhaustive)

| Interaction | Haptic (spec) | Arm | Offline |
| ----------- | ------------- | --- | ------- |
| Zone status | null | no | yes |
| Hard stop toggle | null | no | yes |
| Private note type | null | no | yes |
| Save continue | confirmation | no | yes |
| Mark all / remaining | none coded | no | yes |

### 9.8 Choices matrix (zone × status)

For each of 12 zones, user may set one of 3 statuses → **36 atomic preference cells**, plus multi-subset of 10 hard stops (2^10 combinations), plus note free text — all still **non-consent**.

---

## 10. Frame-by-frame — Home after onboarding (`/home` / tabs)

Landing after `onboard_boundary_save` is **not** a consent event.

User may now:

- Discover fictional profiles (demo)  
- Open learning modules  
- Practice Soft Signal  
- Prepare Consent Snapshot  
- Start match request flow  

Each of those re-enters **session-time** grammar (`docs/CONSENT_MICROINTERACTIONS.md`), not onboarding points.

---

## 11. Real account path (parallel detail)

### 11.1 Sign-up (`/auth/sign-up`) · from `onboard_entry_signup`

| Step | UI | Action |
| ---- | -- | ------ |
| 1 details | name + email | `requestAccountCode` |
| 2 code | OTP | prepare passkey step |
| 3 passkey | Face ID sheet | `confirmAccountAndCreatePasskey` → device register → restore |

| Cancel Face ID | Stay/recover to code step; session cleared on cancel path |
| Success | `status` = `onboarding` if no `onboardingCompletedAt` |

Then same product screens; quiz uses **deep** unless ND on; TL save calls `completeProfile` (sets `onboardingCompletedAt`).

### 11.2 Sign-in (`/auth/sign-in`) · `onboard_entry_signin`

Passkey ceremony → restore → branch:

| Profile | Next |
| ------- | ---- |
| Incomplete onboarding | Onboarding screens |
| Complete, not adult | Age gate |
| Complete, adult | Home |

### 11.3 Age gate (`/onboarding/age-gate`) · after onboarding complete

**Points:** `onboard_age_apple_range`, `onboard_age_dev_attest`

| UI | Behavior |
| -- | -------- |
| If status demo | “No age check in demo mode” screen only |
| Title | Confirm you are 18 or older |
| Body | Apple privacy-preserving range — not birthday, not ID, not Face ID as age |
| Notice | Stores coarse adult/not/declined only — not trust score |
| Primary | Continue / Try Apple age range → `requestAppleAdultSignal` + `recordSignal` |
| Dev secondary | Only if **!nativeAvailable && !production**: “Development: I confirm I am 18+” |
| Blocked | Adult range not confirmed → stay blocked; no home |
| Success | `refreshProfile` → authenticated → home |

| Failure modes | Message |
| ------------- | ------- |
| User declines system sheet | error text |
| Not adult range | blocked alert |
| Network/API fail | error text |
| Production without native | **No** self-attest — stuck until native available |

**Never:** store exact birthday; reuse Face ID as age proof.

### 11.4 Auth routing force

While `age_gate`, non-age routes replace to `/onboarding/age-gate` (except already there).

---

## 12. Master consent-point map (onboarding)

| Order | Point ID | Screen | Control | kind | Offline |
| ----- | -------- | ------ | ------- | ---- | ------- |
| 1 | `onboard_welcome_continue` | Welcome | Explore the prototype | inform | yes |
| 2 | `onboard_entry_demo` | Entry | Enter the fictional demo | prepare | yes |
| 2b | `onboard_nd_default_demo` | Entry | (side effect of demo) | inform | yes |
| 2c | `onboard_entry_signin` | Entry | Sign in with passkey | prepare | no |
| 2d | `onboard_entry_signup` | Entry | Create account with passkey | prepare | no |
| 2e | `onboard_platonic_adult_ack` | Entry (spec) | Purpose affirm | prepare | yes |
| 3 | `onboard_profile_name` | About You | Name field + Next | inform | yes |
| 4 | `onboard_age_self_report` | About You | Age field + Next | prepare | yes |
| 5 | `onboard_profile_gender` | About You | Gender + Next | inform | yes |
| 6 | `onboard_profile_orientation` | About You | Orientation + Continue | inform | yes |
| 7×N | `onboard_vibe_answer` | Quiz | Each Choice | inform | yes |
| 8 | `onboard_vibe_keep` | Result | Keep this Vibe Profile | prepare | yes |
| 9 | `onboard_touch_language_save` | TL | Save and set body areas | prepare | yes |
| 10×12×3 | `onboard_boundary_zone` | Boundaries | Zone status | prepare | yes |
| 11 | `onboard_boundary_hard_stop` | Boundaries | Hard stop chips | prepare | yes |
| 12 | `onboard_boundary_private_note` | Boundaries | Note field | prepare | yes |
| 13 | `onboard_boundary_save` | Boundaries | Save boundaries and continue | prepare | yes |
| R1 | `onboard_age_apple_range` | Age gate | Apple continue | prepare | no |
| R2 | `onboard_age_dev_attest` | Age gate | Dev attest | prepare | yes |

---

## 13. Timing & motion (onboarding-specific)

| Interaction | Timing |
| ----------- | ------ |
| Welcome FadeIn | Component default |
| Quiz answer → next | 140ms (0 if reduced motion) |
| Boundary / About You Next | Immediate if enabled |
| TL save | Async busy state until store + optional network |
| Age Apple | Busy “Checking…” until sheet + record |
| Soft Signal | **Not armed in pure onboarding** |

Grant arm dwell (320ms) **does not** apply to onboarding Next buttons. Those are not dual-seal grants.

---

## 14. Accessibility checklist (first-open)

| Requirement | Where |
| ----------- | ----- |
| Labels on all inputs | name, age, custom gender/orientation, private note |
| Radiogroup for exclusive choices | gender, orientation, zone status, TL groups, quiz answers |
| Checkbox for multi hard stops | hard stop chips |
| Disabled Next explained via a11yHint where present | boundaries Continue |
| Hit targets ≥ 44–56pt | CONSENT_POINTS minTouchTargetPt |
| Color not sole zone meaning | status labels always |
| Reduce Motion | quiz advance delay 0; FadeIn respects hook where wired |
| External link announced | welcome site link |
| Alerts | TL error, age gate message/blocked |

---

## 15. Edge-case encyclopedia

| # | Situation | Required behavior |
| - | --------- | ----------------- |
| E1 | User under 18 on self-report | Cannot continue About You |
| E2 | User under 18 on Apple range | Blocked on age gate; no home |
| E3 | User declines Apple sheet | Stay on gate; message; retry allowed |
| E4 | Demo claims adult self-report only | Never store as production eligibility |
| E5 | Unset body zones at review | Treated off limits; optional mark ask first |
| E6 | Zero hard stops | Allowed; product still fail-closed on unset zones |
| E7 | Empty private note | Allowed |
| E8 | Kill app mid About You demo | Restart path |
| E9 | Kill app mid quiz real | Resume draft if saved |
| E10 | Supabase down at entry | Demo ok; real disabled |
| E11 | Passkey cancel at sign-up | No sticky global error; back to code |
| E12 | Vibe detour to Quizzes | No session consent implied |
| E13 | Open full TL editor mid-onboarding | Preferences may diverge; re-enter quick path or editor |
| E14 | Double-tap Save boundaries | replace home — idempotent navigation |
| E15 | ND Mode off after demo default | User Settings; quiz short only if still reduced/demo |
| E16 | Face privacy cover mid-onboarding real | Must unlock device owner; does not grant touch |
| E17 | Network loss on completeProfile | Error on TL save; stay; retry |
| E18 | Orientation/gender “Something else” empty | Next disabled |
| E19 | Age field leading zeros | `Number` coercion — `018` → 18 ok |
| E20 | Attempt deep link to `/home` locked | Auth routes to `/entry` |
| E21 | Attempt deep link age-gate in demo | Demo explainer only |
| E22 | Match from discovery without snapshot | Session flow still requires snapshot (post-onboarding law) |

---

## 16. Explicit non-consent claim table (copy anchors)

Every of these strings (or equivalent) must remain true in UI:

| Claim | Location |
| ----- | -------- |
| No real account in demo | Welcome caption, Entry demo |
| Educational ≠ consent/safety | Entry demo notice |
| Adults only | About age, Entry footer, Age gate |
| Attraction ≠ safety | Orientation prompt |
| Weather ≠ diagnosis/consent | Quiz note, Result body |
| Profile ≠ consent | TL safety block |
| Map ≠ session consent | Boundaries intro/review |
| Missing = off limits | Boundaries review |
| Soft Signal ends immediately | TL + boundaries safety |
| Age signal ≠ trust score | Age gate notice |

---

## 17. Happy paths (scripted)

### 17.1 Demo phone-visible (canonical)

```text
Launch → Welcome [Explore]
→ Entry [Enter fictional demo]  // ND on
→ Name "River" [Next]
→ Age 28 [Next]
→ Gender Non-binary [Next]
→ Orientation Queer [Continue to the quiz]
→ Short quiz × ~10 answers
→ Result [Keep this Vibe Profile]
→ Vibe card [Quick touch preferences]
→ TL: pick pressure, speed, duration, environment [Save and set body areas]
→ Boundaries intro [Start body map]
→ Upper/core/lower: set or mark remaining ask first
→ Hard stops: pick any
→ Note: optional
→ Review [Save boundaries and continue]
→ Home
```

### 17.2 Real account first open

```text
Launch → Welcome → Entry [Create account]
→ Email + name → OTP → Passkey
→ About You → Deep quiz (unless ND) → Result → Keep → TL save (completeProfile)
→ Boundaries → Home attempt
→ Age gate [Apple] → Home
```

---

## 18. Implementation gaps vs this design

| Gap | Severity | Notes |
| --- | -------- | ----- |
| `onboard_platonic_adult_ack` not a required control | Medium | Footer text only; wire ConsentAffirmRow |
| Result detours can skip TL/boundaries | Medium | Documented; optional gate before home |
| UI not yet calling `assertConsentPoint` / arm helpers on onboarding | Low | Catalog exists; wire gradually |
| Demo age self-report vs real age gate confusion | Medium | Copy must keep separation (done in prompts; reinforce) |
| `completeProfile` on TL before boundaries finished | Medium | Real users may complete onboarding flag before zone map polished in UI |
| No analytics events named per point | Low | When added, use ConsentPointId only — no sensitive payloads |

---

## 19. Test & verification

| Check | How |
| ----- | --- |
| Catalog points exist | `consentInteractionCore.test.ts` onboard_* suite |
| Under-18 blocked | Manual / future unit on canContinue logic |
| Demo path Maestro | `docs/screenshots/maestro-demo-flow.yaml` / onboarding-deep |
| Typecheck | app package |
| Grammar | neverMeans + forbidden on each point |

---

## 20. Relationship to session consent

```text
ONBOARDING (this doc)          SESSION (CONSENT_FLOW / MICROINTERACTIONS)
─────────────────────          ─────────────────────────────────────────
inform / prepare only          prepare declaration → dual affirm → seal
local maps & weather           immutable snapshot fingerprint
no peer required               peer + mutual required
no Soft Signal required        Soft Signal weight 100 anytime once active
ends at Home                   ends at soft_signaled / complete / cancelled
```

**A finished onboarding is permission to use the app’s prepare tools — never permission to touch a human body.**

---

## 21. File index

| Path | Role |
| ---- | ---- |
| `app/app/index.tsx` | Welcome |
| `app/app/entry.tsx` | Path choice |
| `app/app/onboarding/about-you.tsx` | Profile self-describe + demo age |
| `app/app/onboarding/quiz.tsx` | Vibe scenes |
| `app/app/onboarding/result.tsx` | Weather reveal |
| `app/app/profile/vibe.tsx` | Keep hub → TL |
| `app/app/onboarding/touch-language.tsx` | Preference prepare |
| `app/app/onboarding/boundaries.tsx` | Zone map prepare |
| `app/app/onboarding/age-gate.tsx` | Real adult eligibility |
| `app/app/auth/sign-in.tsx` / `sign-up.tsx` | Passkey path |
| `app/lib/consentInteractionCore.ts` | `onboard_*` points |
| `app/context/authState.ts` | Status machine |
| `app/context/PrototypeContext.tsx` | Demo zones & hard stops |

---

*End of initial onboarding consent flow design. Update this document in the same workstream as any onboarding UX change.*
