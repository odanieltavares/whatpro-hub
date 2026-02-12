# Whatpro Hub — Roadmap de Execução (Backend + Chatwoot + Chat Interno)

**Data:** 2026-02-08  
**Objetivo:** Sequenciar execução dos P0/P1/P2 com dependências claras.

---

## ✅ Marco 0 — Pré‑requisitos (Semana 0)
- Confirmar ambiente (dev/prod) com CI básico
- Criar baseline de testes: health + tenant isolation (já existem)
- Validar secrets e variáveis críticas

---

## ✅ Marco 1 — Segurança P0 (Semanas 1–2)
**Objetivo:** bloquear vazamentos cross‑tenant e hardening mínimo.

1. **Tenant isolation universal**
   - Corrigir queries sem ccount_id (providers, kanban, checklist)
   - Garantir RequireAccountAccess em todas rotas account‑scoped
   - Testes IDOR cross‑tenant

2. **Auth & Sessions**
   - Refresh token rotation
   - Logout com revogação real
   - sid no JWT

3. **Security headers**
   - CSP, HSTS, XFO, NoSniff, Referrer‑Policy
   - Testar via curl + middleware

**Saída:** backend seguro para dev/piloto interno.

---

## ✅ Marco 2 — Integração Chatwoot (Semanas 3–4)
**Objetivo:** embed seguro e sync de recursos Chatwoot.

1. **Instance Tokens (P0)**
   - Modelo + endpoint /instance-tokens
   - Middleware de validação
   - TTL curto + scopes

2. **Inbox Model/Sync (P0)**
   - Modelo Inbox
   - Sync via Chatwoot API
   - Endpoints /accounts/:id/inboxes

3. **postMessage Security + CSP**
   - Origin allowlist
   - rame-ancestors restrito

**Saída:** integração Chatwoot funcional e segura.

---

## ✅ Marco 3 — Entitlements + Observabilidade (Semanas 5–6)
**Objetivo:** SaaS pronto para controle de planos.

1. **Entitlements enforcement completo**
   - Agents, Teams, Providers, Inboxes, Boards
2. **Metering ativo**
   - usage_daily populado
   - Endpoints de métricas
3. **Logs JSON + request_id**
4. **Métricas Prometheus**

---

## ✅ Marco 4 — Chat Interno (Semanas 7–8)
**Objetivo:** canal interno de agentes/equipes.

1. **Migrations + Models**
2. **CRUD Rooms + Messages**
3. **RBAC + Audit**
4. **Read/Unread**
5. **Rate limit**

---

## ✅ Marco 5 — Real‑time + Maturidade (Semanas 9+)
- WebSocket/SSE
- Presence
- Notificações in‑app
- DevSecOps completo (SAST, secret scan, trivy)

---

## ✅ Dependências Críticas
- Tenant isolation → pré‑requisito de tudo
- Instance tokens → pré‑requisito de embed
- Entitlements → pré‑requisito de cobrança/planos

---

## ✅ Critérios de Sucesso
- Zero acesso cross‑tenant
- Refresh/logout validado
- Inbox/Instance token funcionando
- Chat interno MVP funcional
