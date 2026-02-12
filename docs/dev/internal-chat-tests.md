# Whatpro Hub — Testes para Chat Interno

**Data:** 2026-02-08

## 1) Testes de Segurança (P0)
**Status:** já podem ser executados no backend atual (MVP implementado).
1. **IDOR cross‑tenant**
   - Criar room no tenant A
   - Tentar acessar no tenant B → **403/404**

2. **Membership enforcement**
   - Usuário fora do room tenta listar mensagens → **403**

3. **RBAC**
   - Agent tenta adicionar membro → **403**
   - Admin consegue adicionar → **200**

4. **Rate limit**
   - Explodir mensagens em loop → **429**

## 2) Testes Funcionais (MVP)
**Status:** já podem ser executados no backend atual (MVP implementado).
1. **CRUD Room**
2. **Adicionar/remover membros**
3. **Enviar mensagem**
4. **Read/Unread**

## 3) Testes de Auditoria
**Status:** já podem ser executados no backend atual (MVP implementado).
- Criar room gera audit log
- Adicionar membro gera audit log
- Remover membro gera audit log

## 4) Observabilidade
**Status:** depende de logs JSON + request_id (ainda pendente).
- Cada request possui equest_id
- Logs JSON gerados

## 5) Testes Real‑time (P2)
**Status:** pendente (realtime não implementado).
- Message delivery via WebSocket
- Presence updates
