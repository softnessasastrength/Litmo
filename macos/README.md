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

The hosted workflow compiles unsigned apps and runs unit tests. Its artifacts are for build inspection only, not distribution.
