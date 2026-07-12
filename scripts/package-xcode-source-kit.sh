#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-dev}"
NAME="Litmo-Xcode-Source-${VERSION}"
STAGE="$ROOT/dist/$NAME"
ARCHIVE="$ROOT/dist/$NAME.tar.gz"

rm -rf "$STAGE" "$ARCHIVE"
mkdir -p "$STAGE"

copy_path() {
  local path="$1"
  if [[ -e "$ROOT/$path" ]]; then
    mkdir -p "$STAGE/$(dirname "$path")"
    cp -R "$ROOT/$path" "$STAGE/$path"
  fi
}

for path in \
  package.json \
  package-lock.json \
  .npmrc \
  app \
  shared \
  scripts/fix-expo-router-hoisting.mjs \
  release; do
  copy_path "$path"
done

find "$STAGE" -name node_modules -type d -prune -exec rm -rf {} +
find "$STAGE" -name dist -type d -prune -exec rm -rf {} +
find "$STAGE" -name .env -type f -delete
find "$STAGE" -name '.env.*' -type f ! -name '.env.example' -delete
find "$STAGE" -name Pods -type d -prune -exec rm -rf {} +
find "$STAGE" -name build -type d -prune -exec rm -rf {} +
find "$STAGE" -name DerivedData -type d -prune -exec rm -rf {} +

chmod +x "$STAGE/release/Open Litmo.command"
cp "$STAGE/release/README-XCODE.md" "$STAGE/README.md"

(
  cd "$ROOT/dist"
  /usr/bin/tar -czf "$NAME.tar.gz" "$NAME"
)

/usr/bin/tar -tzf "$ARCHIVE" >/dev/null
printf '%s\n' "$ARCHIVE"
