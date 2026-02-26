# Quickstart: WhatPro Hub — System Audit Implementation

**Branch**: `001-system-audit`
**Date**: 2026-02-19

Este guia cobre como rodar, testar e validar cada item do roadmap de completude.

---

## Prerequisites

```bash
# Dependências de sistema
- Go 1.22+
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
```

---

## 1. Setup Local (Desenvolvimento)

### Backend

```bash
# Subir infra (PostgreSQL + Redis)
cd deploy/docker
docker compose -f docker-compose.dev.yml up -d

# Variáveis de ambiente (copiar e ajustar)
cp apps/api/.env.example apps/api/.env

# Variáveis mínimas necessárias:
# DATABASE_URL=postgres://whatpro:whatpro@localhost:5432/whatpro_hub?sslmode=disable
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=dev-secret-change-in-production
# JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
# CORS_ORIGINS=http://localhost:5173
# ENV=development
# ASAAS_API_KEY=... (apenas se módulo de billing ativo — use sandbox key)
# ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3

# Rodar migrations e seeds
cd apps/api
go run ./cmd/server/main.go
# As migrations rodam automaticamente em ENV=development
```

### Frontend

```bash
cd apps/frontend

# Variáveis de ambiente
cp .env.example .env.local
# VITE_API_URL=http://localhost:8080/api/v1

npm install
npm run dev
# Abre em http://localhost:5173
```

---

## 2. Verificação dos Gaps Críticos (P1)

### P1-A: Stats endpoint (backend)

```bash
# Após criar o endpoint, testar com curl:
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/accounts/1/stats

# Esperado:
{
  "success": true,
  "status": 200,
  "data": {
    "active_instances": 2,
    "messages_today": 0,
    "active_clients": 0,
    "workflows_triggered": 0,
    "generated_at": "2026-02-19T..."
  }
}
```

### P1-B: account_id dinâmico (frontend)

```bash
# Verificar que requests ao backend incluem o token:
# Chrome DevTools → Network → qualquer request para /api/v1/accounts/*/
# Header: Authorization: Bearer <token>
# O accountId na URL deve corresponder ao account_id do JWT
```

### P1-C: Token refresh automático

```bash
# Simular token expirado:
# 1. Fazer login (access token com TTL curto em dev: 15min)
# 2. Esperar expirar OU alterar o JWT_TTL para "10s" temporariamente
# 3. Fazer qualquer requisição
# Esperado: request é feita com sucesso APÓS refresh transparente
# Não esperado: redirect para login ou erro 401 visível
```

---

## 3. Verificação de UX (Visual Polish)

### Dashboard — Error State

```bash
# Simular erro no backend:
# 1. Parar o backend: Ctrl+C
# 2. Recarregar o dashboard no browser
# Esperado: cartões exibem mensagem de erro amigável (não crash)
# Não esperado: tela em branco ou "undefined"
```

### Settings — Dados reais

```bash
# 1. Fazer login com um usuário real
# 2. Navegar para /settings
# Esperado: nome e email reais do usuário logado (não "John Doe")
# 3. Alterar o nome e clicar em Save
# Esperado: toast verde "Perfil atualizado com sucesso"
```

### KanbanBoard — Dados reais

```bash
# 1. Criar um board via API ou seed:
curl -X POST http://localhost:8080/api/v1/accounts/1/boards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pipeline Principal", "description": "Board de atendimento"}'

# 2. Navegar para /workflows no browser
# Esperado: colunas e cards do banco (não hardcoded)
```

---

## 4. Testes Automatizados

### Backend (Go)

```bash
cd apps/api

# Rodar todos os testes
go test ./... -v

# Rodar com cobertura
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
open coverage.html

# Meta: >= 70% em handlers/ e services/
```

### Frontend (Vitest + RTL)

```bash
cd apps/frontend

# Rodar testes
npm run test

# Rodar com cobertura (após configurar vitest.config.ts)
npm run test:coverage

# Meta: >= 70% em features/*/hooks/ e features/*/components/
```

---

## 5. Webhooks — Teste Manual

```bash
# Simular conversation_created do Chatwoot:
curl -X POST http://localhost:8080/api/v1/webhooks/chatwoot \
  -H "Content-Type: application/json" \
  -d '{
    "event": "conversation_created",
    "account": {"id": 1},
    "conversation": {"id": 42, "inbox_id": 1, "status": "open"},
    "contact": {"id": 10, "name": "João Silva"}
  }'

# Verificar no banco que um card foi criado:
psql $DATABASE_URL -c "SELECT * FROM cards ORDER BY created_at DESC LIMIT 1;"
```

---

## 6. Billing — Teste com Sandbox Asaas

```bash
# Criar assinatura (sandbox):
curl -X POST http://localhost:8080/api/v1/billing/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 1,
    "plan_id": "basic",
    "name": "Empresa Teste",
    "email": "teste@empresa.com",
    "cpf_cnpj": "00.000.000/0000-00",
    "billing_cycle": "MONTHLY"
  }'

# Verificar no painel sandbox.asaas.com que o cliente e assinatura foram criados
```

---

## 7. i18n — Verificação

```bash
# No browser, abrir DevTools → Application → Local Storage
# Verificar que 'i18nextLng' existe

# Mudar idioma via UI (se toggle disponível) ou manualmente:
localStorage.setItem('i18nextLng', 'en-US')
# Recarregar a página → todos os textos devem estar em inglês

localStorage.setItem('i18nextLng', 'pt-BR')
# Recarregar → todos os textos em português
```

---

## 8. Ordem de Implementação Recomendada

```
Semana 1 — P1 (bloqueadores críticos):
  [ ] Backend: GET /api/v1/accounts/:id/stats
  [ ] Backend: Fix GatewayService nil dependency
  [ ] Frontend: Descomentar interceptor de auth (api.ts)
  [ ] Frontend: Implementar refresh interceptor
  [ ] Frontend: Ler account_id do auth context (instancesService.ts)
  [ ] Frontend: Dashboard error state + substituir mocks por stats endpoint

Semana 2 — P2 (funcionalidades de produto):
  [ ] Backend: Chatwoot webhook processing
  [ ] Backend: Asaas billing integration
  [ ] Frontend: Settings page — dados reais + save funcional
  [ ] Frontend: KanbanBoard — conectar a boards/stages/cards API

Semana 3 — P3 (qualidade e completude):
  [ ] Backend: Test coverage 70% (handlers + services)
  [ ] Frontend: Vitest setup + RTL testes críticos
  [ ] Frontend: Workflows persistence (save/load do editor visual)
  [ ] Frontend: i18n completa para todas as páginas
  [ ] Infra: docker-compose modular (base + chatwoot)
```
