#!/bin/sh
# Xcode Cloud — immediately before xcodebuild.
set -euo pipefail

echo "=== Litmo Xcode Cloud ci_pre_xcodebuild ==="
cd "$CI_PRIMARY_REPOSITORY_PATH"

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export EXPO_PUBLIC_APP_ENV="${EXPO_PUBLIC_APP_ENV:-development}"
export LITMO_FREE_TIER_BUILD="${LITMO_FREE_TIER_BUILD:-1}"
export CI=1

# Ensure pods still match lockfile after any Cloud prep
cd app/ios
if [ -f Podfile.lock ]; then
  pod install --deployment || pod install
fi

echo "Xcode: $(xcodebuild -version | tr '\n' ' ')"
echo "=== ci_pre_xcodebuild complete ==="
