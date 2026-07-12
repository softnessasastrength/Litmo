# Litmo Xcode Source Kit

This archive is for developers and reviewers who want to inspect or run the native iOS project in Xcode.

## Fastest path

1. Unzip the archive on a Mac.
2. Double-click **Open Litmo.command** inside the `release` folder.
3. Let the launcher install the locked JavaScript and CocoaPods dependencies.
4. Xcode opens the generated `.xcworkspace` automatically.
5. Select your Apple development team, choose an iPhone or simulator, and press **Run**.

## Why a workspace instead of a project?

Litmo uses CocoaPods through Expo/React Native. Opening the `.xcodeproj` directly omits the Pods integration and will usually fail to build. The launcher therefore opens the checked-in `.xcworkspace`, which is the correct Xcode entry point.

## Requirements

- macOS
- Xcode opened at least once
- Node.js 20.19 or newer
- CocoaPods
- internet access during first setup

## Security and environment note

This source kit does not include secrets, signing certificates, provisioning profiles, Supabase credentials, or production configuration. It is intended for source inspection and local development. Real-device authentication, passkeys, associated domains, notifications, and hosted services require the appropriate developer-owned configuration.

The current build is experimental and must not be used to arrange real-world sessions.
