# Chatwoot Integration Audit — WhatPro Hub

**Auditores:** Backend Specialist + Security Auditor + DevOps Engineer **Data:** 2026-02-08 **Escopo:** Full Stack (Backend + Frontend + Infra + Segurança)

---

## 📊 Executive Summary

**Objetivo:** Avaliar readiness para integração Chatwoot via **Dashboard Script** e **Platform App** .

| Aspecto                    | Status                                 | Criticidade |
| -------------------------- | -------------------------------------- | ----------- |
| Internal Chat (nosso chat) | ✅**MVP backend existe** (UI/realtime ausentes) | P1          |
| Dashboard Script (iframe)  | ⚠️ Parcial                             | P0          |
| Instance Tokens            | ❌**AUSENTE**                          | P0          |
| Inbox Model/Sync           | ❌**AUSENTE**                          | P0          |
| Provider Instances         | ❌**AUSENTE**                          | P1          |
| postMessage Security       | ❌**AUSENTE**                          | P0          |
| CSP Headers                | ❌**AUSENTE**                          | P0          |
| Feature Flags por Tenant   | ⚠️**Schema existe, enforcement falta** | P1          |

**Conclusão:** O backend **NÃO está pronto** para integração segura via Dashboard Script/Platform App. Faltam componentes críticos de autenticação e segurança.

---

## 🔍 Análise do Script de Exemplo (kanbanscript.yml)

O arquivo

temp_integration contém um Dashboard Script funcional que revela o padrão de integração atual:

### Padrão Atual (Insecure)

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60">javascript</div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk5">// 1. Lê auth de cookie Chatwoot</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk6">function</span><span class="mtk1"></span><span class="mtk16">getAuthFromCookie</span><span class="mtk1">() {</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span><span class="mtk5">// Lê cw_d_session_info do cookie</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">}</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk5">// 2. Envia via postMessage para iframe</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk10">iframe</span><span class="mtk1">.</span><span class="mtk10">contentWindow</span><span class="mtk1">.</span><span class="mtk16">postMessage</span><span class="mtk1">({</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1"></span><span class="mtk10">type:</span><span class="mtk1"></span><span class="mtk12">'AUTH_TOKEN'</span><span class="mtk1">,</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1"></span><span class="mtk10">payload:</span><span class="mtk1"></span><span class="mtk10">auth</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">}, </span><span class="mtk12">'*'</span><span class="mtk1">);  </span><span class="mtk5">// ⚠️ RISCO: targetOrigin é '*'</span></div></div></div></div></div></div></pre>

### Riscos Identificados

| Risco                   | Severidade | Descrição                                       |
| ----------------------- | ---------- | ----------------------------------------------- |
| Cookie Exposure         | ALTO       | Token Chatwoot exposto em cookie acessível a JS |
| postMessage `*`         | CRÍTICO    | Qualquer origem pode interceptar mensagem       |
| Sem Instance Token      | ALTO       | Usa token Chatwoot direto (escopo ilimitado)    |
| Fail-Open Features      | MÉDIO      | Em caso de erro, habilita tudo                  |
| Sem CSP frame-ancestors | ALTO       | Iframe pode ser embedado em qualquer site       |

---

## 📐 Comparação: docs/dev vs Implementação Real

### docs/dev/backend-endpoint-audit.md

| Item Documentado | Status Real        | Observação                            |
| ---------------- | ------------------ | ------------------------------------- |
| Tenant Isolation | ⚠️ PARCIAL         | Middleware existe, mas queries não filtram account_id universalmente |
| Instance Tokens  | ❌ FALTA           | Não existe modelo nem endpoint        |
| Webhook Secrets  | ⚠️ PARCIAL         | Usa JWT_SECRET (deveria ser separado) |
| IAM Sessions     | ✅ Modelo existe   | Falta revogação funcional             |

### docs/dev/backend-execution-blueprint.md

