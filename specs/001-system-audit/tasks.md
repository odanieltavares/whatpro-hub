# Tasks: WhatPro Hub — Auditoria e Roadmap de Completude

**Input**: Design documents from `/specs/001-system-audit/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/stats.yaml ✅ | quickstart.md ✅

**Organization**: Tasks grouped by user story (spec.md). Each story is independently testable.
**Tests**: Included only for User Story 6 (FR-005/FR-014 explicitly require 70% coverage).
**Stack**: Go 1.22+/Fiber v2/GORM/PostgreSQL 16/Redis 7 (backend) + React 18/Vite/Tailwind/Shadcn/Sonner/React Query (frontend)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Maps to user story in spec.md (US1–US8)
- Exact file paths in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure fixes that unblock all subsequent work.

- [x] T001 Fix GatewayService nil dependency: inject `repositories.NewProviderRepository(db)` into `gateway.NewGatewayService(...)` in `apps/api/internal/handlers/handler.go`
- [x] T002 Add missing DB migration entries for `workflow_definitions`, `workflow_executions`, `asaas_customers`, `asaas_subscriptions` tables in `apps/api/internal/migrations/migrations.go`
- [x] T003 [P] Add `ASAAS_API_KEY` and `ASAAS_BASE_URL` fields to config struct and validation in `apps/api/internal/config/config.go`

**Checkpoint**: Compile backend with `go build ./...` — zero errors, GatewayService no longer panics.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth infrastructure that ALL user stories require. No feature can ship without account_id being correct.

**⚠️ CRITICAL**: Nothing after Phase 2 should start until these tasks are complete.

- [x] T004 Implement `AuthContext` in `apps/frontend/src/context/AuthContext.tsx`: expose `user.account_id`, `isAuthenticated`, `login`, `logout`, `refreshToken` functions
- [x] T005 Uncomment and complete the Axios request interceptor in `apps/frontend/src/services/api.ts`: attach `Authorization: Bearer <token>` header
- [x] T006 Implement Axios response interceptor for silent token refresh in `apps/frontend/src/services/api.ts`: 401 → refresh → retry; refresh failure → toast + redirect
- [x] T007 Replace hardcoded `const ACCOUNT_ID = 1` in `apps/frontend/src/features/instances/services/instancesService.ts`: all methods accept `accountId: number` param; `useInstances.ts` uses `useAuth()` to get account_id
- [x] T008 [P] Move providers route group from public section to protected group in `apps/api/cmd/server/main.go`: add `RequireAccountAccess()` middleware
- [x] T009 [P] Create `apps/api/internal/models/workflow.go`: `WorkflowDefinition` + `WorkflowExecution` with GORM tags
- [x] T010 [P] Create `apps/api/internal/models/asaas.go`: `AsaasCustomer` + `AsaasSubscription` with GORM tags

**Checkpoint**: Frontend requests include `Authorization` header. Backend returns 401 on unauthenticated providers access. account_id flows from auth context to all API calls.

---

## Phase 3: User Story 1 — Dashboard com dados reais (Priority: P1) 🎯 MVP

**Goal**: Substituir os 3 valores hardcoded do dashboard (`activeMessages: 2350`, `activeClients: 12234`, `workflowsTriggered: 573`) e a `recentActivity` mockada por dados reais do banco. Adicionar error state.

**Independent Test**: Abrir o dashboard com instâncias reais no banco → cartões exibem valores do banco; parar o backend → cartões exibem mensagem de erro amigável.

- [ ] T011 [US1] Create `apps/api/internal/services/stats_service.go`: implement `StatsService` with method `GetAccountStats(ctx, accountID uint) (*AccountStats, error)` that runs 4 parallel goroutines via `sync.WaitGroup` querying: (1) `COUNT(*) FROM providers WHERE account_id=? AND status='connected'`, (2) `COUNT(*) FROM messages WHERE account_id=? AND DATE(created_at)=CURRENT_DATE` (use 0 if table absent), (3) `COUNT(DISTINCT contact_id) FROM conversations WHERE account_id=?` (use 0 if table absent), (4) `COUNT(*) FROM workflow_executions WHERE account_id=? AND DATE(started_at)=CURRENT_DATE`
- [ ] T012 [US1] Create handler method `GetAccountStats` in `apps/api/internal/handlers/account_handler.go`: parse `:accountId` param → call `StatsService.GetAccountStats()` → return envelope `{success, status:200, data:{active_instances, messages_today, active_clients, workflows_triggered, generated_at}}`; return 404 if account not found; add Swagger annotation
- [ ] T013 [US1] Register route in `apps/api/cmd/server/main.go`: add `accounts.Get("/:id/stats", middleware.RequireRole("agent","supervisor","admin","super_admin"), h.GetAccountStats)` inside the protected accounts group (after line 223)
- [ ] T014 [US1] Update `apps/frontend/src/features/dashboard/hooks/useDashboardMetrics.ts`: replace mock block (lines 29-44) with real `api.get<{success,data:DashboardMetrics}>(\`/accounts/${accountId}/stats\`)` call; update `DashboardMetrics` interface to match real response shape (`active_instances`, `messages_today`, `active_clients`, `workflows_triggered`, `generated_at`); receive `accountId` from `AuthContext`
- [ ] T015 [US1] Update `apps/frontend/src/features/dashboard/DashboardPage.tsx`: (1) add `isError` branch — render `<Alert variant="destructive">` with retry button when stats fetch fails; (2) fix stat card descriptions from hardcoded "+180.1% from last month" to dynamic text based on real data (e.g., "X conectadas de Y total"); (3) rename `recentActivity` card to "Instâncias Recentes" showing real provider data with semantic status colors (emerald=connected, red=disconnected, amber=connecting); (4) add `text-2xl font-bold tracking-tight` to page title
- [ ] T016 [US1] Update stats card descriptions to not expose fake percentages — replace all 4 `description` strings in the stats array with context-aware text derived from real metric values (e.g., `"${metrics.active_instances} de ${metrics.total_instances} ativas"`)

**Checkpoint**: Dashboard exibe dados reais. Parar backend mostra mensagem de erro (não crash). Banco vazio mostra zeros.

---

## Phase 4: User Story 2 — Autenticação completa com renovação de token (Priority: P1)

**Goal**: Token renovado silenciosamente antes de expirar; account_id sempre da sessão real; redirect automático ao login quando refresh falha.

**Independent Test**: Reduzir `JWT_TTL` para 30s em dev → fazer login → aguardar 30s → fazer requisição → sistema renova e continua funcionando sem intervenção.

- [ ] T017 [US2] Implement full silent refresh logic in `apps/frontend/src/services/api.ts`: add request queue to prevent multiple simultaneous refresh calls (use `isRefreshing` flag + `failedQueue` array pattern); ensure queued requests retry automatically after successful refresh
- [ ] T018 [US2] Update `apps/frontend/src/contexts/AuthContext.tsx`: implement `refreshToken()` method that calls `POST /api/v1/auth/refresh`; store new `accessToken` in memory (not localStorage — XSS prevention); update `user` object with decoded JWT payload after refresh; implement `logout()` that calls `POST /api/v1/auth/logout` and clears auth state
- [ ] T019 [US2] Add redirect guard to `apps/frontend/src/router.tsx`: protect all non-login routes with `<PrivateRoute>` component that checks `AuthContext.isAuthenticated`; redirect unauthenticated users to `/login` preserving the intended destination in `state.from`
- [ ] T020 [US2] Update `apps/frontend/src/features/auth/LoginPage.tsx`: on successful login, decode JWT to extract `account_id`, store in `AuthContext`; on 401/403 show `toast.error("Credenciais inválidas")` (currently shows inline error — keep both); on 500 show `toast.error("Erro no servidor. Tente novamente.")`
- [ ] T021 [US2] Verify backend `AuthRefresh` handler in `apps/api/internal/handlers/auth_handler.go`: ensure it reads refresh token from HTTPOnly cookie (not request body); returns new `access_token` in response body; rotates refresh token (invalidates old one in Redis); add missing `SanitizeForAudit()` call before logging

**Checkpoint**: Token expirado → silently refreshed. account_id da conta 5 → vê apenas dados da conta 5. Sessão de 8 horas sem logout involuntário.

---

## Phase 5: User Story 3 — Página de Configurações funcional (Priority: P2)

**Goal**: Campos com dados reais do usuário logado; save funcional com toast; notificações com Switches reais (não "Coming Soon").

**Independent Test**: Logar como "Maria Silva" → abrir /settings → ver "Maria Silva" nos campos (não "John Doe") → alterar nome → Save → `toast.success` → atualização refletida na sidebar.

- [ ] T022 [P] [US3] Create `apps/frontend/src/features/settings/hooks/useProfile.ts`: `useQuery` calling `GET /api/v1/auth/me` → returns `{id, name, email, role, account_id}`; staleTime 5 minutes
- [ ] T023 [P] [US3] Create `apps/frontend/src/features/settings/hooks/useUpdateProfile.ts`: `useMutation` calling `PUT /api/v1/accounts/:accountId/users/:userId` with `{name, email}`; `onSuccess` → `queryClient.invalidateQueries(['auth','me'])` + `toast.success("Perfil atualizado com sucesso!")`; `onError` → `toast.error("Erro ao salvar perfil. Tente novamente.")`
- [ ] T024 [US3] Rewrite `apps/frontend/src/features/settings/SettingsPage.tsx` Account tab: (1) add `useProfile()` hook → populate name/email fields with real data; (2) add `useUpdateProfile()` mutation; (3) add loading skeleton (`<Skeleton className="h-10 w-full" />`) while profile loads; (4) enable inputs with `react-hook-form` or controlled state; (5) Save button: `disabled={isPending}` + `<Loader2 className="animate-spin h-4 w-4 mr-2" />` during mutation; (6) add `useTranslation()` back (currently commented at line 1)
- [ ] T025 [US3] Rewrite Notifications tab in `apps/frontend/src/features/settings/SettingsPage.tsx`: replace "Coming Soon" placeholder with functional `<Switch>` toggles for: (a) email notifications, (b) push notifications, (c) sound alerts; use `Switch` component from `@/components/ui/switch` (already installed); persist preference to localStorage as `notificationPrefs` JSON; remove `<Badge variant="secondary">Coming Soon</Badge>`
- [ ] T026 [US3] Update Security tab in `apps/frontend/src/features/settings/SettingsPage.tsx`: replace "Coming Soon" placeholder with a Change Password form: current password, new password, confirm fields; mutation calls `POST /api/v1/auth/change-password` (create stub endpoint if absent) with `toast.success/error`; remove `<Badge variant="secondary">Coming Soon</Badge>`
- [ ] T027 [US3] Add `POST /api/v1/accounts/:id/users/:userId/password` backend stub handler in `apps/api/internal/handlers/user_handler.go` if not present: validate `current_password` and `new_password` (min 8 chars, validator tag); return 200 on success; return 400 with details on validation failure; register route in `main.go` inside protected users group

**Checkpoint**: Settings page exibe dados reais. Save funciona com toast. Notificações são Switches funcionais. Zero strings "John Doe" ou "Coming Soon" visíveis.

---

## Phase 6: User Story 4 — Processamento de webhooks Chatwoot (Priority: P2)

**Goal**: `conversation_created` → card criado no Kanban; `conversation_resolved` → card movido para coluna final. Processamento assíncrono em < 2s.

**Independent Test**: `curl -X POST /webhooks/chatwoot -d '{"event":"conversation_created","account":{"id":1},"contact":{"name":"João"}}'` → card aparece no banco em `cards` table.

- [ ] T028 [US4] Create `apps/api/internal/repositories/webhook_repository.go`: implement `WebhookRepository` with methods `FindBoardByAccountID(accountID uint) (*Board, error)`, `FindFinalStage(boardID uint) (*Stage, error)`, `CreateCard(card *Card) error`, `MoveCard(cardID, stageID uint) error`
- [ ] T029 [US4] Create `apps/api/internal/services/webhook_service.go`: implement `WebhookService` with `ProcessChatwootEvent(ctx, payload ChatwootWebhookPayload) error`; switch on `payload.Event`: case `conversation_created` → `webhookRepo.FindBoardByAccountID()` → `webhookRepo.CreateCard()` with contact name + chatwoot link; case `conversation_resolved` → `webhookRepo.FindFinalStage()` → `webhookRepo.MoveCard()`; case board-not-found → `log.Warn("board not found for account %d", accountID)` and return nil (no 500)
- [ ] T030 [US4] Rewrite `HandleChatwootWebhook` in `apps/api/internal/handlers/webhook_handler.go`: (1) validate required fields (`event`, `account.id`) with go-playground/validator; (2) return 200 **immediately**; (3) spawn goroutine: `go func() { defer recoverPanic(); webhookService.ProcessChatwootEvent(ctx, payload) }()`; (4) add deduplication check via Redis `SETNX webhook:{event}:{conversation_id} 1 EX 86400` before processing; (5) generate audit log entry for every processed event
- [ ] T031 [US4] Implement `recoverPanic()` helper in `apps/api/internal/handlers/webhook_handler.go`: `defer func() { if r := recover(); r != nil { log.Error("webhook panic", r) } }()` — prevents goroutine crashes from taking down the server (Constitution Principle VI)
- [ ] T032 [US4] Wire `WebhookService` with `WebhookRepository` in `apps/api/internal/handlers/handler.go` `NewHandler()`: instantiate and inject both dependencies replacing the current stub `handlers.NewWebhookHandler(cfg)` call in `main.go`
- [ ] T033 [US4] Add `message_created` handler in `WebhookService.ProcessChatwootEvent`: increment daily message counter in Redis (`INCR messages:{account_id}:{date}`) — this feeds the stats endpoint `messages_today` without a DB write per message; expire key at midnight

**Checkpoint**: `curl` webhook test creates card in DB. Duplicate webhook for same conversation is ignored. Board-not-found logs warning (no 500). Server remains running after malformed payload.

---

## Phase 7: User Story 5 — Integração de pagamentos Asaas (Priority: P2)

**Goal**: Assinar plano → cliente e assinatura reais na Asaas → link de pagamento retornado; webhook de confirmação → status `active`; webhook de falha → status `overdue`.

**Independent Test**: `POST /billing/subscribe` com dados válidos → verificar objeto criado em `asaas_customers` e `asaas_subscriptions` no banco.

- [ ] T034 [P] [US5] Create `apps/api/internal/repositories/billing_repository.go`: implement `BillingRepository` with `CreateCustomer(*AsaasCustomer) error`, `CreateSubscription(*AsaasSubscription) error`, `FindCustomerByAccountID(accountID uint) (*AsaasCustomer, error)`, `UpdateSubscriptionStatus(asaasSubID, status string) error`
- [ ] T035 [P] [US5] Create `apps/api/internal/services/asaas_service.go`: implement `AsaasService` with HTTP client configured with `ASAAS_API_KEY` header and `ASAAS_BASE_URL` base; methods: `CreateCustomer(name, email, cpfCnpj string) (string, error)` → `POST /customers`; `CreateSubscription(customerID, planID, cycle string) (string, string, error)` → `POST /subscriptions` → returns `(asaasSubID, paymentURL, error)`; use `net/http` with timeout 30s; never log `cpfCnpj` (SanitizeForAudit)
- [ ] T036 [US5] Rewrite `SubscribeAccount` handler in `apps/api/internal/handlers/billing_handler.go`: (1) validate request body (name, email, cpf_cnpj, plan_id, billing_cycle) with go-playground/validator; (2) check if `AsaasCustomer` already exists → reuse if found; (3) call `asaasService.CreateCustomer()` if new; (4) call `asaasService.CreateSubscription()`; (5) persist to `asaas_customers` and `asaas_subscriptions`; (6) return `{success:true, data:{subscription_id, payment_url, status:"pending"}}`; (7) audit log the subscribe event (redact cpf_cnpj)
- [ ] T037 [US5] Implement `HandleAsaasWebhook` in `apps/api/internal/handlers/billing_handler.go`: (1) verify webhook token header matches `ASAAS_WEBHOOK_TOKEN` env var; (2) switch on `event`: `PAYMENT_CONFIRMED` → `billingRepo.UpdateSubscriptionStatus(asaasSubID, "active")`; `PAYMENT_OVERDUE` → `billingRepo.UpdateSubscriptionStatus(asaasSubID, "overdue")`; `SUBSCRIPTION_CANCELLED` → `billingRepo.UpdateSubscriptionStatus(asaasSubID, "cancelled")`; (3) dispatch async notification to account admin (goroutine, fire-and-forget); (4) audit log
- [ ] T038 [US5] Wire `AsaasService` and `BillingRepository` in `apps/api/internal/handlers/handler.go` `NewHandler()`: instantiate with `db` and config; inject into billing handlers
- [ ] T039 [US5] Add `ASAAS_WEBHOOK_TOKEN` to `apps/api/internal/config/config.go` and validate it is set when `ENV=production`; add to `docker-compose.yml` env section
- [ ] T040 [US5] Create billing UI stub in `apps/frontend/src/features/billing/BillingPage.tsx`: show current plan (from `GET /accounts/:id` plan field); show "Assinar Plano" button that opens `<Dialog>` with form (name, email, CPF/CNPJ, plan selection, billing cycle); on submit → `POST /billing/subscribe` → show payment_url as `<a href={url} target="_blank">` link; loading state with `Loader2`; `toast.success("Assinatura criada! Finalize o pagamento.")` / `toast.error("Erro ao criar assinatura.")`

**Checkpoint**: `POST /billing/subscribe` com sandbox Asaas key → objeto criado no painel sandbox.asaas.com. Webhook de confirmação → status muda para `active` no banco.

---

## Phase 8: User Story 6 — Cobertura de testes mínima de 70% (Priority: P3)

**Goal**: Backend handlers + services cobertos. Frontend Vitest configurado com testes dos hooks e componentes críticos.

**Independent Test**: `go test ./... -cover` → ≥ 70% nos pacotes `handlers/` e `services/`. `npm run test:coverage` → ≥ 70% nas features críticas.

> **NOTE: Tests written FIRST (Red) then implementation fixes make them Green.**

### Backend Tests

- [ ] T041 [P] [US6] Write unit tests for `StatsService.GetAccountStats()` in `apps/api/internal/services/stats_service_test.go`: mock `gorm.DB` or use PostgreSQL test DB; test (1) normal case returns all 4 metrics, (2) empty DB returns zeros, (3) DB error returns wrapped error
- [ ] T042 [P] [US6] Write unit tests for auth handlers in `apps/api/internal/handlers/auth_handler_test.go`: test `AuthRefresh` with (1) valid cookie → 200 + new token, (2) expired cookie → 401, (3) missing cookie → 401; test `AuthMe` with valid token → 200 + user data
- [ ] T043 [P] [US6] Write unit tests for `WebhookService.ProcessChatwootEvent()` in `apps/api/internal/services/webhook_service_test.go`: test (1) `conversation_created` → card created, (2) `conversation_resolved` → card moved, (3) board not found → returns nil (no error), (4) unknown event → skipped gracefully
- [ ] T044 [P] [US6] Write unit tests for `AsaasService` in `apps/api/internal/services/asaas_service_test.go`: mock HTTP client; test (1) `CreateCustomer` success path, (2) `CreateCustomer` Asaas API error returns wrapped error, (3) `CreateSubscription` success path
- [ ] T045 [US6] Write integration tests for tenant isolation in `apps/api/internal/handlers/provider_handler_test.go`: spin up test PostgreSQL; test that `GET /accounts/2/providers` with a token for account 1 returns 403 (RequireAccountAccess enforcement)

### Frontend Tests

- [ ] T046 [US6] Configure Vitest + React Testing Library in `apps/frontend/vitest.config.ts`: add `coverage.provider: 'v8'`, `coverage.threshold.statements: 70`; add `test:coverage` script to `apps/frontend/package.json`; install `@testing-library/jest-dom` if not present (check package.json first — avoid adding if transitive dep covers it)
- [ ] T047 [P] [US6] Write test for `useDashboardMetrics` hook in `apps/frontend/src/features/dashboard/hooks/useDashboardMetrics.test.ts`: mock `api.get` → assert metrics mapped correctly from response; mock `api.get` error → assert `isError: true`
- [ ] T048 [P] [US6] Write test for `DashboardPage` in `apps/frontend/src/features/dashboard/DashboardPage.test.tsx`: mock `useDashboardMetrics` → render → assert 4 stat cards show values; mock error state → assert Alert visible with retry button; mock loading state → assert Skeleton visible
- [ ] T049 [P] [US6] Write test for `SettingsPage` in `apps/frontend/src/features/settings/SettingsPage.test.tsx`: mock `useProfile` → render → assert name + email fields populated (not "John Doe"); mock `useUpdateProfile` mutation → simulate Save click → assert toast called
- [ ] T050 [P] [US6] Write test for `InstanceCard` in `apps/frontend/src/features/instances/InstanceCard.test.tsx`: render with `status: 'connected'` → assert green border present; render with `status: 'disconnected'` → assert red border; assert `DropdownMenu` trigger visible (MoreVertical button)

**Checkpoint**: `go test ./... -cover` ≥ 70% on critical packages. `npm run test:coverage` ≥ 70% on features/. CI pipeline ready to block deploys on failure.

---

## Phase 9: User Story 7 — Workflows com persistência e execução (Priority: P3)

**Goal**: Workflow criado no editor visual → salvo no banco → carregado ao reabrir. Workflow ativo → executado quando evento ocorre.

**Independent Test**: Criar workflow com 3 nós → salvar → recarregar página → workflow recarregado com nós intactos.

- [ ] T051 [P] [US7] Create `apps/api/internal/repositories/workflow_repository.go`: implement `WorkflowRepository` with `Create(*WorkflowDefinition)`, `GetByID(id, accountID)`, `List(accountID)`, `Update(*WorkflowDefinition)`, `Delete(id, accountID)`, `Activate(id, accountID)`, `Deactivate(id, accountID)` — all queries MUST include `account_id` filter (tenant isolation)
- [ ] T052 [P] [US7] Create `apps/api/internal/services/workflow_service.go`: implement `WorkflowService` wrapping `WorkflowRepository`; add business rule: workflow must have at least 1 node to be activated (`is_active=true`); `ExecuteWorkflow(workflowID, triggerEvent, payload)` → create `WorkflowExecution` record with `status:"running"` → eval nodes → update to `status:"completed"` or `status:"failed"` with `error_message`
- [ ] T053 [US7] Create workflow CRUD handlers in `apps/api/internal/handlers/workflow_handler.go`: `ListWorkflows`, `CreateWorkflow`, `GetWorkflow`, `UpdateWorkflow`, `DeleteWorkflow`, `ActivateWorkflow`, `DeactivateWorkflow`; all require `RequireAccountAccess()` and minimum role `agent` for read, `admin` for write; Swagger annotations
- [ ] T054 [US7] Register workflow routes in `apps/api/cmd/server/main.go` inside protected group: `workflows := protected.Group("/accounts/:accountId/workflows", middleware.RequireAccountAccess())` with full CRUD + `PATCH /:id/activate` + `PATCH /:id/deactivate`
- [ ] T055 [P] [US7] Create `apps/frontend/src/features/workflows/hooks/useWorkflows.ts`: `useQuery` calling `GET /accounts/:accountId/workflows`; `useMutation` for create/update/delete with `toast.success/error`; empty state when `workflows.length === 0`
- [ ] T056 [US7] Update `apps/frontend/src/features/workflows/FlowEditor.tsx`: add Save button with `useMutation` → `POST /accounts/:accountId/workflows` with `{name, nodes, edges}`; add Load on mount → `GET /accounts/:accountId/workflows/:id` → `setNodes()/setEdges()` to restore saved graph; add loading skeleton while fetching; add `toast.success("Workflow salvo!")` / `toast.error("Erro ao salvar.")`
- [ ] T057 [US7] Connect `WebhookService` to `WorkflowService` in `apps/api/internal/services/webhook_service.go`: after processing `conversation_created`, find active workflows for the account and call `workflowService.ExecuteWorkflow()` for each one with trigger event `"conversation_created"` and conversation payload

**Checkpoint**: Criar workflow no FlowEditor → salvar → F5 → workflow recarregado. `webhook_executions` table populated after conversation_created webhook.

---

## Phase 10: User Story 8 — Internacionalização completa (Priority: P3)

**Goal**: 100% dos textos visíveis traduzidos em PT-BR e EN-US para todas as páginas.

**Independent Test**: `localStorage.setItem('i18nextLng', 'en-US')` → F5 → zero textos em português visíveis.

- [ ] T058 [P] [US8] Add i18n namespace `dashboard` to `apps/frontend/src/i18n/locales/pt-BR/dashboard.json` and `en-US/dashboard.json`: keys for page title, all 4 stat card titles, descriptions, "Recent Activity", "Activity Chart Coming Soon", error message, retry button
- [ ] T059 [P] [US8] Add i18n namespace `settings` to `apps/frontend/src/i18n/locales/pt-BR/settings.json` and `en-US/settings.json`: keys for page title, all tab labels (Account, Notifications, Security), all form labels (Name, Email, Save Changes), notification switch labels, security section texts
- [ ] T060 [P] [US8] Add i18n namespace `workflows` to `apps/frontend/src/i18n/locales/pt-BR/workflows.json` and `en-US/workflows.json`: keys for page title, FlowEditor save button, empty state message, CTA button, workflow list headers, status labels
- [ ] T061 [US8] Uncomment and implement `useTranslation()` in `apps/frontend/src/features/dashboard/DashboardPage.tsx` (line 1 comment): replace all hardcoded strings with `t('dashboard.xxx')` keys
- [ ] T062 [US8] Uncomment and implement `useTranslation()` in `apps/frontend/src/features/settings/SettingsPage.tsx` (line 1 comment): replace all hardcoded strings with `t('settings.xxx')` keys
- [ ] T063 [US8] Implement `useTranslation()` in `apps/frontend/src/features/workflows/WorkflowsPage.tsx` and `FlowEditor.tsx`: replace all hardcoded strings with `t('workflows.xxx')` keys; verify `apps/frontend/src/i18n.ts` has the new namespaces registered in `ns` array

**Checkpoint**: Toggle idioma → zero textos hardcoded visíveis. Chave ausente → fallback exibe chave (não string vazia).

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: UX gaps found in audit that don't belong to a single user story.

- [ ] T064 [P] Rewrite `apps/frontend/src/features/workflows/KanbanBoard.tsx`: replace hardcoded columns and cards with data from `useBoards(accountId)` + `useStages(boardId)` + `useCards(boardId)` hooks (create these hooks calling existing backend routes); implement `MoreHorizontal` dropdown (already imported but unused) with: Edit card, Move to..., Delete (with AlertDialog confirmation); add empty state (no boards → "Nenhum board criado" + Create Board CTA); add loading skeleton per column
- [ ] T065 [P] Add missing `useBoards`, `useStages`, `useCards`, `useMoveCard` hooks in `apps/frontend/src/features/workflows/hooks/`: each as a React Query `useQuery`/`useMutation` wrapping existing backend routes (`/accounts/:id/boards`, `/boards/:id/stages`, `/boards/:id/cards`, `/boards/:id/cards/:id/move`)
- [ ] T066 [P] Implement drag-and-drop card movement in `apps/frontend/src/features/workflows/KanbanBoard.tsx`: use `dnd-kit` (already installed — `@dnd-kit/core`, `@dnd-kit/sortable`) to implement `DndContext` + `SortableContext` per column; on `onDragEnd` → call `useMoveCard` mutation → `toast.success("Card movido!")` / `toast.error("Erro ao mover card.")`
- [ ] T067 Run all quickstart.md validation scenarios from `specs/001-system-audit/quickstart.md` sections 2-7 and document results; fix any remaining gaps found during validation
- [ ] T068 Validate dark mode for all modified pages: open each page with `<html class="dark">` and verify contrast ratios, no invisible text, semantic colors still meaningful; fix any dark mode regressions in `DashboardPage.tsx`, `SettingsPage.tsx`, `KanbanBoard.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup              → No dependencies. Start immediately.
Phase 2: Foundational       → Requires Phase 1. BLOCKS all user stories.
Phase 3: US1 Dashboard      → Requires Phase 2. (backend stats + auth context)
Phase 4: US2 Auth Refresh   → Requires Phase 2. Can parallel with US1.
Phase 5: US3 Settings       → Requires Phase 2 + Phase 4 (auth/me endpoint).
Phase 6: US4 Webhooks       → Requires Phase 2. Can run after Foundational.
Phase 7: US5 Billing        → Requires Phase 2. Can run after Foundational.
Phase 8: US6 Tests          → Requires Phases 3+4+5+6+7 (test what's implemented).
Phase 9: US7 Workflows      → Requires Phase 2. Can run after Foundational.
Phase 10: US8 i18n          → Requires Phases 3+5+9 (translate final components).
Phase 11: Polish            → Requires all above phases.
```

### User Story Dependencies

```
US1 (Dashboard)     ← depends on: Foundational (T004-T010) complete
US2 (Auth Refresh)  ← depends on: Foundational (T004-T010) complete
US3 (Settings)      ← depends on: US2 (auth/me needs working auth)
US4 (Webhooks)      ← depends on: Foundational (T002 migrations)
US5 (Billing)       ← depends on: Foundational (T002 migrations, T003 config)
US6 (Tests)         ← depends on: US1+US2+US3+US4+US5 (test implemented code)
US7 (Workflows)     ← depends on: Foundational (T009 models)
US8 (i18n)          ← depends on: US1+US3+US7 (translate final UI)
```

### Within Each User Story

```
Models → Repositories → Services → Handlers → Routes → Frontend Hooks → Frontend UI
```

### Parallel Opportunities Per Story

```
US1: T011 (stats service) ‖ T012 (handler) → T013 (route) → T014+T015+T016 (frontend)
US3: T022 (useProfile) ‖ T023 (useUpdateProfile) → T024+T025+T026 (SettingsPage tabs)
US5: T034 (billing repo) ‖ T035 (asaas service) → T036+T037+T038 (handler wiring)
US6: T041 ‖ T042 ‖ T043 ‖ T044 (all backend tests) → T045 (integration)
     T047 ‖ T048 ‖ T049 ‖ T050 (all frontend tests, after T046 vitest config)
US7: T051 (repo) ‖ T052 (service) → T053+T054 (handlers/routes) → T055 ‖ T056 (frontend)
US8: T058 ‖ T059 ‖ T060 (all locale files) → T061 ‖ T062 ‖ T063 (wire into components)
```

---

## Parallel Example: US1 (Dashboard)

```bash
# Once Foundational (T004-T010) is complete, run in parallel:
Task: "T011 — StatsService in apps/api/internal/services/stats_service.go"
Task: "T014 — Update useDashboardMetrics.ts hook"

# Then (after T011 completes):
Task: "T012 — GetAccountStats handler in account_handler.go"

# Then (after T012 completes):
Task: "T013 — Register route in main.go"
Task: "T015 — Update DashboardPage.tsx with error state + real descriptions"
Task: "T016 — Fix hardcoded descriptions in stat cards"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. Complete **Phase 1** (Setup — T001-T003)
2. Complete **Phase 2** (Foundational — T004-T010) — CRITICAL, unblocks everything
3. Complete **Phase 4** (US2 Auth — T017-T021) — auth must work before dashboard data is meaningful
4. Complete **Phase 3** (US1 Dashboard — T011-T016)
5. **STOP and VALIDATE**: Dashboard shows real data, account_id is correct, token refreshes silently
6. Demo/deploy if ready — system is now 100% functional for core flow

### Incremental Delivery

```
Week 1: Phase 1+2+4+3 → Auth + Dashboard real data (MVP)
Week 2: Phase 5+6+7   → Settings + Webhooks + Billing
Week 3: Phase 8+9+10+11 → Tests + Workflows + i18n + Polish
```

### Parallel Team Strategy

```
After Phase 1+2 complete:
  Backend dev A:  Phase 3 (T011-T013) + Phase 6 (T028-T033)
  Backend dev B:  Phase 7 (T034-T040) + Phase 9 (T051-T054)
  Frontend dev:   Phase 4 (T017-T020) → Phase 3 UI (T014-T016) → Phase 5 UI (T022-T026)
```

---

## Notes

- **[P]** tasks touch different files — no merge conflicts when run in parallel
- **account_id** MUST come from `AuthContext` in every frontend hook after T007
- **Never log** `cpf_cnpj`, `api_key`, `jwt_secret` — use `SanitizeForAudit()` before any log.Printf
- **Every catch/error** in frontend mutations must have at minimum `toast.error()` — no silent failures
- **Commit after each task group** (one commit per checkpoint)
- **Stop at each checkpoint** to validate the story independently before proceeding
- **test:coverage** script added in T046 — run after each Phase 3+ to watch coverage grow
