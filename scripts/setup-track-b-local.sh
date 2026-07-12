#!/usr/bin/env bash
# Track B local prep: start Supabase, write app/.env + backend/.env with LAN host.
# Requires Docker Desktop running. Usage: bash scripts/setup-track-b-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then re-run this script."
  exit 1
fi

echo "Starting local Supabase…"
npx supabase start

STATUS_JSON="$(npx supabase status -o json)"
API_URL="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.API_URL||j.apiUrl||'')" "$STATUS_JSON")"
ANON_KEY="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.ANON_KEY||j.anonKey||'')" "$STATUS_JSON")"
SERVICE_KEY="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.SERVICE_ROLE_KEY||j.serviceRoleKey||'')" "$STATUS_JSON")"

if [[ -z "$API_URL" || -z "$ANON_KEY" || -z "$SERVICE_KEY" ]]; then
  echo "Could not parse supabase status JSON. Run: npx supabase status -o json"
  exit 1
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
# Keep 127.0.0.1 for simulator; replace host for physical device docs.
API_HOST_LOCAL="$API_URL"
if [[ -n "$LAN_IP" ]]; then
  API_LAN="${API_URL/127.0.0.1/$LAN_IP}"
  API_LAN="${API_LAN/localhost/$LAN_IP}"
else
  API_LAN="$API_URL"
  LAN_IP="(unknown — set manually for physical phone)"
fi

cat > app/.env <<EOF
EXPO_PUBLIC_SUPABASE_URL=$API_HOST_LOCAL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:3001
EOF

# Companion LAN file for physical phone (do not commit).
cat > app/.env.lan.example <<EOF
# Copy to app/.env when testing on a physical iPhone on the same Wi‑Fi.
EXPO_PUBLIC_SUPABASE_URL=$API_LAN
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_BACKEND_URL=http://$LAN_IP:3001
EOF

cat > backend/.env <<EOF
SUPABASE_URL=$API_HOST_LOCAL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
PORT=3001
EOF

echo "Resetting database (migrations + seed accounts)…"
npx supabase db reset

echo ""
echo "Track B local prep complete."
echo "  app/.env          → simulator (127.0.0.1)"
echo "  app/.env.lan.example → physical phone template (LAN $LAN_IP)"
echo "  backend/.env      → service role for snapshot API"
echo ""
echo "Seed accounts (password LitmoDemo123!):"
echo "  maya.demo@litmo.local"
echo "  eli.demo@litmo.local"
echo "  eli-persona.demo@litmo.local"
echo "  jonah-persona.demo@litmo.local"
echo ""
echo "Next:"
echo "  npm run api          # terminal 1 — snapshot service"
echo "  npm run mobile       # terminal 2 — Metro"
echo "  Sign in → seed account form (development only)"
echo "  env HOME=/tmp npx supabase test db   # optional pgTAP"
echo "  npm run test:integration             # Chapter 4 two-client lifecycle"
