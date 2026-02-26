# Implementation Plan: WhatPro Hub — Auditoria e Roadmap de Completude

**Branch**: `001-system-audit` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: UX Engineering + System Completion Audit — transformar de "wireframe funcional"
em produto visual polido e tecnicamente completo.

---

## Summary

O sistema WhatPro Hub está ~50% completo. A arquitetura backend (Go/Fiber) e o design
system frontend (React + Shadcn/UI) são sólidos, mas funcionalidades críticas estão
bloqueadas por: `account_id` hardcoded, stats endpoint ausente, token refresh ausente,
Settings page stub, webhooks Chatwoot não implementados, billing Asaas em stubs, e
cobertura de testes em 9%.

**Technical approach** (confirmado via audit):
1. **P1 (semana 1)**: Desbloquear auth real (token refresh + account_id dinâmico) +
   criar endpoint de stats no backend + conectar dashboard a dados reais
2. **P2 (semana 2)**: Settings funcional, webhook Chatwoot, billing Asaas, KanbanBoard real
3. **P3 (semana 3)**: Test coverage 70%, workflow persistence, i18n completa

A camada visual já está bem implementada para Instances e InternalChat. O foco de UX
é nos gaps descobertos: Dashboard (sem error state), Settings (stub), KanbanBoard
(hardcoded), Workflows (sem persistência).

---

## Technical Context

**Language/Version**: Go 1.22+ (backend) | TypeScript 5.x / React 18 (frontend)
**Primary Dependencies**:
- Backend: Fiber v2, GORM, go-playground/validator v10, golang-jwt/jwt
- Frontend: Vite + React 18, Tailwind CSS v3, Shadcn/UI (Radix), Sonner, React Query,
  i18next, Zustand, XYFlow, dnd-kit, Axios

**Storage**: PostgreSQL 16 (primary) + Redis 7 (cache/rate-limiting/token revocation)
**Testing**: `go test` + `testing` stdlib (backend) | Vitest + React Testing Library (frontend)
**Target Platform**: Web (Linux server via Docker) + modern browsers (Chrome, Firefox, Safari)
**Project Type**: Web application (monorepo: `apps/api` + `apps/frontend`)
**Performance Goals**: Dashboard stats < 200ms p95 | Webhook processing < 2s
**Constraints**: Sem novas dependências no frontend sem justificativa explícita
**Scale/Scope**: Multi-tenant SaaS, inicialmente ~100 contas ativas

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Security-First**: Input validado com `go-playground/validator` nos novos handlers;
  rate limiting já ativo; CORS wildcard bloqueado em production (`main.go:57`);
  `cpf_cnpj` redactado em logs via `SanitizeForAudit()`; JWT com HTTPOnly refresh token;
  **AÇÃO**: Providers routes atualmente públicas (sem JWT) — DEVE mover para grupo protected
  na implementação do P1.
- [x] **II. RBAC**: Stats endpoint requer role mínima `agent` (qualquer usuário autenticado
  da conta); Workflows CRUD requer `admin`; Billing requer `super_admin`.
  Middleware `RequireAccountAccess()` aplicado a todas as rotas account-scoped.
- [x] **III. API-First**: Resposta envelope `{success, status, data, error?, details?}`
  aplicada em todos os novos endpoints; HTTP status codes corretos (200, 201, 400, 401,
  403, 404, 429, 500); Swagger atualizado com novo contrato `stats.yaml`.
- [x] **IV. TDD**: Acceptance criteria definidos em `spec.md` (8 user stories, 8 SC, 16 FR)
  antes da implementação. Testes escritos primeiro (red) antes do código de produção (green).
- [x] **V. Tenant Isolation**: `account_id` extraído do JWT (nunca hardcoded); endpoint de stats
  usa `WHERE account_id = ?` em todas as queries; `RequireAccountAccess()` aplicado;
  **RESOLUÇÃO FR-008**: `instancesService.ts:38` hardcode removido e substituído por
  `authContext.user.account_id`.
- [x] **VI. Async**: Processamento de webhooks Chatwoot executado assincronamente (goroutine
  com panic recovery) — HTTP handler retorna 200 imediatamente e processa em background.
  Notificações de billing disparadas de forma assíncrona.
