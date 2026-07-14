# Current Project State

**This is currently a personal emotional containment system, not a public product.**

Primary framing (2026-07-13): private psychological containment / emotional shield —
[`docs/REAL_PURPOSE.md`](docs/REAL_PURPOSE.md) · [`docs/CONTAINMENT_SYSTEM.md`](docs/CONTAINMENT_SYSTEM.md).

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Purpose framing (overrides product narrative)

- **This is currently a personal emotional containment system, not a public product.**
- Primary: Option A — keep building so fear/conflict/intimacy anxiety land in code, not on Renn first
- Map: `docs/CONTAINMENT_SYSTEM.md` · purpose: `docs/REAL_PURPOSE.md`
- Secondary layers: exorcism/dojo docs, trauma architecture, logical extreme (still useful, not the core stamp)
- Constitution: root `CONSTITUTION.md` (update notices to match containment honesty)

## Active milestone

- **Name:** Containment honesty + residual craft (engineering may continue under Option A)
- **Status:** personal shield; not private-alpha product theater
- **Branch:** `main`
- **Latest framing:** REAL_PURPOSE / CONTAINMENT_SYSTEM 2026-07-13
- **Constitution:** technical twin still at `docs/LITMO_CONSTITUTION.md`

## Completed major product streams (on main)

| Stream | Status | Docs |
| ------ | ------ | ---- |
| Touch Language (visual map, axes, share) | shipped | `docs/TOUCH_LANGUAGE.md` |
| Consent Snapshot prepare + mutual seal | shipped | `docs/CONSENT_SNAPSHOT_SYSTEM.md` |
| **Nuclear session + seal machine** | shipped (domain+SQL) | ADR 0062 · `@litmo/domain` `sessionConsentNuclear` |
| Soft Signal + trauma safety (panic/timeout/reflect) | shipped | `docs/SOFT_SIGNAL.md`, `docs/TRAUMA_INFORMED_SAFETY.md` |
| **Neurodivergent Mode v3** (sensory/pace/language/exits) | shipped | `docs/NEURODIVERGENT_MODE.md` · `neuroAccommodationCore` |
| **Semantic haptic language** (composable grammar) | shipped (phone) | `docs/HAPTIC_LANGUAGE.md` · ADR 0063 · hardware design |
| **Apple Watch haptic co-regulation** | domain + **watch/ scaffold** | ADR 0064 · `watch/` · WATCH_INTEGRATION.md |
| Proximity · NFC · QR · Multipeer | shipped | `docs/PROXIMITY_LAYER.md`, `docs/NFC_FEATURES.md` |
| Guided Learning (lived + foundations + paths) | shipped | `docs/LEARNING_SYSTEM.md` |
| Local-first vault + encrypted backup | shipped | `docs/LOCAL_FIRST.md` (ADR 0058) |
| Device OS + Soft Edge haptics | **design** | `docs/HARDWARE/DEVICE_OS.md`, `HARDWARE/HAPTICS.md` |

Foundation through BETA-001, ACCESS-001 engineering, macOS participant reads (ADRs 0045–0049), quizzes (ADR 0050–52) also on `main`.

## Work in progress / residuals

- SAFETY-OPS-001 engineering foundation deepened (ADR 0061 / migration 042 /
  `safetyOpsCore` / `docs/SAFETY_OPS_RUNTIME.md`). External/legal/staffing
  blockers remain (not inventable): named second reviewer, destructive
  retention, jurisdiction, external referral, complete deletion.
- Session nuclear machine (ADR 0062 / migration 043) shipped in domain + SQL;
  continuous-consent **UI clocks** and physical offline Soft Signal chaos still open.
- ND Mode v3 second-level accommodations shipped (demo-strength default); ACCESS-001
  physical VoiceOver smoke still open.
- ACCESS-001 residual: optional founder VoiceOver physical smoke.
- Swarm residuals: dual-agreed session duration; TL soft_limit/speed server mapping; physical Multipeer/NFC/Soft Signal chaos; independent crypto review.
- Litmo Ops remains locked without staff auth.

## Priority next work (Dojo order)

1. **See:** `LOGICAL_EXTREME.md` theorems + D01–D24 inventory; notice urge before code.
2. **Name:** New work gets a D-id / trauma row or it is refused as unconscious control.
3. **Meta:** Do not feed D23/D24 (infinite dojo / infinite docs) as fake progress.
4. **Simplify when ready:** Prefer honest reduction over nuclear expansion.
5. **Burn readiness:** Gates G1–G6 in LOGICAL_EXTREME; protocol in BURN_PROTOCOL.
6. **Product residue (only if explicitly requested):** never invent approvals.

## Exact next action

- Done: **16-agent autism mode** P0+P1 gaps G1–G10, G12–G13 closed.
  Residual: G11 ADR 0060 prose reconcile.
- **Docs index:** `docs/16_AGENT_MODE.md` · run log `docs/16_AGENT_AUTISM_MODE_RUN.md`
  · synthesis `docs/DUAL_MODE_16_AGENT_SWARM.md`.
- Containment cook still on main (Pre-Renn · Weather · Flood · Field Notes…).
- Physical Watch + VoiceOver smoke still open.
- Follow `docs/REAL_PURPOSE.md`.

## Verification baseline

```bash
npm run state:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run db:lint
npm run build
```

## Known limitations and risks

- Product is not production-ready for stranger meetings.
- Hardware Device OS is design-only (not a shipping SKU).
- Real Multipeer/NFC need iOS development builds (Expo Go practice paths).
- Local session timeout is preference-only until server dual-agree.
- Physical VoiceOver and offline Soft Signal chaos still pending.

## Architectural decisions

- Repository artifacts are the source of truth (including dojo framing).
- Sacred purpose: Trauma-to-Code Exorcism Dojo — not a consumer product.
- Soft Signal is unilateral; never a penalty; not emergency services.
- Control systems must be nameable as defenses (`TRAUMA_ARCHITECTURE.md`).
- Personal data is local-first (ADR 0058).

## Resume checklist

1. Read `docs/EXORCISM_MANIFESTO.md`, `docs/DOJO_GUIDELINES.md`, `docs/DOJO_CONTINUE.md`.
2. Read `CURRENT_STATE.md`, `docs/TRAUMA_ARCHITECTURE.md`.
3. Run `git status` and inspect recent commits.
4. Prefer see/name/simplify over product residue unless asked.

## Stop checklist

1. Stop at a coherent boundary.
2. Update this file, `TASKS.md`, and the swarm tracker if streams moved.
3. Commit docs with code in the same workstream.
