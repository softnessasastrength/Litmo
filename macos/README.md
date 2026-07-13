# Litmo native macOS apps

This directory is the source of truth for two native SwiftUI targets:

- **Litmo** — participant review surfaces plus three device-local Campfire practices.
- **Litmo Ops** — a separately bundled, fail-closed staff console shell.

The Xcode project is generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen), keeping the reviewable YAML and Swift sources canonical.

## Dual mode (MAXIMUM_MODE)

macOS builds are **always MAXIMUM_MODE** (full consent prepare/practice honesty):

- Swift package: `../packages/LitmoBuildMode` (SPM)
- `project.yml` sets `SWIFT_ACTIVE_COMPILATION_CONDITIONS: MAXIMUM_MODE`
- Home shows build-mode badge + domain-authority disclaimer (`ConsentFlowNotes`)

iOS App Store Safe mode lives in the Expo app (`app/`), not in this Mac shell.
See `docs/DUAL_MODE_ARCHITECTURE.md`.

```sh
# Package unit tests
cd ../packages/LitmoBuildMode && swift test
```

## Generate and run

On a Mac with Xcode and XcodeGen installed:

```sh
cd macos
xcodegen generate
open LitmoMac.xcodeproj
```

Choose the `Litmo` or `LitmoOps` scheme. Signing is automatic for local development; select your Apple developer team if Xcode asks.

## Security and product boundary

The participant app does not own active physical sessions or Soft Signal. The TypeScript/server domain remains authoritative for consent and authorization. Campfire is local and ephemeral. The Ops target has a different bundle identifier and entitlement file, shares no app group, and exposes no action until real staff authentication and server authorization exist.

### Server-backed participant reads

The participant app can load **self-only** server data when configured:

| Surface | Contract | ADR |
| --- | --- | --- |
| Trust history | `my_trust_signals` RPC | 0046 |
| Profile | owner-RLS `profiles` row | 0047 |
| Requests | `list_incoming_requests` / `list_outgoing_requests` (read-only) | 0048 |
| Export | `export_my_data` (self-only; optional local JSON copy) | 0049 |

Neither surface recomputes consent, invents rows when unavailable, or unlocks
Ops. Shared fail-closed transport lives in `LitmoMacCore`.

For local inspection only, supply:

```sh
export LITMO_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export LITMO_SUPABASE_ANON_KEY="your-anon-key"
export LITMO_ACCESS_TOKEN="user-access-token-from-an-authenticated-session"
```

Then launch the generated `Litmo` scheme from Xcode (or pass the same variables
into the scheme’s environment). Missing configuration or session tokens fail
closed with an explicit unavailable state. Do not commit tokens. This is not
passkey sign-in or production account UX.

The hosted workflow compiles unsigned apps and runs unit tests. Its artifacts are for build inspection only, not distribution.