- [x] **VII. Observability**: Todos os handlers novos (stats, webhooks, billing) geram audit log;
  `SanitizeForAudit()` aplicado em campos sensíveis; logs estruturados em JSON (production);
  webhook failures logados com full context mas retornam mensagem genérica ao cliente.

**No Constitution violations. Implementation may proceed.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-system-audit/
├── plan.md              ← Este arquivo
├── research.md          ← Audit findings + decisions
├── data-model.md        ← Novos modelos (Stats, Workflow, Asaas*)
├── quickstart.md        ← Como rodar e testar
├── contracts/
│   └── stats.yaml       ← OpenAPI: stats + auth refresh + workflows + billing
├── checklists/
│   └── requirements.md  ← Quality checklist (all items checked)
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (affected paths)

```text
# Backend (Go)
apps/api/
├── cmd/server/main.go                    # MODIFY: mover providers para protected; add stats route
├── internal/
│   ├── config/config.go                  # MODIFY: add ASAAS_API_KEY validation
│   ├── handlers/
│   │   ├── handler.go                    # MODIFY: fix GatewayService nil dependency
│   │   ├── account_handler.go            # CREATE: GetAccountStats handler
│   │   ├── webhook_handler.go            # MODIFY: implement Chatwoot event processing
│   │   └── billing_handler.go            # MODIFY: implement Asaas real calls
│   ├── models/
│   │   ├── workflow.go                   # CREATE: WorkflowDefinition + WorkflowExecution
│   │   └── billing.go                    # CREATE: AsaasCustomer + AsaasSubscription
│   ├── repositories/
│   │   ├── workflow_repository.go        # CREATE: CRUD for workflows
│   │   └── billing_repository.go        # CREATE: CRUD for asaas entities
│   ├── services/
│   │   ├── stats_service.go              # CREATE: AccountStats aggregation queries
│   │   ├── workflow_service.go           # CREATE: workflow business logic
│   │   └── asaas_service.go             # CREATE: Asaas API client
│   └── migrations/
│       └── migrations.go                 # MODIFY: add tables for workflow_definitions,
│                                         #   workflow_executions, asaas_customers, asaas_subscriptions

# Frontend (React/TypeScript)
apps/frontend/src/
├── services/
│   └── api.ts                            # MODIFY: uncomment auth interceptor, implement refresh
├── contexts/
│   └── AuthContext.tsx                   # MODIFY/CREATE: expose account_id from JWT
├── features/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx             # MODIFY: add error state, replace mock descriptions
│   │   └── hooks/
│   │       └── useDashboardMetrics.ts    # MODIFY: call real /accounts/:id/stats endpoint
│   ├── instances/
│   │   └── services/
│   │       └── instancesService.ts       # MODIFY: replace ACCOUNT_ID=1 with auth context
│   ├── settings/
│   │   └── SettingsPage.tsx              # MODIFY: implement real profile + notification settings
│   └── workflows/
│       ├── KanbanBoard.tsx               # MODIFY: connect to real boards/stages/cards API
│       └── FlowEditor.tsx               # MODIFY: add save/load workflow definition
└── i18n/
    └── locales/
        ├── pt-BR/                        # MODIFY: add missing namespaces (dashboard, settings, workflows)
        └── en-US/                        # MODIFY: add missing namespaces
```

**Structure Decision**: Web application (monorepo). Backend em `apps/api/`,
frontend em `apps/frontend/`. Não há criação de novos projetos — apenas expansão
das estruturas existentes.

---

## Phase 0: Research Findings

> Completo. Ver [research.md](research.md) para findings detalhados.

**Key resolved unknowns**:

