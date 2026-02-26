# Research: WhatPro Hub — Auditoria e Roadmap de Completude

**Phase**: 0 — Pre-design research
**Branch**: `001-system-audit`
**Date**: 2026-02-19

---

## Summary of Findings

All NEEDS CLARIFICATION items are resolved below. Findings are drawn from direct
codebase audit (`apps/frontend/src`, `apps/api/`).

---

## RES-001: Estado atual do frontend — o que já existe vs o que falta

**Decision**: A maior parte da camada visual do frontend **já está polida** para
as features de `Instances` e `InternalChat`. Os gaps críticos estão no `Dashboard`,
`Settings`, `Auth` e `Workflows/Kanban`.

**Rationale**: Auditoria direta de todos os arquivos `.tsx` em `apps/frontend/src/features/`.

**Findings por feature**:

| Feature | Skeleton | Empty State | Error State | Toast | Semantic Colors | Micro-interactions | Verdict |
|---------|----------|-------------|-------------|-------|-----------------|--------------------|---------|
| Instances | ✅ InstanceCardSkeleton | ✅ 3 variants | ✅ ServerCrash+retry | ✅ em hooks | ✅ emerald/red/amber | ✅ hover+translate | **Pronto** |
| InternalChat | ✅ spinner | ✅ FeatureDisabledState | ✅ errorCheck | ✅ | ❌ absent | ✅ animate-spin | **Quase pronto** |
| LoginPage | ✅ Loader2 | N/A | ✅ AlertCircle | N/A | ✅ destructive | ✅ button disabled | **Pronto** |
| Dashboard | ✅ DashboardSkeleton | ❌ ausente | ❌ ausente | ❌ | ⚠️ parcial | ✅ hover cards | **Gap crítico** |
| Settings | ❌ ausente | N/A | ❌ ausente | ❌ | ❌ ausente | ❌ botões disabled | **Stub completo** |
| KanbanBoard | ❌ ausente | ❌ ausente | ❌ ausente | N/A | ❌ ausente | ⚠️ cursor-grab | **Gap crítico** |
| Workflows | ❌ ausente | ❌ ausente | ❌ ausente | N/A | ❌ ausente | ✅ XYFlow default | **Protótipo** |

---

## RES-002: Hardcoded account_id — escopo e impacto

**Decision**: O `account_id` está fixado em `1` em `apps/frontend/src/features/instances/services/instancesService.ts:38`.

**Evidence**:
```typescript
const ACCOUNT_ID = 1 // Hardcoded for testing - TODO: get from auth context
```

**Rationale**: O interceptor de auth em `apps/frontend/src/services/api.ts` está
**completamente comentado** (linhas 13–17). O handler de 401 (redirect to login)
também está comentado (linha 33). O backend tem JWT ativo em rotas protegidas
(`protected.Use(middleware.JWT(...))` em `main.go:207`), mas as rotas de providers
são **públicas** sem JWT (main.go:195).

**Impact**: Todos os usuários acessam dados da conta 1. Segurança zero (nenhum
token enviado nas requisições).

**Fix required**:
1. Descomentar e implementar o interceptor de request para enviar JWT
2. Implementar interceptor de response para refresh automático antes de expirar
3. Ler `account_id` do contexto JWT decodificado (ou do endpoint `/api/v1/auth/me`)
4. Passar `account_id` dinamicamente para `instancesService`

---

## RES-003: Endpoint de stats — o que o backend tem/falta

**Decision**: O endpoint `/api/v1/accounts/:id/stats` **não existe** no backend.

**Evidence**:
- `main.go` lista todas as rotas — nenhuma é `/accounts/:id/stats`
- `useDashboardMetrics.ts:29-43` confirma: `// Mock data for missing API endpoints`
- Os dados fictícios são: `activeMessages: 2350`, `activeClients: 12234`, `workflowsTriggered: 573`
- As `recentActivity` são hardcoded com nomes ("Olivia Martin", etc.)

**What needs to be built (backend)**:
```
GET /api/v1/accounts/:id/stats
→ { active_instances, messages_today, active_clients, workflows_triggered }
```
Queries necessárias (PostgreSQL):
- `SELECT COUNT(*) FROM providers WHERE account_id=? AND status='connected'`
- `SELECT COUNT(*) FROM messages WHERE account_id=? AND created_at::date=now()::date`
- `SELECT COUNT(DISTINCT contact_id) FROM conversations WHERE account_id=?`
- `SELECT COUNT(*) FROM workflow_executions WHERE account_id=? AND DATE(created_at)=CURRENT_DATE`

---

## RES-004: Token refresh — estado atual

**Decision**: O backend tem o endpoint `POST /api/v1/auth/refresh` (main.go:184),
mas o frontend **não o usa**. O interceptor de auth está comentado.

**Frontend fix**: Implementar Axios response interceptor para:
1. Detectar 401
2. Chamar `POST /auth/refresh` com o refresh token (cookie HTTPOnly)
3. Retry da request original com novo access token
4. Se refresh também falhar → redirect para `/login` com `toast.error()`

