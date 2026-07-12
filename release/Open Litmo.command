#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

printf '\nLitmo Xcode Source Kit\n=======================\n\n'

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode is required. Install it from the Mac App Store, open it once, then run this launcher again."
  read -r -p "Press Return to close..."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20.19 or newer is required: https://nodejs.org/"
  read -r -p "Press Return to close..."
  exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods is required. Install it with: sudo gem install cocoapods"
  read -r -p "Press Return to close..."
  exit 1
fi

echo "Installing locked JavaScript dependencies..."
npm ci

echo "Installing locked iOS dependencies..."
(
  cd app/ios
  pod install --repo-update
)

WORKSPACE="$(find app/ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
if [[ -z "$WORKSPACE" ]]; then
  echo "No Xcode workspace was found in app/ios."
  read -r -p "Press Return to close..."
  exit 1
fi

echo "Opening $WORKSPACE"
open "$WORKSPACE"

echo "Done. In Xcode, select your signing team and an iPhone or simulator, then press Run."
