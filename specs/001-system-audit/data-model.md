# Data Model: WhatPro Hub — Auditoria e Roadmap de Completude

**Phase**: 1 — Design
**Branch**: `001-system-audit`
**Date**: 2026-02-19

---

## Overview

Este documento descreve as entidades novas e modificadas necessárias para
completar os gaps identificados na auditoria. Entidades já implementadas
(Provider, Board, Stage, Card, User, Account) são referenciadas mas não
redescritas.

---

## Entidades Novas

### AccountStats *(FR-001)*

Agregação de métricas calculadas por conta. Não é uma tabela persistida —
é calculada em tempo real via queries no handler.

```
AccountStats {
  account_id          uint      // FK → accounts.id
  active_instances    int       // COUNT(providers WHERE status='connected')
  messages_today      int       // COUNT(messages WHERE date=today)
  active_clients      int       // COUNT(DISTINCT contact_id FROM conversations)
  workflows_triggered int       // COUNT(workflow_executions WHERE date=today)
  generated_at        timestamp // time.Now() — para cache-control no frontend
}
```

**Response shape** (JSON envelope, FR-003 API-First):
```json
{
  "success": true,
  "status": 200,
  "data": {
    "active_instances": 5,
    "messages_today": 1243,
    "active_clients": 87,
    "workflows_triggered": 34,
    "generated_at": "2026-02-19T14:30:00Z"
  }
}
```

**Validation rules**:
- Todos os valores são `>= 0` (COUNT nunca negativo)
- `account_id` DEVE existir na tabela `accounts`
- Acesso requer que o usuário autenticado pertença à conta (Tenant Isolation, V)

---

### WorkflowDefinition *(FR-012)*

Grafo de automação persistido. Armazena nós e conexões do editor visual.

```
workflow_definitions {
  id          uuid         PK DEFAULT gen_random_uuid()
  account_id  uint         FK → accounts.id NOT NULL
  name        varchar(255) NOT NULL
  description text
  nodes       jsonb        NOT NULL  // Array of {id, type, position, data}
  edges       jsonb        NOT NULL  // Array of {id, source, target, data}
  is_active   boolean      DEFAULT false
  created_by  uint         FK → users.id
  created_at  timestamp    DEFAULT now()
  updated_at  timestamp    DEFAULT now()
}

INDEX: (account_id, is_active)
INDEX: (account_id, created_at DESC)
```

**State transitions**:
```
draft → active  (via PATCH /workflows/:id/activate)
active → draft  (via PATCH /workflows/:id/deactivate)
any → deleted   (via DELETE /workflows/:id, soft delete)
```

**Validation rules**:
- `name` obrigatório, min 3 chars, max 255
- `nodes` deve ser JSON válido, array não vazio quando `is_active=true`
- `account_id` DEVE existir; tenant isolation obrigatório

---

### WorkflowExecution *(FR-012)*

Registro imutável de cada execução de um workflow.

```
workflow_executions {
  id                  uuid      PK DEFAULT gen_random_uuid()
  workflow_id         uuid      FK → workflow_definitions.id
  account_id          uint      FK → accounts.id
  trigger_event       varchar(100)  // ex: "conversation_created"
  trigger_payload     jsonb     // dados do evento que disparou
  status              varchar(20)   // 'running' | 'completed' | 'failed'
  result              jsonb     // resultado da execução (nullable)
  error_message       text      // mensagem de erro (nullable)
  started_at          timestamp DEFAULT now()
  completed_at        timestamp // nullable, set quando concluído
}

INDEX: (workflow_id, started_at DESC)
INDEX: (account_id, status)
```

**Validation rules**:
- Imutável após criação (sem UPDATE, apenas INSERT) — V. Observability
- `status` deve ser um dos 3 valores válidos
- `error_message` MUST NOT ser nulo quando `status='failed'`

---

### AsaasCustomer *(FR-003)*

Representação do cliente na Asaas. Vincula uma conta ao ID externo da Asaas.

```
asaas_customers {
  id          uuid        PK DEFAULT gen_random_uuid()
  account_id  uint        FK → accounts.id UNIQUE  // 1:1 com account
  asaas_id    varchar(50) NOT NULL UNIQUE  // ex: "cus_000005113026"
  name        varchar(255)
  email       varchar(255)
  cpf_cnpj    varchar(20)  // armazenado mas não logado (sensível)
  created_at  timestamp   DEFAULT now()
}
```

**Validation rules**:
- `asaas_id` DEVE ser obtido da API Asaas após criação bem-sucedida
- `cpf_cnpj` DEVE ser redacted nos logs (`SanitizeForAudit()`)
- Uma conta pode ter apenas 1 customer (UNIQUE account_id)

---

### AsaasSubscription *(FR-003)*

Assinatura ativa na Asaas, vinculada ao customer.

```
asaas_subscriptions {
  id              uuid        PK DEFAULT gen_random_uuid()
  account_id      uint        FK → accounts.id
  customer_id     uuid        FK → asaas_customers.id
  asaas_sub_id    varchar(50) NOT NULL  // ex: "sub_000001234567"
  plan_id         varchar(50) NOT NULL  // ex: "basic" | "pro" | "enterprise"
  status          varchar(20) NOT NULL  // 'active' | 'inactive' | 'overdue' | 'cancelled'
  billing_cycle   varchar(20) NOT NULL  // 'MONTHLY' | 'YEARLY'
  next_due_date   date
  created_at      timestamp   DEFAULT now()
  updated_at      timestamp   DEFAULT now()
}

INDEX: (account_id, status)
```

**State transitions** (driven by Asaas webhooks):
```
pending → active    (PAYMENT_CONFIRMED webhook)
active  → overdue   (PAYMENT_OVERDUE webhook)
overdue → active    (PAYMENT_CONFIRMED webhook)
any     → cancelled (SUBSCRIPTION_CANCELLED webhook)
```

---

## Entidades Modificadas

### Provider (existente) — sem mudanças de schema

O campo `status` já existe. O handler de stats lerá o campo diretamente.

### User (existente) — sem mudanças de schema

O endpoint `GET /auth/me` já retorna os dados do usuário. A página Settings
consumirá este endpoint sem mudanças no modelo.

---

## Frontend Data Contracts

### AuthContext (modificação — FR-008, FR-009)

O contexto de autenticação deve expor `accountId` derivado do JWT:

```typescript
interface AuthContext {
  user: {
    id: number
    account_id: number   // ← extraído do JWT payload, nunca hardcoded
    name: string
    email: string
    role: 'agent' | 'supervisor' | 'admin' | 'super_admin'
  } | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string>
}
```

### DashboardMetrics (modificação — FR-011)

Remove campos mock; substitui por dados reais do endpoint `/accounts/:id/stats`:

```typescript
interface DashboardMetrics {
  active_instances: number    // real from DB
  messages_today: number      // real from DB
  active_clients: number      // real from DB
  workflows_triggered: number // real from DB
  generated_at: string        // ISO timestamp
}
// Remove: recentActivity (mock), activeMessages (renamed), activeClients (renamed)
```

---

## Database Migration Notes

As seguintes migrações serão necessárias (executar em ordem):

```sql
-- Migration 001: workflow_definitions
CREATE TABLE workflow_definitions (...);

-- Migration 002: workflow_executions
CREATE TABLE workflow_executions (...);

-- Migration 003: asaas_customers
CREATE TABLE asaas_customers (...);

-- Migration 004: asaas_subscriptions
CREATE TABLE asaas_subscriptions (...);
```

Estas são **migrações aditivas** — não alteram tabelas existentes.
