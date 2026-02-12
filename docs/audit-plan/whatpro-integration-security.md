# Whatpro Hub — Documento Consolidado de Integração + Segurança

**Data:** 2026-02-08  
**Escopo:** Backend + Integração Chatwoot (Dashboard Script + Platform App) + Segurança + Infra  
**Fontes:**
- docs/audit-plan/Chatwoot Integration Audit.md
- docs/dev/backend-feature-map.md
- pps/api/cmd/server/main.go
- pps/api/internal/handlers/*
- pps/api/internal/models/*
- pps/api/internal/services/*

---

## 1) Executive Summary

**Status geral do backend:** ~65% concluído em relação ao PRD/Blueprint. A base é sólida, mas há lacunas críticas que **bloqueiam produção**.  
**Integração Chatwoot:** **parcial**. O sistema atual permite proxy e webhooks básicos, mas **não possui** instance tokens, inbox sync e segurança de embed.

**Bloqueadores P0 (produção):**
- Tenant isolation incompleta em queries
- Refresh token/rotacionamento + revogação de sessão inexistentes
- Security headers ausentes (CSP, HSTS, X-Frame-Options, etc.)
- Instance tokens ausentes
- Inbox model/sync ausente
- postMessage sem validação de origem

**Linha do tempo estimada (1 dev full-time):** 4–6 semanas para produção‑ready (chat interno MVP no backend já existe; faltam UI/realtime).

---

## 2) Mapa Consolidado (Backend + Integração)

### 2.1 Auth / IAM
**O que existe**
- JWT via Chatwoot SSO (/api/v1/auth/sso)
- Session model em migration (Session)
- RBAC com RequireRole e RequireAccountAccess

**Gaps críticos**
- Refresh token não implementado (/auth/refresh retorna Not Implemented)
- Logout não revoga sessão (stub)
- Sessions não ligadas ao JWT por sid
- API Keys sem CRUD e sem enforcement de scopes

### 2.2 Tenant Isolation
**O que existe**
- Middleware RequireAccountAccess
- Rotas account‑scoped

**Gaps críticos**
- Repositories sem ccount_id em todas as queries
- Falta de testes anti‑IDOR automatizados

### 2.3 Entitlements / Quotas
**O que existe**
- Model AccountEntitlements
- EntitlementsService.CanCreateResource

**Gaps**
- Enforcement incompleto (users/teams/inboxes/boards)
- Metering não ativo (TrackActivity stub)

### 2.4 Providers / Instâncias
**O que existe**
- CRUD providers completo
- Campos: instance_name, health_check_url, 	ype, ase_url

**Gaps**
- ProviderInstance separado não existe
- Quota por tipo/instância ausente

### 2.5 Inboxes (Chatwoot)
**O que existe**
- Não existe modelo/endpoint de inbox

**Gaps**
- Sync de inboxes não implementado
- Quota MaxInboxes não aplicada

### 2.6 Billing / Asaas
**O que existe**
- Models de Plan/Subscription/Transaction
- Endpoint /billing/subscribe
- Webhook Asaas

**Gaps**
- SubscribeAccount usa ccount_id e user_id mockados
- Status real de pagamento por tenant não exposto
- Não há enforcement de entitlements baseado em status

### 2.7 Chatwoot Webhooks / Kanban
**O que existe**
- Webhook handler para eventos Chatwoot
- CRUD Kanban (Boards/Stages/Cards)

**Gaps**
- Webhooks só registram/logam (TODOs para criar/mover cards)
- Métricas de SLA (lead time, cycle time) ausentes

### 2.8 Observabilidade e Segurança
**O que existe**
- Health checks
- CORS básico

**Gaps críticos**
- Security headers ausentes
- Logs sem request_id e sem JSON
- Tracing inexistente
- Métricas RED/USE ausentes

---

## 3) Integração Chatwoot — Script + Platform App

### 3.1 Dashboard Script (fluxo atual)
**Padrão observado no script de exemplo:**
- Lê cookie Chatwoot (cw_d_session_info)
- Envia via postMessage com 	argetOrigin='*'
- Abre iframe com URL externa (kanban)

**Riscos diretos:**
- Exposição de credenciais em JS
- postMessage sem validação de origin
- Sem instance token dedicado

### 3.2 Platform App (fluxo ideal)
**Necessário para governança e segurança:**
- Endpoint para pp-config
- Webhook assinado para eventos de instalação
- Emissão de instance token de curto TTL

### 3.3 Fluxo Seguro Recomendado
1. Script do Chatwoot solicita token no Hub
2. Hub emite instance_token com TTL curto e scopes mínimos
3. Script envia token ao iframe com **origin allowlist**
4. Iframe consome token e chama API Hub

### 3.4 Endpoints novos obrigatórios
- POST /api/v1/instance-tokens
- GET /api/v1/instance-tokens/validate
- GET /api/v1/platform-app/config
- POST /api/v1/platform-app/events
- GET /api/v1/accounts/:id/inboxes
- POST /api/v1/accounts/:id/inboxes/sync

---

## 4) Riscos e Lacunas (Severidade)

### P0 — Bloqueadores
- Instance Tokens ausentes
- Inbox model/sync ausente
- Refresh token + logout sem revogação
- postMessage sem validação de origin
- CSP / frame-ancestors inexistente
- Tenant isolation incompleto em queries

### P1 — Pré‑produção
- Entitlements enforcement total
- Logs estruturados + request_id
- Métricas RED/USE
- Observabilidade básica

### P2 — Evolução
- Internal chat próprio (se desejado)
- Feature flags completas por tenant

---

## 5) Checklist de Evolução Segura (Prioridade)

### Fase 1 — Segurança de Embed (P0)
1. Criar InstanceToken (model + migration)
2. Implementar POST /instance-tokens
3. Validar scopes + TTL curto
4. postMessage com allowlist de origin
5. CSP + frame-ancestors

### Fase 2 — Inbox Sync (P0)
6. Criar model Inbox
7. Implementar sync via Chatwoot API
8. Aplicar MaxInboxes em entitlements

### Fase 3 — IAM completo (P0)
9. Refresh token rotacionado
10. Session revoke/logout real
11. sid no JWT
12. API Key hashing + scopes enforcement

### Fase 4 — Observabilidade (P1)
13. Logs JSON + request_id
14. Métricas Prometheus
15. Tracing OpenTelemetry

### Fase 5 — Kanban + Webhooks (P1)
16. Webhooks completos (create/move cards)
17. Métricas SLA

---

## 6) Regras e Skills Recomendadas

### Skills do Antigravity Kit
- vulnerability-scanner
- database-design
- api-patterns
- lint-and-validate
- testing-patterns
- deployment-procedures

### Regras de governança
- PR sem merge sem teste IDOR cross‑tenant
- Secret scanning obrigatório
- Entitlements check antes de qualquer Create
- Webhook signature sempre validada

---

## 7) Chat Interno (Novo Módulo) + Integração Nativa com Chatwoot

**Objetivo:** adicionar chat interno próprio no Whatpro Hub (agentes/equipes) e **integrar nativamente ao Chatwoot**, mantendo **layout/experiência consistente** para evitar estranheza.

### 7.1 Chat Interno — Escopo (MVP)
- DMs e Rooms por equipe
- Mensagens persistidas
- Read/unread
- RBAC e tenant isolation
- Auditoria obrigatória

### 7.2 Integração Nativa com Chatwoot (layout consistente)
- **Entrada única pelo Chatwoot:** acesso ao chat interno via menu/iframe dentro do Chatwoot (Platform App + Dashboard Script seguro)\n
- **UI/UX consistente:** estilo e tipografia alinhados ao tema do Chatwoot (cores, espaçamento, componentes)\n
- **Sem duplicar experiência:** o Whatpro Hub deve parecer “nativo” ao Chatwoot (mesmo layout, sem quebras de contexto)\n

### 7.3 Endpoints mínimos para Chat Interno
- `GET /api/v1/accounts/:accountId/chat/rooms`
- `POST /api/v1/accounts/:accountId/chat/rooms`
- `GET /api/v1/accounts/:accountId/chat/rooms/:roomId`
- `GET /api/v1/accounts/:accountId/chat/rooms/:roomId/messages`
- `POST /api/v1/accounts/:accountId/chat/rooms/:roomId/messages`
- `POST /api/v1/accounts/:accountId/chat/rooms/:roomId/read`
- `POST /api/v1/accounts/:accountId/chat/rooms/:roomId/members`
- `DELETE /api/v1/accounts/:accountId/chat/rooms/:roomId/members/:userId`

### 7.4 Requisitos de Segurança
- Instance token dedicado (TTL curto + scopes mínimos)
- postMessage com allowlist de origin
- CSP `frame-ancestors` limitado ao Chatwoot
- Audit logs em criação/remoção de membros, mensagens e salas

### 7.5 Compatibilidade Visual (layout)
- UI do Whatpro Hub deve reutilizar:\n
  - cores neutras do Chatwoot\n
  - tipografia e spacing base\n
  - padrões de cards, headers e sidebar\n
- Objetivo: “parecer integrado”, não “aplicativo externo”

---

## 8) Conclusão

O backend do Whatpro Hub está **funcional**, mas **não pronto para produção**. A integração com Chatwoot via Script + Platform App **exige** instance tokens, inbox sync, security headers e isolamento completo de tenant. A execução do checklist acima garante evolução com segurança real.
