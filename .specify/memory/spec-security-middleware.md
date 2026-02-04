# Security Middleware Specification

> **Feature ID**: SEC-001
> **Status**: Draft
> **Created**: 2026-02-03
> **Author**: Backend Specialist + Security Auditor

---

## 1. Overview

### 1.1 Problem Statement

O WhatPro Hub atualmente não possui:

- **Rate Limiting**: Vulnerável a DDoS e brute force
- **Input Validation**: Handlers não validam payloads
- **Audit Logging**: Ações sensíveis não são registradas
- **CORS Production**: Configurado com `*` (wildcard)

### 1.2 Solution

Implementar camada de segurança enterprise-grade com:

- Rate limiting por IP + Role (camadas)
- Validação de input com go-playground/validator
- Audit logging para operações de escrita
- CORS com whitelist de origins

### 1.3 Success Metrics

| Métrica          | Antes       | Depois            |
| ---------------- | ----------- | ----------------- |
| Rate Limiting    | ❌ Nenhum   | ✅ 100 req/min/IP |
| Input Validation | ❌ Manual   | ✅ Automático     |
| Audit Coverage   | ❌ 0%       | ✅ 100% escrita   |
| CORS Security    | ❌ Wildcard | ✅ Whitelist      |

---

## 2. Functional Requirements

### 2.1 Rate Limiting (P0 - Critical)

#### FR-2.1.1: IP-Based Rate Limiting

- **Descrição**: Limitar requisições por IP antes da autenticação
- **Limite**: 100 requests/minuto por IP
- **Exceção**: Health check endpoints (`/health/*`)
- **Storage**: Redis (para suportar múltiplas instâncias)
- **Headers**: Incluir `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### FR-2.1.2: Role-Based Rate Limiting

- **Descrição**: Limitar após autenticação baseado no role
- **Limites**:
  | Role | Limite |
  |------|--------|
  | `agent` | 200 req/min |
  | `supervisor` | 500 req/min |
  | `admin` | 1000 req/min |
  | `super_admin` | Ilimitado |

#### FR-2.1.3: Rate Limit Response

```json
{
  "success": false,
  "error": "Too Many Requests",
  "status": 429,
  "retry_after": 60
}
```

### 2.2 Input Validation (P0 - Critical)

#### FR-2.2.1: Validation Framework

- **Library**: `github.com/go-playground/validator/v10`
- **Integração**: Helper method `h.Validate(c, &request)`
- **Erro**: Retornar 400 com detalhes dos campos inválidos

#### FR-2.2.2: Request Structs

Todos os handlers DEVEM usar structs tipados com tags de validação:

```go
type CreateProviderRequest struct {
    Name         string `json:"name" validate:"required,min=3,max=100"`
    Type         string `json:"type" validate:"required,oneof=evolution uazapi baileys"`
    BaseURL      string `json:"base_url" validate:"required,url"`
    APIKey       string `json:"api_key" validate:"required,min=32"`
    InstanceName string `json:"instance_name" validate:"required,min=3,max=50"`
}
```

#### FR-2.2.3: Custom Validators

- `uuid`: Validar UUIDs v4
- `phone`: Validar números de telefone (formato E.164)
- `chatwoot_role`: Validar roles do Chatwoot
- `whatpro_role`: Validar roles do WhatPro

#### FR-2.2.4: Validation Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "status": 400,
  "details": [
    { "field": "name", "message": "Name is required" },
    { "field": "base_url", "message": "Must be a valid URL" }
  ]
}
```

### 2.3 Audit Logging (P1 - High)

#### FR-2.3.1: Audit Events

Registrar para operações de escrita (POST, PUT, DELETE):

| Campo           | Tipo      | Descrição                                  |
| --------------- | --------- | ------------------------------------------ |
| `id`            | UUID      | ID único do log                            |
| `user_id`       | int       | ID do usuário que executou                 |
| `account_id`    | int       | ID da conta afetada                        |
| `action`        | string    | Tipo de ação (create, update, delete)      |
| `resource_type` | string    | Tipo do recurso (account, provider, board) |
| `resource_id`   | string    | ID do recurso afetado                      |
| `old_value`     | JSONB     | Valor anterior (para update/delete)        |
| `new_value`     | JSONB     | Novo valor (para create/update)            |
| `ip_address`    | string    | IP do cliente                              |
| `user_agent`    | string    | User-Agent do cliente                      |
| `created_at`    | timestamp | Data/hora da ação                          |

