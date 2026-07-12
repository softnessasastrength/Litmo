#!/usr/bin/env bash
# Bootstraps a fresh macOS machine for Litmo development.
#
# Covers everything that CAN be scripted. Several steps genuinely cannot be
# (App Store downloads, Apple ID / Expo account logins) -- those are printed
# as manual steps at the end. See docs/MACHINE_SETUP.md for the full,
# narrated checklist this script implements alongside.
#
# Safe to re-run: every step checks current state before changing anything.
set -euo pipefail

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$1"; }
ok() { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }

log "Checking Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew not found. Install it yourself from https://brew.sh, then re-run this script."
  exit 1
fi
ok "Homebrew found at $(command -v brew)"

log "Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js not found. Install Node 20.19+ (e.g. \`brew install node\` or nvm), then re-run this script."
  exit 1
fi
node_version="$(node --version | sed 's/^v//')"
node_major="$(echo "$node_version" | cut -d. -f1)"
node_minor="$(echo "$node_version" | cut -d. -f2)"
if [ "$node_major" -lt 20 ] || { [ "$node_major" -eq 20 ] && [ "$node_minor" -lt 19 ]; }; then
  warn "Node $node_version found, but Litmo needs 20.19+. Update Node, then re-run this script."
  exit 1
fi
ok "Node $node_version"

log "Checking CocoaPods"
if ! command -v pod >/dev/null 2>&1; then
  log "Installing CocoaPods via Homebrew (avoids the system Ruby permission issues gem install hits on Apple Silicon)"
  brew install cocoapods
else
  ok "CocoaPods found: $(pod --version)"
fi

log "Checking locale (CocoaPods requires UTF-8; an unset locale crashes pod install with a Ruby encoding error)"
profile_file="$HOME/.zprofile"
if ! grep -q "LANG=en_US.UTF-8" "$profile_file" 2>/dev/null; then
  {
    echo ''
    echo '# Litmo dev environment: CocoaPods requires a UTF-8 locale, which macOS'
    echo '# does not set by default in non-interactive/scripted shells.'
    echo 'export LANG=en_US.UTF-8'
    echo 'export LC_ALL=en_US.UTF-8'
  } >>"$profile_file"
  ok "Added LANG/LC_ALL to $profile_file (open a new terminal for it to take effect)"
else
  ok "UTF-8 locale already configured in $profile_file"
fi

log "Checking Xcode command line tools"
if ! xcode-select -p >/dev/null 2>&1; then
  log "Installing Xcode command line tools (a system dialog will appear)"
  xcode-select --install || true
else
  ok "Active developer directory: $(xcode-select -p)"
fi

log "Checking Docker CLI"
if command -v docker >/dev/null 2>&1; then
  ok "docker CLI found: $(docker --version)"
else
  warn "docker CLI not found. If Docker Desktop is installed somewhere other than /Applications (e.g. an external SSD), the CLI symlink needs pointing at it manually:"
  echo '    sudo ln -sf "/path/to/Docker.app/Contents/Resources/bin/docker" /usr/local/bin/docker'
fi

echo ''
echo '================================================================'
echo ' Manual steps this script cannot do for you'
echo '================================================================'
cat <<'EOF'

1. Install Xcode (or an Xcode beta) from the App Store. If your internal
   disk is tight on space, install it to an external volume instead of
   /Applications, then run:
     sudo xcode-select --switch /Volumes/<YourVolume>/Xcode.app/Contents/Developer
     sudo xcodebuild -license accept

2. Install Docker Desktop (https://docker.com or the App Store). Same
   space advice applies. After first launch (it will ask for your Mac
   password to install a privileged helper -- that prompt is legitimate),
   set Settings -> Resources -> Advanced -> "Disk image location" to
   somewhere on your larger volume BEFORE starting any containers.

3. If you want a standalone iOS build (not just Expo Go), you'll need:
   - A free or paid Apple ID signed into Xcode's Settings -> Accounts
     (free = 7-day "Personal Team" sideload; paid Apple Developer Program
     = EAS Build or long-lived installs).
   - For EAS Build specifically: `npx eas-cli login` (create a free
     account at expo.dev first if you don't have one).

4. Clone this repository if you don't already have it, then run:
     npm ci
     npm run env:check
   Everything else (dependencies, the iOS config-plugin fixes) is
   handled automatically the first time you build.

5. For local Supabase (needed for real auth/persistence, not demo mode):
     npm run db:start
     npm run db:reset
     npx supabase status
   Copy the printed local URL and anon key into app/.env (copy from
   app/.env.example first). See docs/LOCAL_DEVELOPMENT.md.

EOF
ok "Bootstrap checks complete."