**Pattern**: React Query + Axios interceptor (sem biblioteca extra necessária,
seguindo a restrição do usuário de não adicionar dependências sem justificar).

---

## RES-005: Settings Page — dados do usuário

**Decision**: O endpoint `GET /api/v1/auth/me` existe (main.go:215) e retorna
os dados do usuário autenticado. A página de Settings deve usar esse endpoint.

**For profile update**: Precisará de `PUT /api/v1/accounts/:id/users/:userId`
(main.go:244 — já existe, requer role `admin` ou `super_admin`).

**UX gaps to fix in SettingsPage.tsx**:
- Remover `defaultValue="John Doe"` e `defaultValue="john@example.com"`
- Remover `disabled` dos inputs e do botão Save
- Adicionar `useQuery` para buscar dados reais
- Adicionar `useMutation` para salvar e exibir `toast.success()`/`toast.error()`
- Adicionar loading skeleton para o estado de carregamento
- Substituir "Coming Soon" por implementação real de notificações (Switch toggle)

---

## RES-006: Design System — o que já existe

**Decision**: O projeto já tem um design system **completo** com Shadcn/UI.

**Evidence** (audit de `apps/frontend/src/components/ui/`):
- Componentes disponíveis: `alert`, `avatar`, `badge`, `breadcrumb`, `button`,
  `card`, `dialog`, `dropdown-menu`, `input`, `label`, `resizable`, `scroll-area`,
  `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `switch`, `tabs`, `tooltip`
- Sonner (toast) configurado com `richColors` e `top-right` em `main.tsx:83`
- Radix Colors: Slate (texto/background), Teal (brand/accent)
- Dark mode: class-based ThemeProvider com toggle no header
- Animações customizadas: `fade-in-up`, `card-select`, `loader-pulse`, `wiggle`
- Semantic tokens: `emerald` (success), `red` (error/destructive), `amber` (warning)

**No new dependencies needed** para UX polish. Apenas usar o que já existe.

---

## RES-007: KanbanBoard — estado atual

**Decision**: O KanbanBoard (`features/workflows/KanbanBoard.tsx`) usa dados
100% hardcoded. O backend **já tem** APIs de boards, stages e cards (main.go:247-269).

**Hardcoded evidence**:
- Colunas fixas: "Lead", "Proposta", "Negociação", "Fechado"
- Cards fixos: 3 cards de exemplo
- `MoreHorizontal` icon importado mas nunca renderizado
- `dnd-kit` instalado mas drag-drop não implementado no KanbanBoard

**Backend routes available**:
- `GET /api/v1/accounts/:id/boards` → listar boards
- `GET /api/v1/boards/:boardId/stages` → listar colunas
- `GET /api/v1/boards/:boardId/cards` → listar cards
- `POST /api/v1/boards/:boardId/cards/:id/move` → mover card

---

## RES-008: i18n — estado atual

**Decision**: Apenas a feature de `Instances` tem tradução completa. As páginas
`Dashboard`, `Settings`, `Workflows`, `KanbanBoard` têm textos hardcoded em inglês.

**Evidence**:
- `src/i18n.ts` configurado com `i18next`
- `SettingsPage.tsx:1` — `useTranslation` está **comentado** (`// import { useTranslation }`)
- `DashboardPage.tsx:1` — mesmo padrão: comentado e não usado
- Faltam namespaces de tradução para: dashboard, settings, workflows, kanban

---

## RES-009: Webhook Chatwoot — estado atual

**Decision**: O handler `HandleChatwootWebhook` existe em `handlers` mas é um
**stub sem lógica real** (`TODO` no código original).

**Fix required**: Implementar processamento de eventos no handler:
- `conversation_created` → criar card no board via `cardRepository.Create()`
- `conversation_resolved` → mover card para stage final via `cardRepository.Move()`
- `conversation_updated` → atualizar dados do card
- `message_created` → incrementar contador de mensagens

---

## RES-010: GatewayService nil dependency

**Decision**: O `GatewayService` recebe `ProviderRepository = nil`, causando
panic em runtime ao chamar métodos do service.

**Fix**: Em `handlers/handler.go` (ou onde `GatewayService` é instanciado),
injetar corretamente o `ProviderRepository` inicializado com a conexão `db`.

---

## Alternatives Considered

| Decision Point | Chosen | Alternative | Why Rejected |
|----------------|--------|-------------|--------------|
| Token storage | HTTPOnly cookie para refresh + memory para access | localStorage | XSS vulnerability |
| Stats data | New dedicated endpoint `/accounts/:id/stats` | Cálculo no frontend com múltiplas queries | N+1 problem, mais lento |
| i18n approach | Estender namespaces existentes | Rewrite completo | Desnecessário, base já funciona |
| KanbanBoard data | Hooks com React Query para real API | Mock service | Dados ficticios em produção |
| Settings fetch | `useQuery` com `/auth/me` | Redux/Zustand | Auth context já existe, simpler |