#### FR-2.3.2: Audit Helper

```go
h.Audit(c, "create", "provider", providerID, nil, newProvider)
h.Audit(c, "update", "account", accountID, oldAccount, newAccount)
h.Audit(c, "delete", "board", boardID, deletedBoard, nil)
```

### 2.4 CORS Configuration (P0 - Critical)

#### FR-2.4.1: Production Origins

- Configurável via `CORS_ALLOWED_ORIGINS` (comma-separated)
- Default development: `http://localhost:3000`
- Validar que não seja `*` em `ENV=production`

#### FR-2.4.2: CORS Headers

```
Access-Control-Allow-Origin: https://app.whatpro.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

---

## 3. Non-Functional Requirements

### 3.1 Performance

- Rate limiter check: < 1ms
- Validation: < 5ms para structs típicos
- Audit logging: Async (não bloquear request)

### 3.2 Scalability

- Redis storage para rate limiting (cluster-ready)
- Audit logs em tabela separada (particionável)

### 3.3 Security

- Rate limiting resistente a IP spoofing (trusted proxies)
- Audit logs imutáveis (sem UPDATE/DELETE permitido)
- Secrets nunca logados

---

## 4. Technical Design

### 4.1 Arquitetura

```
Request
    │
    ▼
┌─────────────────┐
│ Rate Limit (IP) │ ← Redis Storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      CORS       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   JWT Auth      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rate Limit(Role)│ ← Redis Storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Validation│ ← go-playground/validator
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Handler      │
│ + Audit Logging │ ← Async write to DB
└─────────────────┘
```

### 4.2 Novos Arquivos

| Arquivo                            | Responsabilidade       |
| ---------------------------------- | ---------------------- |
| `middleware/rate_limiter.go`       | Rate limiting por IP   |
| `middleware/role_limiter.go`       | Rate limiting por Role |
| `middleware/validator.go`          | Input validation setup |
| `services/audit_service.go`        | Audit logging service  |
| `repositories/audit_repository.go` | Audit persistence      |

### 4.3 Arquivos Modificados

| Arquivo                        | Mudanças                                  |
| ------------------------------ | ----------------------------------------- |
| `cmd/server/main.go`           | Adicionar middlewares na chain            |
| `internal/config/config.go`    | Novos campos de configuração              |
| `internal/handlers/handler.go` | Adicionar Validator e AuditService        |
| `internal/handlers/stubs.go`   | Adicionar validation em handlers          |
| `go.mod`                       | Nova dependência: go-playground/validator |

---

## 5. Acceptance Criteria

### 5.1 Rate Limiting

- [ ] Enviar 110 requests em 1 minuto retorna 429 nos últimos 10
- [ ] Health checks não são limitados
- [ ] Headers X-RateLimit-\* estão presentes
- [ ] Redis storage funciona em cluster

### 5.2 Input Validation

- [ ] Request sem campo required retorna 400
- [ ] Request com email inválido retorna 400
- [ ] Response inclui lista de erros por campo
- [ ] Custom validators funcionam (uuid, phone)

### 5.3 Audit Logging

- [ ] Create gera log com new_value
- [ ] Update gera log com old_value e new_value
- [ ] Delete gera log com old_value
- [ ] Logs incluem IP e User-Agent

### 5.4 CORS

- [ ] Production com `*` falha ao iniciar
- [ ] Origin não permitido retorna erro
- [ ] Preflight OPTIONS funciona

---

## 6. Dependencies

| Dependency                                       | Versão  | Uso                        |
| ------------------------------------------------ | ------- | -------------------------- |
| `github.com/go-playground/validator/v10`         | latest  | Input validation           |
| `github.com/gofiber/fiber/v2/middleware/limiter` | v2.52.5 | Rate limiting              |
| `github.com/gofiber/storage/redis/v3`            | latest  | Redis storage para limiter |

---

## 7. Risks & Mitigations

| Risco        | Impacto            | Mitigação                    |
| ------------ | ------------------ | ---------------------------- |
| Redis down   | Rate limiter falha | Fallback para memory storage |
| IP spoofing  | Bypass rate limit  | Configurar trusted proxies   |
| Audit volume | DB slow            | Particionamento por data     |

---

**Last Updated**: 2026-02-03
**Reviewed By**: Pending
