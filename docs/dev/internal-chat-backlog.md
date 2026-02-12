# Whatpro Hub — Backlog do Chat Interno (MVP → Real‑Time)

**Data:** 2026-02-08  
**Escopo:** Chat interno para agentes/equipes com integração nativa Chatwoot

## P0 — MVP seguro (produção interna)
1. **Models + Migrations** ✅ (backend já implementado)
   - internal_chat_rooms
   - internal_chat_members
   - internal_chat_messages
   - internal_chat_audit
   - Aceite: migrations aplicam sem erro e criam índices por ccount_id.

2. **Rooms CRUD (mínimo)** ✅ (backend já implementado)
   - GET /accounts/:id/chat/rooms
   - POST /accounts/:id/chat/rooms
   - GET /accounts/:id/chat/rooms/:roomId
   - Aceite: apenas membros do tenant acessam.

3. **Membership** ✅ (backend já implementado)
   - POST /rooms/:roomId/members
   - DELETE /rooms/:roomId/members/:userId
   - Aceite: admin/supervisor gerenciam; audit obrigatório.

4. **Mensagens** ✅ (backend já implementado)
   - POST /rooms/:roomId/messages
   - GET /rooms/:roomId/messages
   - Aceite: mensagens persistem e respeitam tenant isolation.

5. **Read/Unread** ✅ (backend já implementado)
   - POST /rooms/:roomId/read
   - Aceite: last_read_at atualiza corretamente.

6. **Segurança base** ⚠️ (parcial; depende de tenant isolation global)
   - Tenant isolation em todas queries
   - RBAC/RequireRole
   - Logs JSON + request_id
   - Rate limit por user

## P1 — UX e administração
7. **Soft delete / edit message**
8. **Pagination / infinite scroll**
9. **Search básico por texto**
10. **Audit UI (admin)**

## P2 — Real‑time
11. **WebSocket/SSE**
12. **Presence**
13. **Notificações in‑app**

## P3 — Integração avançada
14. **Bridge com Chatwoot** (notes/tickets)
15. **Feature flags por tenant**

---

## Dependências
- Tenant isolation completo
- Instance tokens + CSP para embed no Chatwoot
- Entitlements enforcement
