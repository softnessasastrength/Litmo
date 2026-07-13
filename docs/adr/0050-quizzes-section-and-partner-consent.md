# ADR 0050: Quizzes section and partner comparison consent

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

Litmo needs a dedicated Quizzes surface for calm self-understanding. The
onboarding Vibe Quiz already produces playful weather archetypes; people also
need short and deep retakes and a few additional self quizzes without turning
any of that into diagnosis, a public safety score, matching eligibility, or
session consent.

Partner sharing is a real product request: two consenting adults may want to
compare soft “weather” as conversation fuel. Any share path must stay
privacy-preserving, fail closed without mutual consent, and never imply that
quiz similarity grants touch, safety, or a Consent Snapshot substitute.

Onboarding quiz persistence to Supabase (profile archetype) remains separate
from this device-local Quizzes section.

## Decision

### 1. Quizzes tab and catalog

Add a **Quizzes** tab (`app/app/(tabs)/quizzes.tsx`) that catalogs:

| Catalog id        | Family | Path                                    | Approx. length                           | Shareable |
| ----------------- | ------ | --------------------------------------- | ---------------------------------------- | --------- |
| `vibe-short`      | vibe   | Short path from the social-weather bank | ~10 scenes (representative ids) / ~5 min | yes       |
| `vibe-deep`       | vibe   | Full deep path                          | 100 scenes / ~35 min                     | yes       |
| `soft-capacity`   | self   | Soft Capacity                           | ~4 min                                   | yes       |
| `boundary-voice`  | self   | Boundary Voice                          | ~4 min                                   | yes       |
| `comfort-care`    | self   | Comfort & Care                          | ~4 min                                   | yes       |
| `connection-pace` | self   | Connection Pace                         | ~4 min                                   | yes       |

Catalog metadata and disclaimers live in `app/data/quizCatalog.ts`. Short vs
deep Vibe resolution lives in `app/lib/quizPaths.ts` (`vibeQuestionsForMode`):

- **Short:** fixed representative scene ids across dimensions; graceful
  fallback to one question per dimension if ids drift.
- **Deep:** the full 100-scene bank (`quizQuestions`).

Self quizzes live in `app/data/selfQuizzes.ts`. Play / result / partner share
routes: `app/app/quizzes/play.tsx`, `result.tsx`, `share.tsx`.

### 2. Local-first results (not server-mediated partner compare)

- Completed results persist **on-device** via `quizResultsStore` (`AsyncStorage`,
  key `litmo.quizzes.results.v1`). Callers use `quizResultsRepository` for
  optional owner backup (see ADR 0051).
- Invites and seal material persist **on-device only** via
  `quizInviteStore` (`expo-secure-store`, key `litmo.quizzes.invites.v1`).
- Partner comparisons, seal keys, and invite packages have **no** server table
  in this ADR (and remain local-only under ADR 0051).
- Results are **not** trust signals, discovery fields, matching inputs, or
  session activation inputs.
- Without an authenticated backup, clearing app data / reinstall loses results
  and invites (same class of device-local limit as learning progress and
  Campfire).

Onboarding’s separate Supabase-backed vibe write (when a real account completes
onboarding) is unchanged and is **not** the Quizzes section store.

### 3. Face ID step-up on private surfaces

Private result and partner-share screens wrap content in `SensitiveAccessGate`:

- Real account sessions: step-up Face ID (biometric-only, consistent with
  ADR 0007) before private result or invite/compare UI renders.
- Demo / pre-account: gate reports `required=false` and allows the walkthrough
  without biometrics so Expo Go can exercise fictional flows.

The Quizzes **catalog hub** itself is not gated; only result and share routes
are. Taking a quiz does not require step-up; viewing a saved private result does.

### 4. Partner invites, sealing, and four consent gates

Partner flow is out-of-band package exchange (copy/paste JSON), not in-app
messaging or server relay.

1. Host creates an invite (`quizInviteStore.create`) with a high-entropy
   `sealKey` from `expo-crypto` random bytes.
2. Host explicitly consents to **share** → host result is sealed with the
   invite seal (`sealResult` in `quizShareCore`).
3. Host optionally consents to **compare** (separate control; either order of
   host share/compare is allowed, but both are required before compare opens).
4. Host exports a portable package (`exportHostPackage`). Without share
   consent, `sealed` is omitted (`null`).
5. Peer takes the same quiz family, creates/uses an invite path, and exchanges
   packages out of band.
6. Host imports peer package (`importPeerPackage`). Import fails closed if peer
   did not consent to share, quiz ids mismatch, or the seal cannot open the
   ciphertext.
7. Comparison (`canCompare` / `compareInvite`) opens **only** when all four are
   true **and** both sealed payloads are present:

   - `hostConsentToShare`
   - `hostConsentToCompare`
   - `peerConsentToShare`
   - `peerConsentToCompare`

