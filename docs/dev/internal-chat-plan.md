# Whatpro Hub — Plano Completo de Chat Interno (Agentes & Equipes)

**Data:** 2026-02-08  
**Status:** MVP backend já implementado; plano cobre UI/realtime/hardening  
**Objetivo:** Consolidar o chat interno do Whatpro Hub (já existente no backend) e completar UI, realtime, segurança e observabilidade.  

> **Nota sobre agentes:** Este plano foi estruturado para incorporar revisões de **Backend Specialist**, **Database Architect**, **Security Auditor** e **DevOps Engineer** (papéis da suíte de agentes), garantindo cobertura completa de arquitetura, dados, segurança e operação.

---

## 1) Visão Geral

O Whatpro Hub já **possui o MVP do chat interno no backend**. Para permitir comunicação interna completa entre agentes e equipes, precisamos finalizar:

- **Conversas internas** (1:1 e em salas de equipe)
- **Mensagens persistidas** no banco
- **Auditoria** de ações críticas
- **RBAC** e escopo por tenant
- **Observabilidade** (logs, métricas)

Este módulo não substitui Chatwoot (suporte ao cliente). É um canal **interno** da operação.

---

## 2) Requisitos Funcionais (MVP)

### 2.1 Conversas
- Criar conversa **direta (DM)** entre dois usuários
- Criar conversa em **sala (room)** para equipe/grupo
- Listar conversas do usuário
- Buscar conversa por ID

### 2.2 Mensagens
- Enviar mensagem de texto
- Editar mensagem (opcional)
- Apagar mensagem (soft delete)
- Histórico completo por conversa

### 2.3 Membros e permissões
- Adicionar/remover membros de sala
- Owner/Moderator/Member
- Admin/Supervisor gerencia membros

### 2.4 Read/Unread
- Marcar conversa como lida
- Contador de não lidas por usuário

---

## 3) Requisitos Não‑Funcionais (P0)

- **Multi‑tenant isolation total** (todas queries com ccount_id)
- **RBAC** (super_admin/admin/supervisor/agent/viewer)
- **Rate limit** por user e tenant
- **Auditoria obrigatória** para ações críticas
- **Logs estruturados** com equest_id

---

## 4) Modelo de Dados (Schema proposto)

### 4.1 internal_chat_rooms
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | UUID | PK |
| account_id | int | Tenant |
| type | enum (dm/room) | tipo de conversa |
| name | string | nome (apenas rooms) |
| created_by | int | user_id |
| created_at | timestamp | |
| updated_at | timestamp | |

### 4.2 internal_chat_members
| Campo | Tipo | Descrição |
|------|------|-----------|
| room_id | UUID | FK |
| user_id | int | FK |
| role | enum (owner/moderator/member) | |
| last_read_at | timestamp | |

### 4.3 internal_chat_messages
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | UUID | PK |
| room_id | UUID | FK |
| account_id | int | tenant |
| sender_id | int | user_id |
| content | text | mensagem |
| message_type | enum (text/system/mention) | |
| created_at | timestamp | |
| edited_at | timestamp | |
| deleted_at | timestamp | |

### 4.4 internal_chat_audit
| Campo | Tipo | Descrição |
|------|------|-----------|
| id | UUID | PK |
| account_id | int | tenant |
| actor_id | int | user_id |
| action | string | ex: room_created |
| metadata | jsonb | payload |
| created_at | timestamp | |

---

## 5) Endpoints (API v1)

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

### Read Status
- POST /api/v1/accounts/:accountId/chat/rooms/:roomId/read

---

## 6) Segurança e Governança

- **Tenant isolation**: todas queries obrigatoriamente com ccount_id.
- **RBAC**: somente admin/supervisor podem criar rooms para equipes.
- **Rate limit**: mensagens por minuto por user.
- **Auditoria**: criar sala, adicionar/remover membro, deletar mensagem.

---

## 7) Observabilidade

**Logs (JSON):**
- equest_id, ccount_id, user_id, ction, latency

**Métricas básicas:**
- mensagens/minuto
- usuários ativos/dia
- salas criadas/dia

---

## 8) Real‑time (Fase 2)

- WebSocket ou SSE
- Eventos:
  - message.created
  - oom.updated
  - presence.changed

---

## 9) Checklist de Execução (Prioridade)

### P0 — MVP seguro
1. Criar migrations dos 4 modelos principais
2. Implementar CRUD de Rooms
3. Implementar mensagens (create + list)
4. Garantir tenant isolation em todas queries
5. RBAC + audit logs
6. Rate limiting

### P1 — UX avançada
7. Editar mensagem
8. Soft delete
9. Read/unread otimizado

### P2 — Real‑time
10. WebSocket + presence

---

## 10) Critérios de Aceite

- Usuário de tenant A **não acessa** mensagens do tenant B
- Admin cria sala e adiciona membros com audit
- Mensagens persistidas com ordem correta
- Rate limit bloqueia spam
- Logs possuem equest_id

---

## 11) Skills/Rules recomendadas (Governança)

### Skills (Antigravity Kit)
- database-design (modelagem e constraints)
- pi-patterns (contratos REST)
- 	esting-patterns (testes unit e integration)
- ulnerability-scanner (segurança)
- lint-and-validate

### Rules
- Sem merge sem teste IDOR
- Sem merge sem audit logging em ações críticas
- Scopes + tenant isolation obrigatórios

---

## 12) Integração futura com Chatwoot (opcional)

- Ligar conversas internas a tickets Chatwoot
- Webhook de status interno → Chatwoot notes

---

**Conclusão:** este plano adiciona o **chat interno** que falta no Whatpro Hub com segurança e governança. Ele não conflita com Chatwoot, mas complementa o fluxo interno.
