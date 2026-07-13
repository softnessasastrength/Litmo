# Xcode Cloud for Litmo

Yes — **Xcode Cloud can build Litmo** from the checked-in iOS workspace, as long
as the NFC compile fix is on the branch (`LitmoNfc` manual NDEF text parse) and
the Cloud **post-clone** scripts install Node + CocoaPods.

## What works

| Goal | Xcode Cloud |
| --- | --- |
| Compile `Litmodevelopment.xcworkspace` | Yes |
| Archive + TestFlight (with App Store Connect) | Yes, once signing + workflow configured |
| Expo Go | N/A — this is a native workspace build |
| Inject staging secrets | Environment Variables in App Store Connect |

## Repository hooks

```text
app/ios/ci_scripts/
  ci_post_clone.sh      # npm ci + pod install (required for Expo RN)
  ci_pre_xcodebuild.sh  # verify pods, env defaults
```

Scheme / workspace (use these in the Cloud workflow):

| Setting | Value |
| --- | --- |
| Workspace | `app/ios/Litmodevelopment.xcworkspace` |
| Scheme | `Litmodevelopment` |
| Bundle ID (dev project) | `com.litmo.app.dev` |

> Prefer the **`.xcworkspace`**, never the bare `.xcodeproj` (CocoaPods).

## One-time setup in Xcode / App Store Connect

1. Open `app/ios/Litmodevelopment.xcworkspace` in Xcode.  
2. **Product → Xcode Cloud → Create Workflow…** (or App Store Connect → Xcode Cloud).  
3. Connect the **GitHub** repo `softnessasastrength/Litmo`.  
4. Start condition: branch `main` (or `agent/quizzes-section` while iterating).  
5. Actions: **Archive - iOS** (TestFlight) and/or **Build - iOS**.  
6. Environment variables (optional for real backends):

   | Name | Example |
   | --- | --- |
   | `EXPO_PUBLIC_APP_ENV` | `development` or `staging` |
   | `EXPO_PUBLIC_SUPABASE_URL` | hosted project URL |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | public anon only |
   | `LITMO_FREE_TIER_BUILD` | `1` for Personal Team / no Associated Domains |

7. Grant **ci_scripts** permission when Cloud prompts (scripts must be executable).

```bash
chmod +x app/ios/ci_scripts/*.sh
```

## Screenshots for App Store Connect

Xcode Cloud builds do **not** auto-produce marketing screenshots. Capture those from:

- Simulator after a successful local/`Xcode` run, or  
- Maestro: `docs/screenshots/maestro-app-store.yaml`

Required sizes (phone-only app; no iPad): typically **6.7"** `1290×2796` (and optionally 6.5").

## Relation to EAS / GitHub Actions

| Pipeline | Role |
| --- | --- |
| **Xcode Cloud** | Apple-signed archives → TestFlight / App Store |
| **EAS** | Expo cloud builds (needs EAS device credentials for ad-hoc) |
| **GitHub `ios-native-build`** | Unsigned simulator compile check on PR |

For App Store Connect distribution, **Xcode Cloud is the natural path**.

## Honest limits

- Passkeys need correct **Associated Domains / AASA** for the bundle ID you ship.  
- Demo mode is available when `EXPO_PUBLIC_APP_ENV=development`.  
- Staging/production builds must **not** point at `127.0.0.1`.  
- Product is still **private-beta foundation** — screenshots and TestFlight do not equal public launch readiness (`docs/RELEASE_AND_TESTFLIGHT.md`).

## Verify scripts locally

```bash
export CI_PRIMARY_REPOSITORY_PATH="$(pwd)"
sh app/ios/ci_scripts/ci_post_clone.sh
sh app/ios/ci_scripts/ci_pre_xcodebuild.sh
```
