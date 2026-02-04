# WhatPro Hub API 🚀

O núcleo backend do ecossistema WhatPro Hub, construído em **Go (Golang)** com framework **Fiber**.

## 🏗️ Arquitetura e Módulos

O sistema é dividido em módulos de domínio (`internal/services`, `internal/handlers`):

### 1. Core / Auth

- **SSO** com Chatwoot (JWT).
- **RBAC** (Role-Based Access Control) para permissões finas.
- **Multi-tenant** por design.

### 2. Kanban CRM (`kanban`)

Sistema de gestão visual de pipelines.

- **Boards**: Quadros personalizáveis.
- **Stages**: Colunas/Fases do funil.
- **Cards**: Cartões vinculados a conversas do Chatwoot.
- _Feature_: Movimentação de cards (Drag & Drop) com persistência de posição.

### 3. WhatPro Gateway (`gateway`) 🛡️

Módulo de roteamento de mensagens que substitui a necessidade de flows complexos no N8N.

- **Ingestion**: Recebe webhooks da Evolution API / Uazapi.
- **Resilience**:
  - `EventExecution`: Loga status de processamento (pendente, sucesso, erro).
  - `MessageMapping`: Mantém vínculo `MessageID (WhatsApp)` <-> `MessageID (Chatwoot)`.
  - **Retries**: Mecanismo de re-tentativa para falhas de entrega.

### 4. Integrações

- **Chatwoot**: Sincronização de Contas, Usuários e Times.
- **Providers**: Gestão de credenciais (criptografadas) para Evolution API e Uazapi.

## 🛠️ Comandos Úteis

### Rodar Servidor

```bash
go run cmd/server/main.go
```

### Testar Gateway (Ingestão)

```bash
curl -X POST http://localhost:8080/api/v1/webhooks/evolution/TEST_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert", "data":{...}}'
```

## 📦 Estrutura de Pastas

- `cmd/server`: Entrypoint (`main.go`).
- `internal/models`: Definição dos schemas do Banco de Dados (GORM).
- `internal/repositories`: Acesso a dados (DAO pattern).
- `internal/services`: Regras de negócio.
- `internal/handlers`: Controllers HTTP.
- `internal/middleware`: Autenticação e validação.
