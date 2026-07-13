#!/bin/sh
# Xcode Cloud — runs after git clone, before xcodebuild.
# Expo/React Native needs JS deps + CocoaPods before the workspace builds.
set -euo pipefail

echo "=== Litmo Xcode Cloud ci_post_clone ==="
cd "$CI_PRIMARY_REPOSITORY_PATH"

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Node (Xcode Cloud images vary; brew is reliable)
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node via Homebrew..."
  brew install node@22 || brew install node
  # shellcheck disable=SC1091
  if [ -f /opt/homebrew/opt/node@22/bin/node ]; then
    export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
  fi
fi

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"

# CocoaPods
if ! command -v pod >/dev/null 2>&1; then
  echo "Installing CocoaPods..."
  brew install cocoapods || gem install cocoapods
fi
echo "pod: $(pod --version)"

# JS workspace install from monorepo root
npm ci

# Demo-friendly defaults for Cloud builds that do not inject secrets.
# Override in Xcode Cloud Environment Variables for staging/production.
export EXPO_PUBLIC_APP_ENV="${EXPO_PUBLIC_APP_ENV:-development}"
export LITMO_FREE_TIER_BUILD="${LITMO_FREE_TIER_BUILD:-1}"
export CI=1

# Pods for the checked-in native project
cd app/ios
pod install --repo-update

echo "=== ci_post_clone complete ==="
echo "Workspace: app/ios/Litmodevelopment.xcworkspace"
echo "Scheme:    Litmodevelopment"