| EPIC                     | Previsto | Status Real                                  |
| ------------------------ | -------- | -------------------------------------------- |
| EPIC-01 IAM + Sessions   | P0       | ⚠️ 50% - Modelo existe, refresh/logout stubs |
| EPIC-02 Instance Tokens  | P0       | ❌ 0% - Não iniciado                         |
| EPIC-06 Security Headers | P0       | ❌ 0% - Nenhum header                        |
| EPIC-07 Embed Security   | P1       | ❌ 0% - postMessage/CSP ausentes             |

### docs/dev/backend-prd-implementation-map.md

**Discrepâncias encontradas:**

1. Documento diz "PARCIAL" para Tenant Isolation → **Confirma-se PARCIAL**
2. Documento não menciona Internal Chat → **Não existe implementação**
3. Documento menciona "Instance Tokens FALTA" → **Confirma-se FALTA**

---

## 🧭 Status do Internal Chat (MVP Backend)

O usuário mencionou "chat interno dentro do Chatwoot". Após análise completa:

**✅ EXISTE NO CODEBASE (backend MVP):**

- Modelos `InternalChatRoom`, `InternalChatMember`, `InternalChatMessage`, `InternalChatAudit`
- Migrations para `internal_chat_*`
- Handlers e rotas `/accounts/:accountId/chat/*`
- Service e repository para rooms/members/messages

**O que ainda falta:**

- WebSocket/SSE para real‑time
- UI/components do chat interno
- Notificações in‑app

**Conclusão:** O sistema **já tem chat interno no backend (MVP)**, mas **falta UI e realtime**.

---

## 🔧 Modelos Existentes vs Necessários

### Existem ✅

| Modelo                  | Arquivo       | Uso                                |
| ----------------------- | ------------- | ---------------------------------- |
| **Session**             | models.go:280 | JWT sessions com refresh token     |
| **Provider**            | models.go:127 | WhatsApp API providers             |
| **APIKey**              | models.go:11  | Server-to-server auth              |
| **AccountEntitlements** | models.go:25  | Limites (incl. MaxInboxes)         |
| **UsageDaily**          | models.go:39  | Métricas (Messages, Conversations) |
| **MessageMapping**      | models.go:229 | Gateway WA ↔ Chatwoot              |
| **EventExecution**      | models.go:248 | Webhook processing tracking        |

### Faltam ❌

| Modelo             | Propósito                        | Prioridade |
| ------------------ | -------------------------------- | ---------- |
| `InstanceToken`    | Token dedicado para iframe/app   | P0         |
| `Inbox`            | Espelhamento de inboxes Chatwoot | P0         |
| `ProviderInstance` | Instância específica de provider | P1         |
| `InternalChat`     | **Já existe (MVP backend)**      | —          |
| `FeatureFlag`      | Feature flags por tenant         | P1         |

---

## 🔐 Análise de Segurança para Embed

### Requisitos para Dashboard Script Seguro

| Requisito                     | Status | Implementação Necessária                             |
| ----------------------------- | ------ | ---------------------------------------------------- |
| Instance Token                | ❌     | Criar tabela + endpoint POST /api/v1/instance-tokens |
| Token expiração curta         | ❌     | 15min-1h max, escopo mínimo                          |
| postMessage origin validation | ❌     | Allowlist de origins verificada                      |
| CSP frame-ancestors           | ❌     | Limitar a domínios Chatwoot                          |
| CORS restritivo               | ⚠️     | Existe, mas '\*' em dev                              |
| Audit logs                    | ⚠️     | Parcial                                              |

