# Backend Endpoint Audit (Auth/Tenant/AuthZ/Entitlements/Audit)

**Projeto:** WhatPro Hub
**Data:** 2026-02-06

Este documento lista endpoints atuais e verifica: AuthN, Tenant, AuthZ, Entitlements, Rate-limit e Audit.

---

## Convencoes

- AuthN: JWT/API Key/Instance Token
- Tenant: validacao `account_id`
- AuthZ: RequireRole / policies
- Entitlements: quotas antes de criar
- Audit: evento registrado

Legenda:
- OK = pronto
- PARCIAL = incompleto
- FALTA = ausente

---

## 1) Auth

### POST /api/v1/auth/sso
- AuthN: OK (Chatwoot token)
- Tenant: OK (via chatwoot account)
- AuthZ: OK (role derivado)
- Entitlements: N/A
- Audit: FALTA (nao loga login)

### POST /api/v1/auth/refresh
- Status: FALTA (nao implementado)

### POST /api/v1/auth/logout
- Status: PARCIAL (stub)

### GET /api/v1/auth/me
- AuthN: OK (JWT)
- Tenant: PARCIAL (nao valida accountId)
- AuthZ: OK
- Audit: FALTA

---

## 2) Accounts

### GET /accounts
- AuthN: OK
- Tenant: N/A (super_admin)
- AuthZ: OK RequireRole(super_admin)
- Audit: FALTA

### GET /accounts/:id
- AuthN: OK
- Tenant: PARCIAL (admin/super_admin, mas falta validacao explicita para admin)
- AuthZ: OK
- Audit: FALTA

### POST /accounts
- AuthN: OK
- AuthZ: OK super_admin
- Audit: OK (AuditCreate)

### PUT /accounts/:id
- AuthN: OK
- AuthZ: OK admin/super_admin
- Audit: OK (AuditUpdate)

---

## 3) Teams

### /accounts/:accountId/teams
- AuthN: OK
- Tenant: OK RequireAccountAccess + queries scoped
- AuthZ: OK
- Audit: PARCIAL (create/update/delete audit faltando em alguns)

---

## 4) Users

### /accounts/:accountId/users
- AuthN: OK
- Tenant: OK RequireAccountAccess + queries scoped
- AuthZ: OK
- Audit: PARCIAL

---

## 5) Providers

### GET /accounts/:accountId/providers
- AuthN: OK
- Tenant: OK RequireAccountAccess
- AuthZ: OK

### GET /accounts/:accountId/providers/:id
- AuthN: OK
- Tenant: OK (query scoped by account_id)
- AuthZ: OK
- Entitlements: N/A
- Audit: FALTA

### POST /accounts/:accountId/providers
- AuthN: OK
- Tenant: OK
- AuthZ: OK
- Entitlements: OK (provider)
- Audit: OK

### PUT /accounts/:accountId/providers/:id
- Tenant: OK (query scoped)

### DELETE /accounts/:accountId/providers/:id
- Tenant: OK (query scoped)

---

## 6) Kanban

### GET /accounts/:accountId/boards
- Tenant: OK

### GET /accounts/:accountId/boards/:id
- Tenant: OK (query scoped)

### POST /accounts/:accountId/boards
- Tenant: OK
- Entitlements: FALTA (nao checa limites)

### PUT /accounts/:accountId/boards/:id
- Tenant: OK

### DELETE /accounts/:accountId/boards/:id
- Tenant: OK

### /boards/:boardId/stages
- Tenant: OK (verifica account via board)

### /boards/:boardId/cards
- Tenant: OK (verifica account via stage/board)

---

## 7) Webhooks

### POST /api/v1/webhooks/chatwoot
- AuthN: OK (signature)
- Secret: PARCIAL usa JWT_SECRET
- Idempotencia: FALTA

### POST /api/v1/webhooks/evolution/:instanceId
- AuthN: FALTA

### POST /api/v1/webhooks/asaas
- AuthN: FALTA

---

## 8) Billing

### POST /api/v1/billing/subscribe
- AuthN: PARCIAL (nao valida usuario real)
- Tenant: FALTA (mocked)
- Billing: FALTA (stub)

---

## 9) Health / Metrics

- /health/* OK
- /metrics OK (duplicado)

---

## 10) P0 Fix list

1. Tenant isolation em Providers/Boards/Stages/Cards (feito)
2. Refresh + Sessions
3. Webhook secrets + idempotencia
4. API Keys com scopes + hashing forte
5. Security headers

