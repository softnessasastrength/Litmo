# Third-Party Notices

**This is currently a personal emotional containment system, not a public product.**

**Status:** Engineering audit, not a legal compliance certification. Part of
`TASKS.md`'s DOCS-002 follow-up work ("trademark policy, third-party notice
audit, and qualified legal review remain follow-up governance work").

---

## What this is

A real license audit of this repository's direct and transitive npm
dependencies, run with [`license-checker`](https://www.npmjs.com/package/license-checker)
(invoked via `npx`, one-off — not added as a project dependency; see
`AI_COLLABORATION_CONSTITUTION.md` §13 on preferring fewer, well-understood
dependencies). Regenerate with:

```bash
cd app && npx license-checker --summary   # or --json for full detail
cd backend && npx license-checker --summary
cd shared && npx license-checker --summary
```

## Results (2026-07-14)

| Workspace | Packages | Licenses found |
| --------- | -------- | -------------- |
| `app/` | 72 | MIT (69), MIT AND Apache-2.0 (1), ISC (1), UNLICENSED (1 — `litmo-app` itself, private) |
| `backend/` | 48 | MIT (45), BSD-2-Clause (1), BSD-3-Clause (1), UNLICENSED (1 — `litmo-backend` itself, private) |
| `shared/` | 1 | UNLICENSED (the package itself; no runtime dependencies of its own) |

**Finding: every third-party npm dependency found is permissively licensed**
(MIT, BSD-2-Clause, BSD-3-Clause, ISC, or Apache-2.0). No copyleft (GPL,
AGPL, LGPL) or source-available/restrictive licenses were found in this
scan. `UNLICENSED` entries are this project's own private package.json
files, not third-party code — expected and correct, not a gap.

## What this does NOT cover (honest scope limits)

- **Native iOS dependencies (CocoaPods, `app/ios/Podfile.lock`) and Swift
  Package Manager packages** are a completely separate ecosystem from npm
  and are **not** audited by `license-checker`. React Native, Expo's native
  modules, and any Pod dependencies each carry their own licenses (React
  Native and most Expo modules are MIT, but this has not been individually
  re-verified pod-by-pod here). A real native-dependency license audit
  would need a CocoaPods-specific tool (e.g. `pod-licenses` or manual
  `Pods/Target Support Files/Pods-*/Pods-*-acknowledgements.plist` review)
  and is a separate follow-up, not claimed as done here.
- **This snapshot reflects `node_modules` as installed on one developer
  machine on one date.** It is not a CI-enforced check — a dependency
  could be added later with a different license and this document would go
  stale until re-run. No automated gate currently re-runs this on every
  dependency change (a real follow-up, not built here).
- **Not legal advice, not a compliance certification.** "Permissively
  licensed" here means what `license-checker` reports from each package's
  own declared `license` field — it does not substitute for a lawyer
  confirming actual compatibility with `LICENSE` (MPL 2.0) or with any
  future distribution plan.

## Why this matters for `LICENSE` (MPL 2.0)

MPL 2.0 is compatible with permissive licenses in dependencies (you can
combine MPL-licensed code with MIT/BSD/Apache/ISC-licensed dependencies
without relicensing them). This audit's finding — no copyleft dependencies
present — means there is currently no license-compatibility conflict to
resolve. If a future dependency is added under GPL/AGPL/LGPL, that would
need explicit review before merging, not after.

## Related documents

- `LICENSE` — the actual license this repository is distributed under
- `NON_MONETIZATION_COVENANT.md` — the values pledge layered on top of it
- `docs/adr/0044-mpl-2.0-project-license.md` — the original licensing decision
- `TASKS.md` DOCS-002 — the task this audit closes part of

**Last updated:** 2026-07-14
