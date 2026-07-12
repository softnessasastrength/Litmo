# Chapter 4 Merge Repair

## Status

The Chapter 4 branch diverged from `main` after the common ancestor `f36e6e7f14c1a136d5205504f2218fe65e87048b`.

- Chapter 4 branch: 34 commits ahead
- Chapter 4 branch: 41 commits behind `main`
- Repair branch: `repair/chapter-4-merge`

## Conflict analysis

Despite the large PR surface, only two paths were changed on both sides after the common ancestor:

1. `README.md`
2. `package.json`

The remaining `main` changes are additive continuity, governance, philosophy, and wiki files and should be preserved intact.

## Resolution policy

- Preserve all Chapter 4 runtime, migration, security, and test work.
- Preserve all `main` continuity and governance files.
- Merge the README so the public project overview reflects both the current product state and the newer philosophy/governance links.
- Merge `package.json` so Chapter 4 commands remain available alongside `state:check`.
- Run state validation, lint, typecheck, tests, build, database reset/lint, and integration tests before updating PR #13.
- Do not use blanket “ours” or “theirs” conflict resolution.

## Required checks

```bash
npm ci
npm run state:check
npm run lint
npm run typecheck
npm test
npm run build
npm run db:start
npm run db:reset
npm run db:lint
npm run test:integration
```

The original Chapter 4 PR must remain unmerged until the repair branch has been verified and reconciled.