Missing any gate fails closed with a clear message. Share and compare are
independently withdrawable on the host; withdrawing share clears the host
sealed payload. Host **share consent is effective only when a sealed payload
is present** (consent true + `sealed === null` fails closed). Comparison UI
must clear when consents are withdrawn or `canCompare` becomes false.

Peer share/compare flags arrive inside the portable package and are
**self-asserted by the package**, not cryptographically bound intent or
server-mediated dual opt-in. The host trusts the out-of-band package the same
way they would trust a pasted passphrase envelope.

Shareable payload is intentionally narrow (`ShareableQuizResult`): quiz id,
primary/secondary archetype, mix percentages, completed-at, and short notes
only — never private free-text nervous-system notes.

The Quizzes **hub** may show only non-sensitive completion status
(“saved privately”), never primary archetype or mix, because the hub is not
behind `SensitiveAccessGate`.

### 5. Safety copy and non-authority

Comparison always includes a hard-coded consent reminder:

> Shared quiz weather is for conversation only. It is never consent to touch,
> proof of safety, or a substitute for a current Consent Snapshot.

Catalog, hub, and result surfaces repeat that quizzes are not diagnosis, safety
ratings, or consent. Similarity of primary weather is a conversation starter
only.

### 6. Seal crypto posture (explicit limits)

Sealing uses a lightweight, pure, unit-tested XOR stream + derived MAC in
`quizShareCore` (`deriveStream` / `sealResult` / `openSealed`). Purpose:

- Keep results unreadable without the invite seal key during casual package
  exchange.
- Fail closed on wrong key or MAC mismatch.

This is **not** production-grade E2E encryption (not AES-GCM, not CryptoKit,
not WebCrypto AEAD, not forward secrecy, not server-mediated key agreement).
Portable packages currently include the `sealKey` so the peer can open the
payload after out-of-band transfer — confidentiality therefore depends on
treating the package like a password and using a private channel. See
`docs/KNOWN_LIMITATIONS.md`.

## Alternatives considered

- **Server-mediated comparison without dual consent:** rejected; creates a
  central readable comparison surface and weakens mutual agency.
- **Automatic share on quiz complete:** rejected; share must be a second,
  explicit action with withdrawable consent.
- **Treating quiz similarity as compatibility, matching rank, or consent:**
  rejected by constitution and consent model.
- **Public or peer-visible quiz badges / weather on discovery:** rejected for
  this milestone; results stay private unless both parties consent to compare.
- **Full application-encryption vault (ADR 0011 CryptoKit path) for quiz
  results:** deferred; Quizzes are softer than private session notes, and the
  lightweight seal is enough for the first mutual-consent slice. May revisit
  before external beta if threat model requires AEAD + non-exported keys.
- **In-app transport of invite packages (messages table / push):** deferred;
  out-of-band JSON keeps the first slice free of messaging product scope.

## Consequences

### Benefits

- Users can explore short and deep self-understanding calmly on-device.
- Partner comparison is possible only after four explicit consents.
- Quizzes remain non-authoritative for touch, safety, and sessions.
- Unit tests cover seal fail-closed behavior, dual-consent gating, export
  omission without share consent, and safety copy (`quizShareCore.test.ts`,
  path/scoring tests).

### Costs and risks

- Device loss / reinstall loses local invites; own summaries may restore when
  authenticated backup is available (ADR 0051).
- Local results use AsyncStorage (not Secure Store / AEAD); residual device-backup
  and local forensic exposure for saved weather on real accounts even when
  on-screen private views are Face ID gated.
- Seal crypto is a lightweight confidentiality aid, not audited E2E.
- Packages that include the seal key are sensitive if leaked or pasted into
  an insecure channel.
- Peer consent flags in packages are self-asserted (OOB trust model), not
  server-attested dual opt-in.
- Partner compare has no multi-device sync; no staff visibility into results.
- Face ID step-up on result/share is real-account only; demo is intentionally
  ungated for Expo Go walkthroughs.

### Follow-up work

- Privacy review of portable package contents (whether seal keys should leave
  the host package vs. a separate channel).
- Optional upgrade to AEAD / device-bound keys before external beta if
  qualified security review requires it.
- Account deletion UX must clear local invites and respect cascade for owner
  quiz summary rows (ADR 0051).
- Optional physical accessibility review of Quizzes tab and long deep path.
- Do not wire quiz weather into discovery ranking, trust ledger, or Consent
  Snapshot computation without a new ADR.

## Related documents

- `docs/KNOWN_LIMITATIONS.md` — Quizzes / partner-seal limits
- `docs/ARCHITECTURE.md` — Quizzes tab boundary
- ADR 0051 — optional owner-only quiz result summary backup
- ADR 0003 — demo mode (ungated SensitiveAccessGate path)
- ADR 0007 — mandatory Face ID for real sessions
- ADR 0011 — device-bound sensitive encryption (stronger vault; not used here)
- `app/services/quizShareCore.ts` — pure consent and seal logic
- `app/data/quizCatalog.ts` — catalog and disclaimers