### Fluxo Seguro Proposto

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">┌─────────────────┐    ┌──────────────┐    ┌─────────────┐</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">│ Chatwoot Script │───►│ WhatPro API  │───►│ WhatPro     │</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">│ (Browser)       │    │ /instance-   │    │ Frontend    │</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">│                 │    │ tokens       │    │ (iframe)    │</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">└────────┬────────┘    └──────────────┘    └──────┬──────┘</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">         │                                         │</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">         │ 1. Request token                        │</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1">         │ (com Chatwoot auth headers)             │</span></div></div><div class="code-line" data-line-number="9" data-line-start="9" data-line-end="9"><div class="line-content"><span class="mtk1">         ├────────────────────────────────────────►│</span></div></div><div class="code-line" data-line-number="10" data-line-start="10" data-line-end="10"><div class="line-content"><span class="mtk1">         │                                         │</span></div></div><div class="code-line" data-line-number="11" data-line-start="11" data-line-end="11"><div class="line-content"><span class="mtk1">         │ 2. Gera instance_token                  │</span></div></div><div class="code-line" data-line-number="12" data-line-start="12" data-line-end="12"><div class="line-content"><span class="mtk1">         │ (escopo: kanban:read, curto TTL)        │</span></div></div><div class="code-line" data-line-number="13" data-line-start="13" data-line-end="13"><div class="line-content"><span class="mtk1">         │◄────────────────────────────────────────┤</span></div></div><div class="code-line" data-line-number="14" data-line-start="14" data-line-end="14"><div class="line-content"><span class="mtk1">         │                                         │</span></div></div><div class="code-line" data-line-number="15" data-line-start="15" data-line-end="15"><div class="line-content"><span class="mtk1">         │ 3. postMessage com origin validation    │</span></div></div><div class="code-line" data-line-number="16" data-line-start="16" data-line-end="16"><div class="line-content"><span class="mtk1">         │────────────────────────────────────────►│</span></div></div><div class="code-line" data-line-number="17" data-line-start="17" data-line-end="17"><div class="line-content"><span class="mtk1">         │                                         │</span></div></div><div class="code-line" data-line-number="18" data-line-start="18" data-line-end="18"><div class="line-content"><span class="mtk1">         └─────────────────────────────────────────┘</span></div></div></div></div></div></div></pre>

---

## 📋 Endpoints Necessários (Novos)

### Para Dashboard Script

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">POST /api/v1/instance-tokens</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">  - Input: account_id, scopes[], ttl_minutes</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1">  - Output: { token: "...", expires_at: "..." }</span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">  - Auth: JWT (usuário logado via Chatwoot)</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">GET /api/v1/instance-tokens/validate</span></div></div><div class="code-line" data-line-number="7" data-line-start="7" data-line-end="7"><div class="line-content"><span class="mtk1">  - Input: Authorization header com instance token</span></div></div><div class="code-line" data-line-number="8" data-line-start="8" data-line-end="8"><div class="line-content"><span class="mtk1">  - Output: { valid: true, scopes: [...], account_id: ... }</span></div></div></div></div></div></div></pre>

### Para Platform App

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">GET /api/v1/platform-app/config</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">  - Output: Configuração do app (iframe URLs, features)</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">POST /api/v1/platform-app/events</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">  - Input: Eventos da plataforma (instalação, etc.)</span></div></div><div class="code-line" data-line-number="6" data-line-start="6" data-line-end="6"><div class="line-content"><span class="mtk1">  - Auth: Webhook signature</span></div></div></div></div></div></div></pre>

### Para Inboxes

<pre><div node="[object Object]" class="relative whitespace-pre-wrap word-break-all my-2 rounded-lg bg-list-hover-subtle border border-gray-500/20"><div class="min-h-7 relative box-border flex flex-row items-center justify-between rounded-t border-b border-gray-500/20 px-2 py-0.5"><div class="font-sans text-sm text-ide-text-color opacity-60"></div><div class="flex flex-row gap-2 justify-end"><div class="cursor-pointer opacity-70 hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="lucide lucide-copy h-3.5 w-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></div></div></div><div class="p-3"><div class="w-full h-full text-xs cursor-text"><div class="code-block"><div class="code-line" data-line-number="1" data-line-start="1" data-line-end="1"><div class="line-content"><span class="mtk1">GET /api/v1/accounts/:id/inboxes</span></div></div><div class="code-line" data-line-number="2" data-line-start="2" data-line-end="2"><div class="line-content"><span class="mtk1">  - Lista inboxes do tenant</span></div></div><div class="code-line" data-line-number="3" data-line-start="3" data-line-end="3"><div class="line-content"><span class="mtk1"></span></div></div><div class="code-line" data-line-number="4" data-line-start="4" data-line-end="4"><div class="line-content"><span class="mtk1">POST /api/v1/accounts/:id/inboxes/sync</span></div></div><div class="code-line" data-line-number="5" data-line-start="5" data-line-end="5"><div class="line-content"><span class="mtk1">  - Sincroniza inboxes do Chatwoot</span></div></div></div></div></div></div></pre>

