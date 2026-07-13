# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected recommended defaults 2026-07-13; external review blockers remain
- **Branch:** `main`
- **Latest swarm:** NUCLEAR-001 six-agent activation 2026-07-13 — Living Constitution enforceable by design; see `docs/NUCLEAR_SWARM.md`

## Completed major product streams (on main)

| Stream | Status | Docs |
| ------ | ------ | ---- |
| Touch Language (visual map, axes, share) | shipped | `docs/TOUCH_LANGUAGE.md` |
| Consent Snapshot prepare + mutual seal | shipped | `docs/CONSENT_SNAPSHOT_SYSTEM.md` |
| **Nuclear session + seal machine** | shipped (domain+SQL) | ADR 0062 · `@litmo/domain` `sessionConsentNuclear` |
| Soft Signal + trauma safety (panic/timeout/reflect) | shipped | `docs/SOFT_SIGNAL.md`, `docs/TRAUMA_INFORMED_SAFETY.md` |
| **Neurodivergent Mode v3** (sensory/pace/language/exits) | shipped | `docs/NEURODIVERGENT_MODE.md` · `neuroAccommodationCore` |
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

## Priority next work

1. Name second safety reviewer and document before flipping
   `named_second_owner_configured` (service-role only).
2. Physical device smokes (Soft Signal offline, proximity two-device, NFC, VO).
3. Optional: TL → server shape fidelity (`speed`, `soft_limit`).
4. Optional: dual-agreed timeout on Consent Snapshot.
5. Name crypto reviewer before external beta.
6. Do not unlock Ops without server-backed staff authentication.

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

- Repository artifacts are the source of truth.
- Consent is explicit, current, revocable, session-specific.
- Soft Signal is unilateral; never a penalty; not emergency services.
- Personal data is local-first (ADR 0058).
- Device is a room for presence; phone is the studio.

## Exact next action

Nuclear session/consent domain + SQL (ADR 0062) and SAFETY-OPS HITL (ADR 0061)
are in-repo. Next: named second safety reviewer, physical offline Soft Signal
chaos, or continuous-consent UI heartbeat/zone-kill. Do not invent
legal/clinical approval or named staff.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `docs/FEATURE_SWARM_TRACKER.md`, `project-state.json`.
2. Read `docs/KNOWN_LIMITATIONS.md` and recent ADRs (0058–0059, 0050–0057).
3. Run `git status` and inspect recent commits.
4. Verify last recorded checks before changing code.

## Stop checklist

1. Stop at a coherent boundary.
2. Update this file, `TASKS.md`, and the swarm tracker if streams moved.
3. Commit docs with code in the same workstream.
