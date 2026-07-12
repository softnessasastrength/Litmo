# Machine setup (disaster recovery)

A from-scratch checklist for setting up a new Mac for Litmo development — written after a session that hand-configured a lot of this manually, so the next machine (or the next agent) doesn't have to rediscover it. Follow `docs/CONTINUITY_AND_STEWARDSHIP.md`'s principle: this repository, not a private conversation, is the source of truth for how to get running.

## What's automated vs. what isn't

Installing Xcode, Docker Desktop, and signing into Apple/Expo accounts genuinely require interactive GUI steps and your own credentials — nothing running on your behalf can do those safely or at all. Everything else is scripted.

## Steps

1. **Install Xcode** (or an Xcode beta) from the App Store.
   - If your internal disk is tight on space, install it to an external volume instead of `/Applications` — this repo's history includes doing exactly that. After install, point the command line tools at it:
     ```bash
     sudo xcode-select --switch /Volumes/<YourVolume>/Xcode.app/Contents/Developer
     sudo xcodebuild -license accept
     ```
   - If you land on an early beta (a Simulator-less Xcode, or unusual SDK behavior), see `docs/adr/0004-ios-27-beta-build-fixes.md` — the fixes described there are already automated by this repo's Expo config plugin, so you likely don't need to do anything extra.

2. **Install Docker Desktop** (docker.com or the App Store).
   - Same external-volume advice applies if space is tight.
   - After first launch (it asks for your Mac password once, to install a privileged helper — that prompt is legitimate), open **Settings → Resources → Advanced** and set **"Disk image location"** to your larger volume _before_ running any containers, so the VM's data disk doesn't fill your internal drive.
   - If Docker was installed somewhere other than `/Applications`, the `docker` CLI symlink can end up pointing at the wrong path (`/usr/local/bin/docker -> /Applications/Docker.app/...`, which won't exist). Fix it with:
     ```bash
     sudo ln -sf "/path/to/Docker.app/Contents/Resources/bin/docker" /usr/local/bin/docker
     ```

3. **Run the bootstrap script**:

   ```bash
   ./scripts/bootstrap-macos-dev-env.sh
   ```

   This checks Homebrew, Node (20.19+), installs CocoaPods via Homebrew if missing, adds a UTF-8 locale to `~/.zprofile` (CocoaPods crashes with a Ruby encoding error without one — a real bug hit and fixed in this repo's history), and checks Xcode/Docker CLI availability. Safe to re-run any time; every step checks current state first.

4. **Clone and install**:

   ```bash
   git clone <this repo>
   cd Litmo
   npm ci
   npm run env:check
   ```

5. **Start local Supabase** (needed for real auth/persistence — not required for demo mode, see below):

   ```bash
   npm run db:start
   npm run db:reset
   npx supabase status
   ```

   Copy the printed local URL and anon key into `app/.env` (copy from `app/.env.example` first). See `docs/LOCAL_DEVELOPMENT.md`.

6. **Or skip Supabase entirely** and use backend-free demo mode (`docs/adr/0003-demo-mode-entry-point.md`) — run `npm --workspace app run start`, scan the QR code with Expo Go, and tap "Continue without an account (demo mode)."

7. **For a standalone iOS build** (not just Expo Go), see `docs/LOCAL_DEVELOPMENT.md`'s standalone-build section for both the EAS path (needs an Expo account and, for physical-device installs, a paid Apple Developer Program membership) and the free local Xcode "Personal Team" path (needs Xcode signed into any Apple ID; 7-day expiring installs).

## Known gotchas from prior sessions

- **CocoaPods without a UTF-8 locale** fails with `Unicode Normalization not appropriate for ASCII-8BIT`. Step 3 above fixes this permanently; if it recurs, run `pod install` with `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` prefixed.
- **`npx eas login` fails with "could not determine executable to run"** — the package is `eas-cli`, not `eas`. Use `npx eas-cli login`.
- **Adding almost any new dependency to `app/package.json` can break npm workspace hoisting** for `expo-router` badly enough to crash the Metro dev server (`Cannot find module 'expo-router/_ctx-shared'`). Confirmed non-obvious: reproduced with `expo-build-properties` (removed; the iOS deployment-target floor it would have set is instead handled by `app/plugins/withIOSXcode27Fixes.cjs`) _and_ with a correctly SDK-pinned `expo-notifications` — it is not about which package or which version. `npm install` now runs `scripts/fix-expo-router-hoisting.mjs` automatically as a `postinstall` step, which symlinks `node_modules/expo-router -> app/node_modules/expo-router` whenever the root copy goes missing, so this should self-heal. If Metro still fails to boot with that error after adding a new dependency, check `node_modules/expo-router` exists before assuming something else is wrong.
- **A near-full internal disk causes subtle, hard-to-diagnose failures** — not just "out of space" errors, but corrupted downloads (a truncated tarball extraction failing with a misleading `tar: ...: m: No such file or directory`, which is actually just this system's normal missing-file message, not evidence of corruption by itself — check the file actually exists before assuming corruption) and Xcode script-phase sandbox violations when `DerivedData` lives on a different volume than expected. If builds fail in ways that don't make sense, check `df -h /` before debugging further.
