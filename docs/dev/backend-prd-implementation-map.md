# Backend PRD — Implementação (Mapa Geral)

**Projeto:** WhatPro Hub
**Data:** 2026-02-06
**Escopo:** Backend (Go), com referência ao PRD/Blueprint e `__temp/temp_docs`

---

## 1) Como ler este documento

Este mapa cruza cada requisito do PRD/Blueprint com a implementação atual do backend.
Para cada item há:

- **Status**: `OK`, `PARCIAL`, `FALTA`
- **Onde está**: arquivos/handlers/services
- **Gaps**: o que falta para fechar
- **Prioridade**: P0/P1/P2
- **Validação**: como testar e provar que está pronto

**P0** = bloqueia produção

---

## 2) Visão geral do estado

- **Core CRUD (Accounts/Users/Teams/Providers/Kanban)**: PARCIAL (tem endpoints, mas falta isolamento total por tenant)
- **IAM completo (sessions + refresh + logout)**: FALTA
- **API Key com scopes e hashing forte**: PARCIAL
- **Instance tokens**: FALTA
- **Entitlements e Metering**: PARCIAL
- **Observabilidade (logs/metrics/tracing)**: FALTA
- **Security headers/CSP**: FALTA
- **Webhook Security/Idempotência**: FALTA

---

## 3) Mapa PRD/Blueprint — Implementação

### 3.1 AuthN (SSO + JWT)

**Status:** PARCIAL

**Existe**

- SSO via Chatwoot: `apps/api/internal/handlers/auth.go` (`AuthSSO`)
- JWT middleware: `apps/api/internal/middleware/auth.go`

**Gaps (P0)**

- Refresh token rotacionado
- Cookie httpOnly (refresh)
- Logout revogando sessão
- `sid` (session id) nos claims

**Validação**

- Teste: login ? refresh ? refresh antigo falha
- Teste: logout invalida refresh

---

### 3.2 Sessions por dispositivo (IAM)

**Status:** PARCIAL

**Existe**

- Model `Session` em `models.go`
- `AuthService` cria session com refresh token

**Gaps (P0)**

- Session ID não entra no JWT
- Endpoint `GET /me/sessions` e `DELETE /me/sessions/:id`
- Revogação de sessões não integrada
- Refresh token ainda plaintext

**Validação**

- Criar 2 sessões, revogar 1 e validar que 1 token continua válido e outro não

---

### 3.3 API Key Auth (server-to-server)

**Status:** PARCIAL

**Existe**

- Middleware: `apps/api/internal/middleware/api_key.go`
- Model `APIKey` em `models.go`

**Gaps (P0)**

- Hashing forte (bcrypt/argon2)
- Scopes efetivamente aplicados nos handlers
- Rotação/revogação e auditoria
- Rate limit específico por key

**Validação**

- API key com scope limitado não pode acessar recursos não autorizados

---

### 3.4 Instance Tokens

**Status:** FALTA

**Necessário (P0)**

- Tabela instance_tokens
- Token por provider/instância
- Scopes mínimos por token
- Expiração e revogação

**Validação**

- Token usado fora do escopo retorna 403

---

### 3.5 Tenant Isolation (P0)

**Status:** PARCIAL

**Existe**

- `RequireAccountAccess` middleware
- Rotas account-scoped

**Gaps críticos (P0)**

- Queries sem `account_id` em Providers, Boards, Cards
- `Get/Update/Delete` usam ID global sem scope

**Validação**

- Testes cross-tenant devem falhar (403/404)

---

### 3.6 RBAC + Scopes + Policies

**Status:** PARCIAL

**Existe**

- `RequireRole` com roles básicas

**Gaps (P1)**

- Scopes (ex: `providers:read`)
- Policy rules (team/inbox)

**Validação**

- Agente não pode atualizar cards de outro time

---

### 3.7 Entitlements (Planos)

**Status:** PARCIAL

**Existe**

- `AccountEntitlements` model
- `EntitlementsService` valida criação (provider/team/agent)

**Gaps (P1)**

- Enforcement para inboxes/mensagens/boards
- Feature flags por tenant
- Upgrade/downgrade seguro

**Validação**

- Criar > limite retorna 403

---

### 3.8 Metering (Usage)

**Status:** FALTA

**Necessário (P1)**

- `usage_daily` preenchido
- Endpoints de uso
- DAU/WAU/MAU

**Validação**

- Dashboard de uso retorna métricas corretas

---

### 3.11 Kanban Metrics

**Status:** PARCIAL

**Existe**

- `CardHistory`

**Gaps (P1)**

- Endpoints métricas
- Cálculo de tempo por etapa

---

### 3.12 Security Headers / CSP

**Status:** FALTA

**Necessário (P0)**

- CSP + HSTS + nosniff + referrer-policy

---

### 3.13 Observabilidade

**Status:** FALTA

**Necessário (P1)**

- Logs JSON com request_id
- Métricas RED/USE
- Tracing OTEL

---

### 3.14 DevSecOps

**Status:** FALTA

**Necessário (P1)**

- CI com lint/test/SAST/secret scan
- Gates de segurança

---

## 4) Conclusão do mapa

O backend está **em fase MVP parcial**. Para atingir “100%” do Blueprint, os EPICs P0 precisam ser fechados primeiro, especialmente: **IAM completo, tenant isolation rígido, webhooks seguros e headers de segurança**.

---

## 5) Próximas ações recomendadas

1. Fechar EPIC-03 Tenant Isolation
2. Fechar EPIC-01 IAM
3. Fechar EPIC-02 API Keys/Instance Tokens
4. Fechar EPIC-04 Entitlements/Metering
5. Fechar EPIC-06 Hardening (headers)