---

## 📊 Mapa de Integração Consolidado

| Feature         | Backend        | Frontend            | Infra      | Status |
| --------------- | -------------- | ------------------- | ---------- | ------ |
| Kanban Embed    | ⚠️ CORS + JWT  | ❌ Sem iframe ready | ⚠️         | 40%    |
| Instance Tokens | ❌             | N/A                 | N/A        | 0%     |
| Inbox Sync      | ❌ Model falta | ❌                  | N/A        | 0%     |
| Feature Flags   | ⚠️ Schema      | ❌ UI               | N/A        | 20%    |
| postMessage     | ❌             | ❌                  | N/A        | 0%     |
| CSP Headers     | ❌             | N/A                 | ❌ Traefik | 0%     |
| Internal Chat   | ✅ MVP         | ❌ UI               | ❌        | 60%    |

---

## ✅ Checklist de Execução (Ordem Prioritária)

### Fase 1 — Segurança de Embed (P0)

- [ ] Criar modelo `InstanceToken` (tabela + GORM)
- [ ] Implementar `POST /api/v1/instance-tokens`
- [ ] Implementar middleware de validação de instance token
- [ ] Adicionar CSP headers (`frame-ancestors`, `Content-Security-Policy`)
- [ ] Implementar postMessage origin validation no frontend
- [ ] Configurar CORS_ORIGINS para produção

### Fase 2 — Inboxes & Platform App (P0)

- [ ] Criar modelo `Inbox` (espelhamento Chatwoot)
- [ ] Implementar `GET/POST /accounts/:id/inboxes`
- [ ] Implementar sync de inboxes via Chatwoot API
- [ ] Implementar `GET /api/v1/platform-app/config`
- [ ] Implementar webhook handler para Platform App events

### Fase 3 — Feature Flags & Permissions (P1)

- [ ] Criar modelo `FeatureFlag` ou expandir `AccountEntitlements.Features`
- [ ] Implementar endpoint `GET /api/v1/features`
- [ ] Implementar UI de feature flags no admin
- [ ] Validar features antes de renderizar menus no script

### Fase 4 — Internal Chat (P2, se desejado)

- [ ] Definir requisitos do chat interno
- [ ] Criar modelos `InternalChat`, `InternalMessage`
- [ ] Implementar WebSocket para real-time
- [ ] Criar UI de chat

---

## 📈 Estimativa de Esforço

| Fase               | Duração     | FTE |
| ------------------ | ----------- | --- |
| Fase 1 (Segurança) | 1-2 semanas | 1   |
| Fase 2 (Inboxes)   | 1 semana    | 1   |
| Fase 3 (Features)  | 3-5 dias    | 1   |
| Fase 4 (Chat)      | 2-4 semanas | 1+  |

**Total para produção-ready (sem chat interno):** 3-4 semanas

---

## 📎 Arquivos Analisados

- apps/api/internal/models/models.go (295 linhas)
- apps/api/cmd/server/main.go (334 linhas)
- `docs/dev/backend-*.md` (3 arquivos)
- docs/temp_integration (Dashboard Script exemplo)
- `apps/api/internal/services/` (todos os services)
- `apps/api/internal/middleware/` (todos os middlewares)
