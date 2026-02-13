# Internal Chat Audit — Whatpro Hub

**Data:** 2026-02-08  
**Escopo:** Chat interno (agentes/equipes)  
**Fontes consolidadas:**
- `docs/dev/internal-chat-plan.md`
- `docs/dev/internal-chat-backlog.md`
- `docs/dev/internal-chat-tests.md`
- `apps/api/internal/models/chat_models.go`
- `apps/api/internal/migrations/chat.go`
- `apps/api/internal/services/chat_service.go`
- `apps/api/internal/repositories/chat_repository.go`
- `apps/api/internal/handlers/chat_handler.go`
- `apps/api/cmd/server/main.go`

---

## 📊 Executive Summary
O **chat interno já existe no backend (MVP)** com modelos, migrations, services, repositories e handlers. Porém **não há UI/realtime**.

**Status Geral**
- ✅ Backend MVP: implementado
- ❌ Realtime: ausente
- ❌ Frontend/UI: ausente
- ⚠️ Dependências: tenant isolation e IAM precisam estar 100%

---

## 🔎 Evidências no codebase (MVP)
Encontrado:
- Modelos: `apps/api/internal/models/chat_models.go`
- Migrations: `apps/api/internal/migrations/chat.go`
- Service: `apps/api/internal/services/chat_service.go`
- Repository: `apps/api/internal/repositories/chat_repository.go`
- Handlers: `apps/api/internal/handlers/chat_handler.go`
- Rotas: `apps/api/cmd/server/main.go`

Pendências:
- WebSocket/SSE para realtime
- UI/components do chat interno
- Notificações in‑app

---

## ✅ Escopo do Chat Interno (MVP)

### Funcionalidades
- Conversas **1:1 (DM)** e **salas de equipe**
- Mensagens persistidas
- Read/unread
- Auditoria de ações críticas
- RBAC por tenant

### Não substitui Chatwoot
O módulo é **interno** (agentes/equipes). Chatwoot continua como backend de conversas externas.

---

## 🧱 Modelo de Dados

### internal_chat_rooms
- id (UUID)
- account_id
- type (dm/room)
- name (room)
- created_by
- created_at, updated_at

### internal_chat_members
- room_id
- user_id
- role (owner/moderator/member)
- last_read_at

### internal_chat_messages
- id
- room_id
- account_id
- sender_id
- content
- message_type (text/system/mention)
- created_at, edited_at, deleted_at

### internal_chat_audit
- id
- account_id
- actor_id
- action
- target_id
- metadata
- created_at

---

## 🧩 Endpoints (API v1)

### Rooms
- GET /api/v1/accounts/:accountId/chat/rooms
- POST /api/v1/accounts/:accountId/chat/rooms
- GET /api/v1/accounts/:accountId/chat/rooms/:roomId

### Members
- POST /api/v1/accounts/:accountId/chat/rooms/:roomId/members
- DELETE /api/v1/accounts/:accountId/chat/rooms/:roomId/members/:userId

### Messages
- GET /api/v1/accounts/:accountId/chat/rooms/:roomId/messages
- POST /api/v1/accounts/:accountId/chat/rooms/:roomId/messages
- PATCH /api/v1/accounts/:accountId/chat/messages/:messageId (opcional)
- DELETE /api/v1/accounts/:accountId/chat/messages/:messageId (soft delete)

### Read/Unread
- POST /api/v1/accounts/:accountId/chat/rooms/:roomId/read

---

## 📑 Contratos de API (mínimos)

### Criar Room
**POST** `/api/v1/accounts/:accountId/chat/rooms`
```json
{
  "type": "dm|room",
  "name": "Suporte Interno",
  "member_ids": [12, 34]
}
```
**Response**
```json
{
  "id": "uuid",
  "type": "room",
  "name": "Suporte Interno",
  "created_by": 12,
  "created_at": "2026-02-08T12:00:00Z"
}
```

### Enviar Mensagem
**POST** `/api/v1/accounts/:accountId/chat/rooms/:roomId/messages`
```json
{
  "content": "Status do cliente atualizado.",
  "message_type": "text"
}
```
**Response**
```json
{
  "id": "uuid",
  "room_id": "uuid",
  "sender_id": 12,
  "content": "Status do cliente atualizado.",
  "created_at": "2026-02-08T12:01:00Z"
}
```

### Listar Mensagens
**GET** `/api/v1/accounts/:accountId/chat/rooms/:roomId/messages?limit=50&cursor=...`
```json
{
  "items": [],
  "next_cursor": "..."
}
```

---

## 🗃️ Migrations e Índices (mínimos)
- internal_chat_rooms
  - índice: (account_id, type)
  - índice: (created_by)
- internal_chat_members
  - índice único: (room_id, user_id)
  - índice: (user_id, last_read_at)
- internal_chat_messages
  - índice: (room_id, created_at DESC)
  - índice: (account_id, created_at DESC)
- internal_chat_audit
  - índice: (account_id, created_at DESC)
  - índice: (actor_id)

---

## 🔐 Segurança e Governança (P0)
- Tenant isolation obrigatório em todas queries
- RBAC: admin/supervisor gerenciam salas e membros
- Rate limit por user e tenant
- Auditoria obrigatória (criar sala, membros, delete)
- Logs JSON com request_id

---

## 📈 Observabilidade
- Logs estruturados (JSON) por request
- Métricas: mensagens/min, salas criadas/dia

---

## ✅ Checklist de Execução

### P0 — MVP seguro
1. Migrations dos 4 modelos principais
2. CRUD de Rooms
3. Mensagens (create + list)
4. Tenant isolation em todas queries
5. RBAC + audit logs
6. Rate limiting

### P1 — UX avançada
7. Editar mensagem
8. Soft delete
9. Read/unread otimizado
10. UI de auditoria (admin)

### P2 — Real‑time
11. WebSocket/SSE
12. Presence
13. Notificações in‑app

---

## ✅ Testes mínimos (P0)
- IDOR cross‑tenant
- Membership enforcement
- RBAC (admin vs agent)
- Rate limit
- Auditoria (room/member/delete)

---

## Dependências
- Tenant isolation completo no backend
- Instance tokens + CSP para embed seguro
- Entitlements enforcement

---

## ✅ Conclusão
O chat interno **já existe no backend (MVP)**, mas **falta UI e realtime**. Próxima etapa é conectar frontend e realtime mantendo governança e isolamento de tenant.
