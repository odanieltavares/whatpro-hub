# Backend Execution Blueprint (100% Fechamento)

**Projeto:** WhatPro Hub
**Data:** 2026-02-06
**Objetivo:** fechar backend com segurança, performance e qualidade profissional.

---

## 1) Definição de pronto (DoD)

O backend só é considerado **100%** quando:

- Todos os EPICs P0 e P1 concluídos
- Tenant isolation testado (anti-IDOR)
- IAM completo com refresh rotacionado
- API Keys e Instance Tokens com scopes
- Entitlements e metering ativos
- Webhooks com assinatura + idempotência
- Logs e métricas estruturadas
- Security headers aplicados

---

## 2) Ordem de execução (realista)

1. **EPIC-03 Tenant Isolation** (P0)
2. **EPIC-01 IAM + Sessions** (P0)
3. **EPIC-02 API Keys + Instance Tokens** (P0)
4. **EPIC-06 Hardening (headers + CSP)** (P0)
5. **EPIC-04 Entitlements + Metering** (P1)
6. **EPIC-08 Kanban Metrics + SLA** (P1)
7. **EPIC-05 Observabilidade** (P1)
8. **EPIC-07 Embed Security + Feature Flags** (P1)
9. **EPIC-10 DevSecOps Gates** (P1)

---

## 3) Tasks detalhadas

### EPIC-03 — Tenant Isolation (P0)

**TASK-03.1** Revisar todos handlers repos para filtrar `account_id`

- Input: endpoints listados em `backend-endpoint-audit.md`
- Output: queries com `WHERE account_id = ?`
- Verify: testes cross-tenant (token A não acessa dados B)

**TASK-03.2** Middleware único de resolução de tenant

- Output: tenant_id em context
- Verify: toda request com tenant obrigatório

**TASK-03.3** Teste automatizado anti-IDOR

- Output: suite rodando
- Verify: pipeline passa

---

### EPIC-01 — IAM + Sessions (P0)

**TASK-01.1** Implementar sessões por dispositivo

- Output: `/me/sessions` e `DELETE /me/sessions/:id`
- Verify: revogar sessão invalida refresh

**TASK-01.2** Refresh token rotacionado (cookie)

- Output: refresh flow completo
- Verify: refresh antigo falha

**TASK-01.3** Logout

- Output: revoga sessão
- Verify: token invalido após logout

---

### EPIC-02 — API Keys + Instance Tokens (P0)

**TASK-02.1** API Key CRUD + hashing forte

- Output: gerar prefix + secret + bcrypt/argon2
- Verify: key sem scope não acessa endpoint

**TASK-02.2** Scopes enforcement

- Output: middleware de scope
- Verify: testes negativos

**TASK-02.3** Instance tokens

- Output: tabela + middleware
- Verify: token só acessa endpoints permitidos

---

### EPIC-06 — Security Headers (P0)

**TASK-06.1** CSP + HSTS + nosniff

- Output: middleware headers
- Verify: curl mostra headers

---

### EPIC-04 — Entitlements + Metering (P1)

**TASK-04.1** Expandir entitlements

- Output: campos completos

**TASK-04.2** Enforcement global

- Output: checks before create
- Verify: exceder quotas bloqueia

**TASK-04.3** Metering diário

- Output: job/update usage
- Verify: endpoint mostra uso

---

### EPIC-08 — Kanban Metrics (P1)

**TASK-08.1** CardHistory completo

- Output: eventos create/move/close

**TASK-08.2** Endpoints de métricas

- Output: `/kanban/metrics` etc

---

### EPIC-05 — Observabilidade (P1)

**TASK-05.1** Logs JSON + request_id
**TASK-05.2** Métricas RED/USE
**TASK-05.3** Tracing OTEL

---

### EPIC-07 — Embed Security (P1)

**TASK-07.1** Origin allowlist + postMessage validation
**TASK-07.2** Feature flags por tenant

---

### EPIC-10 — DevSecOps (P1)

**TASK-10.1** CI com lint/test/scan
**TASK-10.2** Secret scanning + Trivy
**TASK-10.3** Gates de aprovação

---

## 4) Checklist 100% backend

- [ ] Tenant isolation global (rota + query)
- [ ] IAM completo (refresh, sessions, logout)
- [ ] API Keys com scopes e hash forte
- [ ] Instance tokens
- [ ] Webhook secrets separados + idempotência
- [ ] Entitlements enforcement global
- [ ] Metering diário ativo
- [ ] Kanban metrics endpoints
- [ ] Security headers aplicados
- [ ] Logs JSON + request_id
- [ ] Métricas RED/USE
- [ ] CI com gates

---

## 5) Como rodar os testes de isolamento

Os testes de IDOR e RLS sao integration tests e dependem de Postgres.

Requisitos:
- `DATABASE_URL_TEST` apontando para um banco de teste
- `RLS_TEST=1` para habilitar os testes de RLS

Comandos:
```bash
cd apps/api
go test ./internal/repositories -tags=integration
```
