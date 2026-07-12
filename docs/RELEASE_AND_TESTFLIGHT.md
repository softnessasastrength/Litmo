# Release architecture and TestFlight operations

## Status

Automated release hardening exists, but this repository is **not yet approved for TestFlight use with real interactions**. Hosted staging/production services, AASA endpoints, push credentials, account deletion/session-revocation operations, legal privacy disclosures, independent security/accessibility review, and signed archive upload remain manual blockers.

For **founder / private physical validation** before those blockers clear, use
[`docs/PHYSICAL_BETA_WALKTHROUGH.md`](PHYSICAL_BETA_WALKTHROUGH.md). Completing
that checklist is not TestFlight approval.

## Xcode Source Kit releases

GitHub Releases can publish a developer-facing source archive named `Litmo-Xcode-Source-<tag>.zip`.

The source kit is intentionally different from a signed `.ipa` or TestFlight build. It contains the app, shared package, checked-in native iOS project, lockfiles, and a launcher named `release/Open Litmo.command`. A reviewer can unzip the archive and double-click the launcher; it installs the locked npm and CocoaPods dependencies, then opens the correct `.xcworkspace` in Xcode.

Litmo uses CocoaPods, so opening the `.xcodeproj` directly is not supported: it omits the Pods integration. The `.xcworkspace` is the authoritative Xcode entry point.

The source kit contains no secrets, certificates, provisioning profiles, hosted-backend credentials, or production configuration. The recipient must select their own Apple development team and provide any environment required for backend-dependent features.

The workflow is defined in `.github/workflows/xcode-source-release.yml`:

- pushing a tag matching `v*` creates or updates a prerelease and attaches the ZIP;
- manual workflow runs produce the same ZIP as a downloadable Actions artifact;
- packaging is performed by `scripts/package-xcode-source-kit.sh`;
- generated dependency directories, local environment files, build output, and secrets are excluded.

## Environment separation

| Profile                      | App environment | Bundle ID               | Associated domain                 | Data policy                                                      |
| ---------------------------- | --------------- | ----------------------- | --------------------------------- | ---------------------------------------------------------------- |
| development                  | development     | `com.litmo.app.dev`     | `dev.softnessasastrength.com`     | Local Supabase and explicit fictional demo allowed               |
| preview/TestFlight candidate | staging         | `com.litmo.app.staging` | `staging.softnessasastrength.com` | Hosted staging only; demo hidden; synthetic invite accounts only |
| production                   | production      | `com.litmo.app`         | `softnessasastrength.com`         | Production backend only; demo and diagnostics hidden             |

Supabase URLs and anon keys are injected by the build environment and are never committed. `npm run release:check` rejects local HTTP endpoints, placeholder/privileged keys, profile mismatches, missing entitlements/privacy/AASA files, local `.env` release sources, embedded JWT-like secrets, and unreviewed console diagnostics.

The checked-in Xcode project is production-identified. A direct Xcode archive is
therefore not a staging build. Resolve and verify `app/app.config.ts`, then use
the EAS `preview` profile for a staging candidate; inspect the resulting archive
before distribution. This boundary is recorded in ADR 0013.

## Release procedure

1. Provision isolated hosted Supabase staging, apply migrations, and configure passkey RP/AASA values.
2. Set EAS staging secrets: `EXPO_PUBLIC_SUPABASE_URL`, public anon key, and profile environment. Never use production values in preview.
3. Run the complete repository checks and `release:check` with staging variables.
4. Verify privacy manifest aggregation and every third-party SDK declaration after Pods changes.
5. Build/archive with the staging bundle/signing profile. Inspect entitlements in the archive.
6. Perform the real-device plan below; invite only named testers.
7. Roll back by expiring the TestFlight build, revoking staging sessions/devices, disabling invitations, and restoring the prior known-good build/backend migration snapshot. Database rollback must be forward corrective migrations, never destructive history rewriting.

## Privacy and diagnostics

No analytics or crash-reporting vendor is configured. Any future provider must receive only pre-redacted operational codes; never identity beyond minimum pseudonymous operation, Touch Language, consent, rejection/withdrawal/safety content, tokens, keys, biometric outcomes, or screenshots. Development/staging diagnostics expose only environment and build version and are unavailable in production.

Notifications are generic and private detail remains behind app unlock. App-switcher shields and Face ID cover sensitive screens, but deliberate screenshots/recordings after unlock remain possible.

## Account/device controls and blockers

Sign-out and device revocation exist. Current-device revocation signs out and clears its local secret. Full account deletion, all-session revocation, server credential revocation, deletion tombstones, export, and user-facing local encrypted-data clearing are **not yet implemented** and block external beta. Database cascade behavior is not a substitute for a reviewed deletion workflow.

## First-launch/onboarding content required before invitation

Testers must be shown Litmo's non-emergency/non-clinical limits, Face ID/passkey requirements, generic notification policy, Touch Language, immutable Consent Snapshots, session-specific/revocable consent, immediate emergency stop without mutual agreement, Trust Ledger limitations, deletion limitations, screenshot limitations, and experimental beta status. The existing product flow covers several concepts but not one audited first-launch sequence; this is a blocker.

## TestFlight test plan

For every scenario: use staging synthetic accounts only; never submit private session content, another person's identity, safety reasons, consent screenshots, tokens, or keys. Product feedback is not safety reporting or emergency support.

| Scenario                                         | Prerequisite                                            | Expected / failure result                                                             | Cleanup and escalation                                                               |
| ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| First install / upgrade                          | Registered test device; prior build for upgrade         | Privacy cover precedes content; migration succeeds or fails closed                    | Delete staging data only after evidence-safe defect ID; block release on flash/crash |
| Face ID success/cancel/lockout/unavailable       | Device with enrolled Face ID                            | Only success reveals content; all other states remain covered with retry              | Record OS/build/error code only                                                      |
| Passkey register/sign-in/cancel/revoked/restored | Staging RP/AASA and iCloud Keychain                     | Verified ceremony succeeds; cancellation changes nothing; revoked device fails closed | Revoke synthetic devices and credentials                                             |
| Background/foreground/app switcher/restart       | Authenticated synthetic account                         | Immediate shield; decrypted runtime locked; restart restores authority conservatively | Block release on visible private snapshot                                            |
| Notification/deep link                           | Permission variants and locked phone                    | Generic content only; unlock required before private route                            | Remove scheduled test notifications                                                  |
| Offline emergency stop / termination / reconnect | Real persisted staging session                          | Local controls stop before network; durable retry terminalizes once; never resumes    | Capture request ID only; blocker if duplicate/reactivation                           |
| Session/account/device revocation                | Two devices                                             | Revoked device loses access; counterpart sees no private reason                       | Revoke all synthetic sessions                                                        |
| Local clearing/account deletion                  | Not implementable yet                                   | **Blocked milestone**                                                                 | Do not invite external testers                                                       |
| Accessibility                                    | VoiceOver, Dynamic Type, reduced motion, contrast tools | Logical reading/focus, named controls, non-color meaning, practical targets           | Accessibility defects block affected flow                                            |
| Staging/production/signing                       | Archive inspection                                      | Correct bundle, domain, backend, privacy manifest, no demo/diagnostics                | Destroy mixed-resource build; rotate exposed values                                  |

## Manual archive command

When signing credentials and staging configuration exist:

```bash
cd app
EXPO_PUBLIC_APP_ENV=staging npx eas-cli build --platform ios --profile preview
```

This session did not upload or distribute a build. A local unsigned simulator/native-module build does not prove TestFlight signing or hosted service correctness.
