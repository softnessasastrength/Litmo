<div align="center">

<br />

# Litmo

### Touch is not a transaction — it is a language.

**A consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.**

<br />

[**Why Litmo**](#why-litmo) · [**Core experience**](#the-core-experience) · [**Safety**](#safety-is-product-logic) · [**Status**](#where-we-are) · [**Try the demo**](#try-it)

<br />

```text
  soft presence  ·  explicit consent  ·  easy exits  ·  no scores
```

<br />

</div>

---

## Why Litmo

Loneliness is not only in the mind. It lives in the body too.

Adults can go months — or years — without safe, affirming platonic touch. Not because they do not need it, but because we never built a shared grammar for asking for it without confusion, coercion, or shame.

Dating apps optimize for engagement. Clinical tools are not social infrastructure. “Just hug someone” is not a safety design.

**Litmo exists to protect the language of touch** — not to sell it, score it, or turn it into a game.

| Litmo is | Litmo is not |
| --- | --- |
| Consent infrastructure for platonic touch | A dating or hookup app |
| Explicit boundaries before bodies meet | Therapy or clinical care |
| Session-specific, revocable agreement | Emergency or crisis services |
| Soft stops without explanation | A public safety score |
| Built for adults 18+ only | A product for minors |

> **Litmo is not trying to optimize touch. It is trying to protect it.**

Read the [Founding Thesis](docs/philosophy/00_Founding_Thesis.md) if you want the full human argument.

---

## The core experience

A calm path from self-knowledge to mutual confirmation — and always an exit.

```text
Welcome
  → Vibe (social weather, never consent)
  → Touch Language (what feels okay on your body)
  → Learn (short lived lessons)
  → Discover / Nearby / Careful connect
  → Consent Snapshot (both people affirm the same map)
  → Active session
  → Soft Signal or End together
  → Private wrap-up + trust history
```

### Touch Language

Name pressure, duration, body zones, environment, and nervous-system context **before** anyone is near you. Private notes stay private.

### Consent Snapshot

Both people review the **exact intersection** of current boundaries. A match, a vibe, a quiz result, or a prior session is **never** consent.

### Soft Signal

End immediately. No explanation. No penalty. No social negotiation. Soft Signal is product logic — not decorative copy.

### Guided Learning

Short, trauma-informed modules on consent language, Soft Signal, blocking, and trust signals. Calm pace. Device-local progress. Optional Neurodivergent Mode.

### Quizzes & partner weather

Self-understanding only. Partner comparison needs **four separate consents** and optional E2E encryption. Weather is never a safety score and never activates a session.

### Nearby, NFC, QR

Opt-in proximity radar, Multipeer share, and NFC/QR careful-connect — with **explicit accept after every scan**. Identity is gated. Radio is off by default.

---

## Safety is product logic

These are not slogans. They are enforced in flows, data, and authorization.

| Principle | What it means in practice |
| --- | --- |
| Consent is active | Specific person, moment, and map — never inferred |
| Strictest boundary wins | Overlap is the only permitted set |
| Mutual confirmation | Both must affirm the same immutable snapshot |
| Easy exits | Soft Signal and withdrawal beat “continue” |
| Privacy by default | Sensitive data is local or encrypted; minimize collection |
| Trust ≠ safety | History can inform; it never certifies a person |
| Fail closed | Missing, stale, or contradictory data blocks progress |
| Human review | Harm and coercion are not auto-punished by a model |

**Passkeys first** for real accounts (Face ID / Touch ID). Device binding gates real consent confirmation. Demo mode needs no account.

Deep dives: [Consent Flow](docs/CONSENT_FLOW.md) · [Trust System](docs/TRUST_SYSTEM.md) · [Authentication](docs/AUTHENTICATION.md) · [Constitution](docs/LITMO_CONSTITUTION.md)

---

## Who this is for

- Adults who want **platonic** physical connection with clarity  
- Trauma survivors and neurodivergent people who need **pace, language, and exits**  
- Builders who care about **consent systems**, not engagement hacks  
- Reviewers evaluating a **private-alpha foundation** honestly  

If you are looking for a dating product, this is not it.  
If you are looking for crisis care, please contact local emergency services — Litmo does not provide them.

---

## Where we are

<div align="center">

| | |
| :---: | :--- |
| **Status** | Advanced **private-beta foundation** |
| **Ready for** | Local demo, engineering review, invite-only alpha prep |
| **Not ready for** | Stranger meetings, public launch, production “safe” claims |

</div>

### Built

- Phone-visible vertical slice (Expo Go demo + iOS dev build path)  
- Consent engine, session lifecycle, Soft Signal, private wrap-ups  
- Passkey-first auth, device binding, sensitive-data vault  
- Chapter 5 safety surfaces + private-alpha ops foundations  
- Quizzes, Guided Learning, Neurodivergent Mode  
- Nearby share, proximity layer, NFC/QR careful-connect  
- MPL-2.0 license; documented ADRs and known limits  

### Still honest gaps

- Not production-ready for stranger discovery  
- Human recovery without a passkey is intentionally locked  
- Some physical accessibility and crypto review remain open  
- Destructive deletion and full legal/privacy claims stay blocked until named owners  

> **Do not use the current build to arrange real-world sessions with strangers.**

Handoff truth: [`CURRENT_STATE.md`](CURRENT_STATE.md) · Limits: [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)

---

## Try it

### Demo in minutes (no Docker)

```bash
npm ci
npm run mobile
```

On your phone: **Expo Go** → scan → **Explore the prototype** → **Enter the fictional demo**.

Fictional adults only. No real matching. Neurodivergent Mode on by default in demo.

### Real accounts (local stack)

```bash
npm ci
npm run db:start && npm run db:reset
cp app/.env.example app/.env   # paste URL + anon key from supabase status
npm run dev
```

Passkeys need an **iOS development build** (not Expo Go). See [Local Development](docs/LOCAL_DEVELOPMENT.md) and [Authentication](docs/AUTHENTICATION.md).

### Verify

```bash
npm run state:check && npm run lint && npm run typecheck && npm test
```

---

## Under the hood

| Layer | Stack |
| --- | --- |
| Mobile | React Native · Expo 55 · TypeScript · Expo Router |
| Auth | Supabase Auth WebAuthn · native passkeys · Face ID lock |
| Domain | Shared consent & session rules (`shared/`) |
| Data | Supabase Postgres · RLS · Realtime · Edge ceremony ops |
| Safety | Soft Signal, blocks, reports, rate limits, device binding |

```text
Litmo/
├── app/         Mobile client
├── backend/     Express + domain services
├── shared/      Canonical consent / session logic
├── supabase/    Migrations, RLS, Edge functions, pgTAP
├── docs/        Product, safety, architecture, ADRs
└── documents/   Governance & design philosophy
```

More: [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY_MODEL.md) · [Doc map](docs/DOCUMENTATION_MAP.md)

---

## Philosophy order

```text
Founding Thesis  →  Constitution  →  Product  →  Architecture  →  Code
```

Convenience never outranks consent. Growth never outranks privacy. Code never silently invents safety claims.

---

## Contribute

We welcome careful work. We do not welcome dark patterns, engagement traps, or “just ship it” on consent surfaces.

1. Read the [Founding Thesis](docs/philosophy/00_Founding_Thesis.md) and [Constitution](docs/LITMO_CONSTITUTION.md)  
2. Check [`CURRENT_STATE.md`](CURRENT_STATE.md) and [`TASKS.md`](TASKS.md)  
3. Prefer small, tested, documented changes  

> **Safety logic is product logic, not decorative copy.**

---

## License

Except where noted, Litmo is **[MPL-2.0](LICENSE)** — file-level copyleft. Licensing does not waive safety requirements or grant trademarks. See [ADR 0044](docs/adr/0044-mpl-2.0-project-license.md).

---

<div align="center">

<br />

**Softness as a strength.**

*Built for consenting adults. Non-sexual. Platonic. Specific. Revocable.*

[Thesis](docs/philosophy/00_Founding_Thesis.md) · [Consent](docs/CONSENT_FLOW.md) · [Auth](docs/AUTHENTICATION.md) · [Status](CURRENT_STATE.md) · [Limitations](docs/KNOWN_LIMITATIONS.md)

<br />

</div>
