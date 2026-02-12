#!/usr/bin/env bash
set -euo pipefail

PORTAINER_URL="${PORTAINER_URL:-http://localhost:9000}"
PORTAINER_API_KEY="${PORTAINER_API_KEY:-}"
ENDPOINT_ID="${PORTAINER_ENDPOINT_ID:-3}"

if [ -z "$PORTAINER_API_KEY" ]; then
  echo "PORTAINER_API_KEY is required"
  exit 1
fi

ROOT="/home/whatpro/projects/whatpro-hub"
ENV_FILE="$ROOT/deploy/docker/.env.dev"
STACKS_JSON="$ROOT/deploy/docker/stacks.json"

stacks=$(python3 - <<PY
import json
with open("$STACKS_JSON") as f:
    data=json.load(f)
for s in data.get("dev", []):
    if s.get("name") == "portainer":
        continue
    print(f"{s['name']}|{s['file']}")
PY
)

existing_json=$(curl -s -H "X-API-Key: $PORTAINER_API_KEY" "$PORTAINER_URL/api/stacks" || true)
if [ -z "$existing_json" ]; then
  existing=""
else
  existing=$(python3 - <<'PY'
import json,sys
raw = sys.stdin.read().strip()
if not raw:
    sys.exit(0)
try:
    data=json.loads(raw)
except Exception:
    sys.exit(0)
for s in data:
    print(f"{s.get('Name')}|{s.get('Id')}|{s.get('EndpointId')}|{s.get('Type')}")
PY
<<<"$existing_json")
fi

for entry in $stacks; do
  name="${entry%%|*}"
  file="${entry##*|}"
  file_path="$ROOT/deploy/docker/$file"

  while IFS='|' read -r sname sid sendpoint stype; do
    if [ "$sname" = "$name" ] && [ "$sendpoint" = "$ENDPOINT_ID" ]; then
      curl -fsS -X DELETE -H "X-API-Key: $PORTAINER_API_KEY" \
        "$PORTAINER_URL/api/stacks/$sid?endpointId=$ENDPOINT_ID" >/dev/null || true
    fi
  done <<< "$existing"

  python3 - <<PY > /tmp/portainer_payload.json
import json

def parse_env(path):
    items = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            items.append({"name": k, "value": v})
    return items

with open("$file_path", "r") as f:
    content = f.read()

payload = {
    "Name": "$name",
    "StackFileContent": content,
    "Env": parse_env("$ENV_FILE"),
    "FromAppTemplate": False,
}
print(json.dumps(payload))
PY

  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $PORTAINER_API_KEY" \
    "$PORTAINER_URL/api/stacks/create/standalone/string?endpointId=$ENDPOINT_ID" \
    --data-binary @/tmp/portainer_payload.json)

  if [ "$code" != "200" ] && [ "$code" != "201" ]; then
    echo "Failed to create stack $name (HTTP $code)"
    exit 1
  fi
  echo "Created stack $name"
done
