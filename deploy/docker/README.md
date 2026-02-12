# Docker Stack (Local/VPS-like)

Este diretório organiza a stack por camadas para facilitar manutencao e seguranca.

Arquivos:
- `compose.app.yml` App: Postgres, Redis, API, Worker
- `compose.chatwoot.yml` Chatwoot (app + sidekiq)
- `compose.edge.yml` Infra: Traefik (edge)
- `compose.portainer.yml` Portainer (opcional)
- `compose.local.yml` Overrides para dev

## Como subir (local)

1) Copie env
```bash
cp .env.example .env
```

2) Subir stacks (separadas)
```bash
docker compose -f compose.app.dev.yml -f compose.local.yml up -d
docker compose -f compose.chatwoot.dev.yml -f compose.local.yml up -d
docker compose -f compose.edge.dev.yml up -d
```

3) Subir Portainer (opcional)
```bash
docker compose -f compose.portainer.dev.yml up -d
```

## Validacao

```bash
docker compose -f compose.app.yml -f compose.local.yml config
docker compose -f compose.chatwoot.yml -f compose.local.yml config
docker compose -f compose.edge.yml config
```

## Endpoints padrao

Chatwoot: `http://localhost:8080`
API: `http://localhost:4000`
Traefik: `http://localhost:8081`
Portainer: `http://localhost:9000`

## Instalador (whatpro-setup)

Executar:
```bash
./scripts/whatpro-setup
```

O instalador cria `deploy/docker/.env.dev` e `deploy/docker/.env.prod`,
pergunta os dominios e valida portas e requisitos.
