#!/usr/bin/env bash
set -euo pipefail

PORTAINER_URL="${PORTAINER_URL:-http://localhost:9000}"
ADMIN_USER="${ADMIN_USER:-}"
ADMIN_PASS="${ADMIN_PASS:-}"
TOKEN_DESC="${TOKEN_DESC:-whatpro-setup}"

if [ -z "$ADMIN_USER" ] || [ -z "$ADMIN_PASS" ]; then
  echo "ADMIN_USER and ADMIN_PASS are required"
  exit 1
fi

PT_JWT=$(curl -fsS -X POST "$PORTAINER_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d "{\"Username\":\"${ADMIN_USER}\",\"Password\":\"${ADMIN_PASS}\"}" | \
  python3 -c "import json,sys; print(json.load(sys.stdin).get('jwt',''))")

if [ -z "$PT_JWT" ]; then
  echo "AUTH_FAIL"
  exit 1
fi

PT_UID=$(curl -fsS -H "Authorization: Bearer ${PT_JWT}" \
  "$PORTAINER_URL/api/users/me" | \
  python3 -c "import json,sys; print(json.load(sys.stdin).get('Id',''))")

if [ -z "$PT_UID" ]; then
  echo "USER_FAIL"
  exit 1
fi

PT_TOKEN=$(curl -fsS -X POST \
  -H "Authorization: Bearer ${PT_JWT}" \
  -H "Content-Type: application/json" \
  "$PORTAINER_URL/api/users/${PT_UID}/tokens" \
  -d "{\"Description\":\"${TOKEN_DESC}\",\"Password\":\"${ADMIN_PASS}\"}" | \
  python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('token') or data.get('apiKey') or data.get('rawAPIKey') or '')")

if [ -z "$PT_TOKEN" ]; then
  echo "TOKEN_FAIL"
  exit 1
fi

ENDPOINT_ID=$(curl -fsS -H "X-API-Key: ${PT_TOKEN}" \
  "$PORTAINER_URL/api/endpoints" | \
  python3 -c "import json,sys; data=json.load(sys.stdin); print(data[0].get('Id') if data else '')")

if [ -z "$ENDPOINT_ID" ]; then
  echo "ENDPOINT_FAIL"
  exit 1
fi

ROOT="/home/whatpro/projects/whatpro-hub"
cd "$ROOT/deploy/docker"
docker compose -f compose.edge.dev.yml down
docker compose -f compose.app.dev.yml down
docker compose -f compose.chatwoot.dev.yml down

PORTAINER_API_KEY="$PT_TOKEN" PORTAINER_ENDPOINT_ID="$ENDPOINT_ID" \
  "$ROOT/scripts/portainer-deploy-dev.sh"