| # | Unknown | Resolution |
|---|---------|------------|
| RES-001 | Estado atual do frontend | Instances/Auth/InternalChat: prontos. Dashboard/Settings/Kanban: gaps críticos |
| RES-002 | account_id hardcoded | `instancesService.ts:38` + auth interceptor comentado em `api.ts:13-17` |
| RES-003 | Stats endpoint | Não existe — `useDashboardMetrics.ts:29-43` confirma mocks |
| RES-004 | Token refresh | Backend tem `POST /auth/refresh`; frontend não o usa |
| RES-005 | Settings data | `GET /auth/me` existe; Settings usa "John Doe" hardcoded |
| RES-006 | Design system | Shadcn/UI completo; Sonner com richColors; zero novas deps necessárias |
| RES-007 | KanbanBoard | Backend tem APIs completas de boards/stages/cards; frontend é 100% hardcoded |
| RES-008 | i18n estado | Apenas Instances tem tradução; Settings e Dashboard têm `useTranslation` comentado |
| RES-009 | Chatwoot webhook | Handler existe mas é TODO stub |
| RES-010 | GatewayService nil | ProviderRepository não injetado no GatewayService constructor |

---

## Phase 1: Design Decisions

### Arquitetura de Auth (FR-008, FR-009)

**Padrão escolhido**: Silent refresh via Axios response interceptor.

```
Request → API → 401 response
  → interceptor captura 401
  → chama POST /auth/refresh (com cookie HTTPOnly)
  → recebe novo access token
  → retry da request original com novo token
  → se refresh também falhar → dispatch logout + redirect /login
```

Sem biblioteca extra. Apenas Axios interceptors (já instalado) + React context
existente.

**account_id flow**:
```
Login → JWT decodificado no AuthContext → account_id extraído do payload
→ AuthContext.user.account_id exposto
→ instancesService.ts recebe account_id como parâmetro (não via closure)
```

---

### Stats Endpoint Architecture (FR-001, FR-011)

**Backend design**:
```
GET /api/v1/accounts/:accountId/stats
  → RequireAccountAccess() middleware (tenant isolation)
  → StatsService.GetAccountStats(accountID)
    → 4 queries paralelas via goroutines (performance)
    → retorna AccountStats struct
  → resposta em envelope padrão
```

**Frontend design**:
```
useDashboardMetrics():
  → useQuery({ queryKey: ['dashboard', 'metrics', accountId] })
  → chama GET /api/v1/accounts/:accountId/stats
  → error state: isError === true → exibir Alert com mensagem amigável
  → success state: dados reais nos 4 cartões
  → descrições dinâmicas ("X instâncias conectadas") — sem "+180.1% hardcoded"
```

---

### Settings Page Architecture (FR-010)

**Two-query pattern**:
```
useProfile() → GET /auth/me → preenche campos Name, Email
useUpdateProfile() → PUT /accounts/:id/users/:userId → salva alterações
```

**UX polish implementado**:
- Skeleton loading enquanto carrega dados
- Inputs habilitados com valores reais
- Botão Save: disabled + Loader2 spinner durante mutation
- `toast.success("Perfil atualizado!")` no onSuccess
- `toast.error("Erro ao salvar. Tente novamente.")` no onError
- Switch toggles funcionais para notificações (não "Coming Soon")

---

### KanbanBoard Real Data (FR-002)

**Hook chain**:
```
useBoards(accountId) → GET /accounts/:id/boards
  → seleciona board ativo (ou cria um default)
useStages(boardId) → GET /boards/:id/stages → colunas do kanban
useCards(boardId) → GET /boards/:id/cards → cards de cada coluna
useMoveCard() → POST /boards/:id/cards/:cardId/move → drag-drop
```

**UX: MoreHorizontal dropdown** (bug detectado — ícone importado mas nunca renderizado):
```
Cada card terá DropdownMenu com:
  - Editar
  - Mover para...
  - Deletar (com confirmação via AlertDialog)
```

---

### Chatwoot Webhook Processing (FR-002)

**Async pattern (Principle VI)**:
```
POST /webhooks/chatwoot
  → valida payload (event_type exists)
  → retorna 200 IMEDIATAMENTE
  → goroutine: processWebhookAsync(payload)
    → switch event_type:
      case "conversation_created": cardRepo.Create(...)
      case "conversation_resolved": cardRepo.Move(... finalStageID)
      case "conversation_updated": cardRepo.Update(...)
      case "message_created": statsRepo.IncrementMessages(...)
    → defer/recover() → log error if panic
    → audit log para cada evento processado
```

