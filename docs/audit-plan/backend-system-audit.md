# Backend System Audit — Whatpro Hub

**Data:** 2026-02-08  
**Escopo:** Backend Go (API + Services + Repositories)  
**Fontes consolidadas:**
- docs/dev/backend-feature-map.md
- docs/dev/backend-endpoint-audit.md
- docs/dev/backend-execution-blueprint.md
- docs/dev/backend-prd-implementation-map.md
- pps/api/cmd/server/main.go
- pps/api/internal/handlers/*
- pps/api/internal/models/*
- pps/api/internal/services/*

---

## 📊 Executive Summary
O backend está **~65% completo** em relação ao PRD/Blueprint. A base funcional é sólida, porém **lacunas críticas de segurança, tenant isolation e auth** bloqueiam produção.

**Status Geral**
- ✅ Core CRUD: Accounts, Users, Teams, Providers, Kanban
- ✅ IAM básico: JWT + RBAC
- ⚠️ Tenant isolation: middleware existe, mas **queries não filtram ccount_id universalmente**
- ❌ Security headers: ausentes (CSP, HSTS, X-Frame-Options, etc.)
- ❌ Observabilidade: logs sem JSON/request_id, sem métricas/tracing
- ⚠️ Entitlements: parcial (enforcement incompleto)
- ❌ Instance Tokens: ausentes
- ❌ Inbox Model/Sync: ausente
- ✅ Internal Chat: MVP backend implementado (UI/realtime pendentes)

---

## 🔍 Revalidação Rápida (não mutável)

### Rotas confirmadas (server/main.go)
- Health: /health/live, /health/ready, /health/deep
- Auth: /auth/sso, /auth/refresh, /auth/logout, /auth/me
- Billing: /billing/subscribe, /webhooks/asaas
- Accounts / Users / Teams / Providers / Kanban
- Chatwoot Proxy: /chatwoot/*

### Handlers confirmados
- handlers/auth.go → refresh/logout **stubs**
- handlers/billing_handler.go → subscribe **mockado**
- handlers/provider_handler.go
- handlers/kanban.go
- handlers/webhooks.go → **TODOs** para integração real

### Modelos confirmados
- AccountEntitlements, Provider, Session, APIKey
- **Ausentes:** Inbox, InstanceToken, ProviderInstance, InternalChat

---

## 📌 Consolidação dos docs/dev (status ajustado)

### backend-feature-map.md
- Converge para **~65% completo**
- Pontos fortes: CRUD base, Kanban, estrutura limpa
- Pontos fracos: tenant isolation, auth avançado, observabilidade

### backend-endpoint-audit.md
- Divergência crítica: **tenant isolation não está 100%**
- Faltam: instance tokens, inboxes, headers de segurança

### backend-execution-blueprint.md
- EPIC-01 IAM + Sessions: **parcial** (refresh/logout incompletos)
- EPIC-02 Instance Tokens: **0%**
- EPIC-06 Security Headers: **0%**
- EPIC-07 Embed Security: **0%**

### backend-prd-implementation-map.md
- Divergências: tenant isolation **parcial**, internal chat **ausente**, instance tokens **ausente**

---

## 🚨 Gaps P0 (produção bloqueada)
1. **Tenant isolation incompleto** em queries de repositories
2. **Refresh token rotation** inexistente
3. **Logout sem revogação de sessão**
4. **Security headers ausentes** (CSP/HSTS/XFO/NoSniff)
5. **Instance tokens ausentes** (embed seguro)
6. **Inbox model/sync ausente**
7. **Webhook security fraca** (secret único, sem idempotência)

---

## ⚠️ Gaps P1 (pré‑produção)
- Entitlements enforcement para todos recursos (users/teams/inboxes/boards)
- Metering diário (usage_daily) não ativo
- Logs JSON + request_id
- Métricas RED/USE
- Tracing OpenTelemetry

---

## ✅ Pontos Fortes
- Arquitetura limpa (handlers → services → repositories)
- Validação de input centralizada
- Helpers de auditoria disponíveis
- Swagger documentado

---

## 📋 Checklist Consolidado (P0/P1/P2)

### P0
- Fix tenant isolation em todas queries (motivo: evita IDOR/cross‑tenant)
- Implementar refresh rotation + logout revocation (motivo: segurança de sessão)
- Adicionar security headers (motivo: XSS/Clickjacking)
- Criar instance token (motivo: embed seguro)
- Criar inbox model + sync (motivo: gestão de recursos Chatwoot)
- Webhook signature segregada + idempotência (motivo: replay/forgery)

### P1
- Entitlements enforcement completo (motivo: controle de plano)
- Observabilidade básica (logs JSON + request_id)
- Métricas Prometheus (motivo: operação)

### P2
- Kanban SLA metrics
- Internal chat (UI + realtime pendentes)

---

## 📎 Evidências principais
- Refresh token não implementado → `apps/api/internal/handlers/auth.go:108-116`
- Logout sem revogação → `apps/api/internal/handlers/auth.go:118-131`
- Entitlements inbox TODO → `apps/api/internal/services/entitlements_service.go:52-55`
- Tenant isolation parcial (métodos não escopados por account):
  - Provider sem account_id: `apps/api/internal/repositories/provider_repository.go:54-114`
  - Provider update sem account_id: `apps/api/internal/repositories/provider_repository.go:144-172`
  - Kanban board/stage/card sem account_id: `apps/api/internal/repositories/kanban_repository.go:40-188`
  - Kanban checklist sem account_id: `apps/api/internal/repositories/kanban_repository.go:292-299`
- Security headers ausentes: nenhum match para CSP/HSTS/XFO/NoSniff em `apps/api` (grep vazio)
- Instance tokens ausentes: nenhum match para `InstanceToken` em `apps/api/internal` (grep vazio)
- Chat interno MVP (backend):
  - Models: `apps/api/internal/models/chat_models.go`
  - Migrations: `apps/api/internal/migrations/chat.go`
  - Service: `apps/api/internal/services/chat_service.go`
  - Handler: `apps/api/internal/handlers/chat_handler.go`

---

## ✅ Conclusão
O backend está funcional para dev, mas **não pronto para produção** sem fechar os gaps P0.
