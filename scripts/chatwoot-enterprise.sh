#!/usr/bin/env bash
set -euo pipefail

CID="$(docker ps -q --filter "name=pgvector")"
if [ -z "$CID" ]; then
  echo "pgvector container not found"
  exit 1
fi

cat > /tmp/chatwoot_enterprise.sql <<'SQL'
UPDATE public.installation_configs
SET serialized_value = '"--- !ruby/hash:ActiveSupport::HashWithIndifferentAccess\nvalue: enterprise\n"'
WHERE name = 'INSTALLATION_PRICING_PLAN';

UPDATE public.installation_configs
SET serialized_value = '"--- !ruby/hash:ActiveSupport::HashWithIndifferentAccess\nvalue: 10000\n"'
WHERE name = 'INSTALLATION_PRICING_PLAN_QUANTITY';

UPDATE public.installation_configs
SET serialized_value = '"--- !ruby/hash:ActiveSupport::HashWithIndifferentAccess\nvalue: e04t63ee-5gg8-4b94-8914-ed8137a7d938\n"'
WHERE name = 'INSTALLATION_IDENTIFIER';
SQL

docker exec -i "$CID" psql -U postgres -d chatwoot < /tmp/chatwoot_enterprise.sql
echo "Chatwoot enterprise config updated."
