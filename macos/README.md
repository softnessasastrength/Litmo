# Litmo native macOS apps

This directory is the source of truth for two native SwiftUI targets:

- **Litmo** — participant review surfaces plus three device-local Campfire practices.
- **Litmo Ops** — a separately bundled, fail-closed staff console shell.

The Xcode project is generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen), keeping the reviewable YAML and Swift sources canonical.

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

### Trust history (first server-backed read)

The participant app can load **self-only** trust facts from the existing
`my_trust_signals` RPC (ADR 0029 / ADR 0046). It does not recompute scores,
grant consent, or invent rows when the server is unavailable.

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
