# ADR 0049: macOS self-export read model

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

Migration 036 provides `export_my_data()` as a self-only structured portability
RPC. Mobile still lacks UI. macOS can surface a fail-closed inspection and
copy path without implementing deletion or claiming legal completeness.

## Decision

1. Add a read-only **Export** sidebar that calls `export_my_data` via shared
   participant transport.
2. Display category presence and array counts; do not invent missing categories.
3. Allow **user-initiated** copy of pretty JSON to the local pasteboard only.
4. Fail closed without config, session, or successful decode.
5. Document that this is an engineering portability primitive, not GDPR-complete
   access, not account deletion, and not a consent record.

## Alternatives considered

- **Auto-download file:** deferred; pasteboard copy is enough for founder inspection.
- **Mock export when offline:** rejected.
- **Staff-visible export:** rejected; self-only only.

## Consequences

- Participants can inspect export shape on Mac when authenticated.
- Legal completeness and destructive deletion remain separate review work.