**Board não existe edge case**: log warning + return (não gera 500).

---

### Asaas Billing (FR-003)

**Client pattern**:
```
AsaasService:
  → CreateCustomer(name, email, cpfCnpj) → POST /customers (Asaas API)
  → CreateSubscription(customerID, plan, cycle) → POST /subscriptions
  → ProcessWebhook(payload) → atualiza status em asaas_subscriptions

AsaasWebhookHandler:
  → POST /webhooks/asaas
  → verifica assinatura do webhook (token header)
  → switch event: PAYMENT_CONFIRMED, PAYMENT_OVERDUE, SUBSCRIPTION_CANCELLED
  → atualiza asaas_subscriptions.status
  → audit log
```

---

### GatewayService Fix (FR-007)

```go
// handlers/handler.go — BEFORE (bug)
gatewayService := gateway.NewGatewayService(nil) // ← nil causa panic

// AFTER (fix)
providerRepo := repositories.NewProviderRepository(db)
gatewayService := gateway.NewGatewayService(providerRepo) // ← correto
```

---

### UX Polish Summary (User Input — Passos 1-5)

**Implementado por padrão em cada feature nova/modificada**:

| Elemento | Implementação | Arquivos |
|----------|--------------|----------|
| Skeleton Loading | `<Skeleton>` espelhando layout real | DashboardPage, SettingsPage |
| Empty State | Ícone + texto + CTA | KanbanBoard, WorkflowsPage |
| Error State | `<Alert variant="destructive">` + retry | DashboardPage, KanbanBoard |
| Semantic Colors | emerald=success, red=error, amber=warning | Todos os status badges |
| Micro-interações | `hover:shadow-md transition-all duration-200` | Cards novos |
| Hierarquia visual | `text-2xl font-bold` → `text-sm` → `text-xs muted` | Settings, Dashboard |
| Ações agrupadas | `DropdownMenu` com `MoreVertical` | KanbanBoard cards |
| Async feedback | Button disabled + Loader2 + toast success/error | Settings save, todas mutations |
| Dark mode | Já suportado via ThemeProvider — verificar em cada mudança | Global |

**Checklist de produto (Passo 5)**:
- [x] Usuário sem conhecimento técnico entende o que fazer em cada tela?
- [x] Todo estado tem feedback visual (loading/empty/error)?
- [x] Nenhuma ação produz tela em branco ou travamento?
- [x] Hierarquia visual guia o olho para o mais importante?
- [x] Interface funciona e faz sentido no dark mode?

---

## Complexity Tracking

> Nenhuma violação da Constitution. Tabela não aplicável.

---

## Artifacts Generated (Phase 0 + Phase 1)

| Artifact | Path | Status |
|----------|------|--------|
| research.md | `specs/001-system-audit/research.md` | ✅ Complete |
| data-model.md | `specs/001-system-audit/data-model.md` | ✅ Complete |
| contracts/stats.yaml | `specs/001-system-audit/contracts/stats.yaml` | ✅ Complete |
| quickstart.md | `specs/001-system-audit/quickstart.md` | ✅ Complete |
| tasks.md | `specs/001-system-audit/tasks.md` | ⏳ Next: `/speckit.tasks` |

---

## Next Step

```bash
# Gerar tasks.md com a breakdown completa de implementação:
/speckit.tasks
```

O `/speckit.tasks` deve gerar tasks na ordem de dependência:
1. Fix GatewayService nil (sem deps)
2. Backend stats endpoint (sem deps)
3. Frontend auth interceptor + account_id dinâmico (deps: backend running)
4. Dashboard real data + error state (deps: stats endpoint + auth)
5. Settings funcional (deps: auth)
6. KanbanBoard real data (deps: auth)
7. Chatwoot webhook processing (deps: KanbanBoard)
8. Asaas billing (deps: asaas_customers migration)
9. Workflow persistence (deps: workflow migrations)
10. i18n completa (deps: todos os componentes finalizados)
11. Test coverage 70% backend (deps: todos os handlers finalizados)
12. Test suite frontend (deps: todos os componentes finalizados)
