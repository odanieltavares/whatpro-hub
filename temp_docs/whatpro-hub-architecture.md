# WhatPro Hub - Arquitetura Enterprise & Guia Estratégico

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Classificação:** Documento Técnico Estratégico

---

## Sumário Executivo

Este documento define a arquitetura enterprise-grade do **WhatPro Hub**, uma plataforma de integração nativa com Chatwoot para gestão de atendimento, automação e operações. O objetivo é criar uma solução com padrão de **telecomunicações enterprise**, compliance SOC 2, e eficiência máxima em engenharia.

---

## 1. Análise: Onde Posso Injetar Iframes?

### 1.1 Locais Disponíveis no Chatwoot

| Local | Disponível | Método | Observações |
|-------|------------|--------|-------------|
| **Agent Dashboard** | ✅ Sim | Dashboard Apps (Settings → Integrations) | Contexto de conversa via `postMessage` |
| **Super Admin Console** | ✅ Sim | Dashboard Script (super_admin/app_config) | Acesso global, sem contexto de conversa |
| **Conversation Sidebar** | ✅ Sim | Dashboard Apps como aba | Aparece como nova aba na conversa |
| **Contact Panel** | ⚠️ Parcial | Via extensão do Dashboard App | Requer customização |

### 1.2 Dashboard Apps vs Dashboard Script

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD APPS                                  │
│  Localização: Settings → Integrations → Dashboard Apps              │
│  Escopo: Por Account (empresa)                                      │
│  Contexto: Recebe dados da conversa via window.postMessage          │
│  Uso ideal: Funcionalidades para agentes (Kanban, CRM, etc)         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD SCRIPT                                 │
│  Localização: super_admin/app_config?config=internal                │
│  Escopo: Instalação inteira (global)                                │
│  Contexto: Acesso a cookies de sessão, manipulação do DOM           │
│  Uso ideal: Menus customizados, painéis administrativos             │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Fluxo de Dados do Iframe

```javascript
// O Chatwoot envia contexto automaticamente para Dashboard Apps:
window.addEventListener('message', function(event) {
  const data = event.data;
  // Estrutura recebida:
  // {
  //   meta: {
  //     sender: { id, name, email, phone_number, custom_attributes },
  //     channel: "whatsapp" | "web" | "email",
  //     assignee: { id, name, email, role },
  //     hmac_verified: boolean
  //   },
  //   id: conversationId,
  //   messages: [...]
  // }
});

// Para solicitar atualização de dados:
window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
```

### 1.4 Recomendação de Arquitetura de Injeção

```
SUPER ADMIN (Dashboard Script)
├── Menu: WhatPro Hub
│   ├── /admin/dashboard     → Painel geral da instalação
│   ├── /admin/accounts      → Gestão de empresas/contas
│   ├── /admin/permissions   → Controle de permissões globais
│   └── /admin/providers     → Gestão de providers WhatsApp
│
AGENT DASHBOARD (Dashboard Apps)
├── Aba: Kanban
│   └── /kanban              → Visualização Kanban da conversa
├── Aba: Histórico
│   └── /history             → Histórico completo do contato
└── Aba: Automações
    └── /automations         → Gatilhos e macros
```

---

## 2. Escolha da Linguagem: Análise Profunda

### 2.1 Comparativo de Performance (Benchmarks 2024-2025)

| Linguagem | req/s (5000 conn) | Latência Média | Memória Base | Time to Market |
|-----------|-------------------|----------------|--------------|----------------|
| **Rust** | 165,000 | 1.5ms | 2-5 MB | 🔴 Lento |
| **Go** | 132,000 | 1.8ms | 5-10 MB | 🟢 Rápido |
| **Node.js/Bun** | 72,000 | 3.2ms | 30-50 MB | 🟢 Muito Rápido |
| **C# (.NET)** | 118,000 | 2.1ms | 20-40 MB | 🟡 Médio |

### 2.2 Análise por Critério Enterprise

```
┌────────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE DECISÃO                                │
├────────────────┬──────┬──────┬──────────┬───────┬─────────────────┤
│ Critério       │ Rust │ Go   │ Node/Bun │ .NET  │ Peso Enterprise │
├────────────────┼──────┼──────┼──────────┼───────┼─────────────────┤
│ Performance    │ 10   │ 9    │ 6        │ 8     │ 20%             │
│ Memory Safety  │ 10   │ 7    │ 5        │ 7     │ 15%             │
│ Concorrência   │ 9    │ 10   │ 6        │ 8     │ 15%             │
│ Ecossistema    │ 6    │ 8    │ 10       │ 9     │ 10%             │
│ Contratação    │ 4    │ 8    │ 10       │ 7     │ 15%             │
│ DevSpeed       │ 4    │ 8    │ 9        │ 7     │ 15%             │
│ Manutenção     │ 8    │ 9    │ 6        │ 8     │ 10%             │
├────────────────┼──────┼──────┼──────────┼───────┼─────────────────┤
│ SCORE FINAL    │ 7.2  │ 8.5  │ 7.3      │ 7.7   │                 │
└────────────────┴──────┴──────┴──────────┴───────┴─────────────────┘
```

### 2.3 Recomendação: **Go (Golang)**

**Por que Go é a escolha ideal para WhatPro Hub:**

1. **Padrão Cloud-Native**: Docker, Kubernetes, Traefik — todos escritos em Go
2. **Goroutines**: Concorrência nativa para WebSockets, filas, webhooks
3. **Compilação Rápida**: Binários únicos, sem runtime
4. **Desempenho**: 2x mais rápido que Node.js sob carga
5. **Facilidade de Contratação**: Pool de talentos maior que Rust
6. **Empresas de Referência**: Uber, Twitch, Google, Cloudflare

**Quando usar outras linguagens no ecossistema:**

```
Go (Principal)
├── API Gateway
├── Business Logic
├── WebSocket Server
├── Background Workers
└── CLI Tools

TypeScript/React (Frontend)
├── Dashboard Web
├── Painel Admin
└── Componentes UI

Rust (Opcional - Performance Crítica)
├── Parser de mensagens WhatsApp
├── Processamento de mídia
└── Crypto/Hashing pesado
```

### 2.4 Framework Go Recomendado

| Framework | Use Case | Performance | Complexidade |
|-----------|----------|-------------|--------------|
| **Fiber** | APIs REST | Ultra-alto | Baixa |
| **Gin** | APIs REST | Alto | Baixa |
| **Echo** | APIs REST + Middleware | Alto | Baixa |
| **Chi** | Minimalista | Alto | Muito baixa |
| **gRPC** | Microservices | Ultra-alto | Média |

**Recomendação**: **Fiber** (inspirado no Express.js, mais rápido que Gin)

```go
// Exemplo de estrutura com Fiber
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/limiter"
)

func main() {
    app := fiber.New(fiber.Config{
        Prefork:       true,  // Multi-process mode
        ServerHeader:  "WhatPro Hub",
        StrictRouting: true,
    })

    // Middlewares
    app.Use(cors.New())
    app.Use(limiter.New(limiter.Config{
        Max: 100,
        Expiration: 60 * time.Second,
    }))

    // Routes
    api := app.Group("/api/v1")
    api.Get("/health", handlers.HealthCheck)
    
    app.Listen(":3000")
}
```

---

## 3. Sistema de Controle de Acesso (RBAC)

### 3.1 Hierarquia de Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHATPRO HUB - RBAC MODEL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │   SUPER ADMIN   │  ← Nível Instalação (seu papel)                │
│  │   (Platform)    │    - Gestão de todas as empresas               │
│  └────────┬────────┘    - Configuração de providers                 │
│           │              - Billing e licenciamento                  │
│           │              - Monitoramento global                     │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │     ADMIN       │  ← Nível Account (cliente/empresa)             │
│  │   (Account)     │    - Gestão de usuários da empresa             │
│  └────────┬────────┘    - Configuração de inboxes                   │
│           │              - Acesso ao Kanban completo                │
│           │              - Relatórios da empresa                    │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │    SUPERVISOR   │  ← Nível Team (opcional)                       │
│  │     (Team)      │    - Gestão de agentes do time                 │
│  └────────┬────────┘    - Visualização de métricas do time          │
│           │              - Reatribuição de conversas                │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │     AGENT       │  ← Nível Operacional                           │
│  │   (Operator)    │    - Atendimento de conversas                  │
│  └─────────────────┘    - Acesso ao Kanban próprio                  │
│                          - Sem acesso administrativo                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Modelo de Dados de Permissões

```go
// models/permission.go
type Permission struct {
    ID          uuid.UUID `json:"id"`
    Resource    string    `json:"resource"`    // "kanban", "providers", "users"
    Action      string    `json:"action"`      // "create", "read", "update", "delete"
    Scope       string    `json:"scope"`       // "own", "team", "account", "global"
}

type Role struct {
    ID          uuid.UUID     `json:"id"`
    Name        string        `json:"name"`
    Level       string        `json:"level"`  // "platform", "account", "team"
    Permissions []Permission  `json:"permissions"`
}

// Mapeamento de Permissões por Role
var DefaultRoles = map[string][]string{
    "super_admin": {
        "accounts:*:global",
        "users:*:global",
        "providers:*:global",
        "billing:*:global",
        "kanban:*:global",
        "reports:*:global",
    },
    "admin": {
        "users:*:account",
        "kanban:*:account",
        "inboxes:*:account",
        "reports:read:account",
        "automations:*:account",
    },
    "supervisor": {
        "users:read:team",
        "kanban:*:team",
        "conversations:*:team",
        "reports:read:team",
    },
    "agent": {
        "kanban:read:own",
        "kanban:update:own",
        "conversations:*:own",
    },
}
```

### 3.3 Middleware de Autorização

```go
// middleware/auth.go
func RequirePermission(resource, action, scope string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        user := c.Locals("user").(*models.User)
        
        // Verificar permissão
        if !hasPermission(user, resource, action, scope) {
            return c.Status(403).JSON(fiber.Map{
                "error": "Insufficient permissions",
                "required": fmt.Sprintf("%s:%s:%s", resource, action, scope),
            })
        }
        
        return c.Next()
    }
}

// Uso nas rotas
api.Get("/accounts", 
    middleware.RequirePermission("accounts", "read", "global"),
    handlers.ListAccounts)
```

---

## 4. Stack Tecnológica Completa

### 4.1 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WHATPRO HUB - STACK                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │   CLOUDFLARE    │     │    TRAEFIK      │     │   NGINX (opt)   │      │
│   │   (CDN/WAF)     │────▶│  (Reverse Proxy)│────▶│  (Static Files) │      │
│   └─────────────────┘     └────────┬────────┘     └─────────────────┘      │
│                                    │                                        │
│   ┌────────────────────────────────┼────────────────────────────────────┐  │
│   │                     APLICAÇÃO  │                                     │  │
│   │  ┌──────────────┐  ┌──────────▼─────────┐  ┌──────────────────────┐ │  │
│   │  │   FRONTEND   │  │     API GATEWAY    │  │   WEBSOCKET SERVER   │ │  │
│   │  │   Next.js    │  │       (Go/Fiber)   │  │      (Go/Gorilla)    │ │  │
│   │  │   React      │  │   - Auth           │  │   - Real-time        │ │  │
│   │  │   TailwindCSS│  │   - Rate Limit     │  │   - Notifications    │ │  │
│   │  └──────────────┘  │   - Validation     │  │   - Live updates     │ │  │
│   │                    └──────────┬─────────┘  └──────────┬───────────┘ │  │
│   │                               │                       │             │  │
│   │   ┌───────────────────────────┼───────────────────────┼───────────┐ │  │
│   │   │           SERVICES        │                       │           │ │  │
│   │   │  ┌────────────────┐  ┌────▼─────┐  ┌─────────────▼─────────┐ │ │  │
│   │   │  │  Auth Service  │  │  Kanban  │  │   Webhook Processor   │ │ │  │
│   │   │  │  (JWT/SSO)     │  │  Service │  │   (Chatwoot Events)   │ │ │  │
│   │   │  └────────────────┘  └──────────┘  └───────────────────────┘ │ │  │
│   │   │  ┌────────────────┐  ┌──────────┐  ┌───────────────────────┐ │ │  │
│   │   │  │  Hub Service   │  │ Provider │  │   Automation Engine   │ │ │  │
│   │   │  │  (Accounts)    │  │ Service  │  │   (N8N Integration)   │ │ │  │
│   │   │  └────────────────┘  └──────────┘  └───────────────────────┘ │ │  │
│   │   └─────────────────────────────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│   ┌────────────────────────────────┼────────────────────────────────────┐  │
│   │                     DATA LAYER │                                     │  │
│   │  ┌──────────────┐  ┌──────────▼─────────┐  ┌──────────────────────┐ │  │
│   │  │   REDIS      │  │    POSTGRESQL      │  │     MINIO/S3         │ │  │
│   │  │   - Cache    │  │    - Main DB       │  │   - File Storage     │ │  │
│   │  │   - Sessions │  │    - Schemas       │  │   - Media            │ │  │
│   │  │   - Queues   │  │    - Audit Logs    │  │   - Backups          │ │  │
│   │  │   - Pub/Sub  │  │                    │  │                      │ │  │
│   │  └──────────────┘  └────────────────────┘  └──────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                     OBSERVABILITY                                     │ │
│   │  ┌──────────────┐  ┌────────────────────┐  ┌──────────────────────┐  │ │
│   │  │  PROMETHEUS  │  │      GRAFANA       │  │        LOKI          │  │ │
│   │  │  - Metrics   │  │  - Dashboards      │  │    - Log Aggregation │  │ │
│   │  └──────────────┘  └────────────────────┘  └──────────────────────┘  │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Stack Detalhada com Justificativas

#### **Core Infrastructure**

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Reverse Proxy** | Traefik v3 | Auto-discovery com Docker, Let's Encrypt nativo, métricas |
| **CDN/WAF** | Cloudflare | DDoS protection, edge caching, SSL |
| **Container Runtime** | Docker + Swarm | Já utilizado, orquestração simples |
| **Container Registry** | Harbor / GHCR | Segurança, scan de vulnerabilidades |

#### **Application Layer**

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **API Backend** | Go + Fiber | Performance 100k+ req/s, tipagem forte |
| **WebSocket** | Go + Gorilla | Goroutines para 10k+ conexões simultâneas |
| **Frontend** | Next.js 15 + React | SSR, App Router, Turbopack |
| **UI Components** | Shadcn/ui + Tailwind | Componentes acessíveis, customizáveis |
| **State Management** | Zustand | Leve, TypeScript-first |
| **API Client** | TanStack Query | Cache, retry, optimistic updates |

#### **Data Layer**

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Primary Database** | PostgreSQL 16 | ACID, JSON support, full-text search |
| **Cache/Session** | Redis 7 (Cluster) | Sub-ms latency, Pub/Sub nativo |
| **Search Engine** | MeiliSearch / PostgreSQL FTS | Full-text search |
| **File Storage** | MinIO (S3-compatible) | Self-hosted, não depende da cloud |
| **Queue/Jobs** | Redis Streams + Asynq | Jobs distribuídos em Go |

#### **Observability**

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Metrics** | Prometheus + VictoriaMetrics | Standard, alta cardinalidade |
| **Dashboards** | Grafana | Visualização unificada |
| **Logs** | Loki + Promtail | LogQL, integração Grafana |
| **Tracing** | Jaeger / OpenTelemetry | Distributed tracing |
| **Alerting** | Alertmanager | Multi-channel (Slack, Email, SMS) |

### 4.3 Por Que Cada Tecnologia?

#### **PostgreSQL vs MySQL vs MongoDB**

```
PostgreSQL ✅
├── ACID compliance (transações seguras)
├── JSONB nativo (flexibilidade NoSQL)
├── Row Level Security (multitenancy)
├── Full-text search nativo
├── Partitioning para escalabilidade
├── pg_stat para análise de queries
└── Extensões: TimescaleDB, pgvector (AI)

MongoDB ❌
├── Eventual consistency (risco em billing)
├── Schema-less pode gerar debt
└── Mais caro em memória

MySQL ⚠️
├── Menos features que PostgreSQL
├── Problemas históricos com encoding
└── Menos extensível
```

#### **Redis: Cache + Sessions + Queues**

```go
// redis/client.go
type RedisClient struct {
    Cache    *redis.Client  // Cache de dados (TTL curto)
    Session  *redis.Client  // Sessões de usuário (TTL médio)
    Queue    *redis.Client  // Job queues (persistent)
    PubSub   *redis.Client  // Real-time events
}

// Usos principais:
// 1. Cache de tokens Chatwoot validados
// 2. Rate limiting por IP/User
// 3. Session storage (JWT refresh tokens)
// 4. Fila de webhooks para processamento
// 5. Pub/Sub para notificações real-time
```

---

## 5. Health Check: O Que É e Possibilidades

### 5.1 Conceito

Health check é um endpoint que permite monitorar o estado de saúde do sistema. É fundamental para:
- Load balancers (decidir se roteia tráfego)
- Orquestradores (restart automático)
- Monitoramento (alertas)
- CI/CD (verificar deploy)

### 5.2 Níveis de Health Check

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK LEVELS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Level 1: LIVENESS (Básico)                                         │
│  └── "O processo está rodando?"                                     │
│      Endpoint: GET /health/live                                     │
│      Response: 200 OK (processo vivo) ou timeout (morto)            │
│                                                                     │
│  Level 2: READINESS (Prontidão)                                     │
│  └── "O serviço está pronto para receber tráfego?"                  │
│      Endpoint: GET /health/ready                                    │
│      Checks: DB conectado, Redis disponível, cache aquecido         │
│                                                                     │
│  Level 3: DEEP CHECK (Profundo)                                     │
│  └── "Todas as dependências estão saudáveis?"                       │
│      Endpoint: GET /health/deep                                     │
│      Checks: DB latency, Redis latency, Chatwoot API, Disk space    │
│                                                                     │
│  Level 4: METRICS (Métricas)                                        │
│  └── "Qual o estado atual do sistema?"                              │
│      Endpoint: GET /metrics                                         │
│      Format: Prometheus exposition format                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Implementação Completa

```go
// handlers/health.go
package handlers

import (
    "context"
    "time"
    "github.com/gofiber/fiber/v2"
)

type HealthStatus struct {
    Status      string                 `json:"status"`
    Version     string                 `json:"version"`
    Timestamp   time.Time              `json:"timestamp"`
    Uptime      string                 `json:"uptime"`
    Checks      map[string]CheckResult `json:"checks,omitempty"`
}

type CheckResult struct {
    Status   string        `json:"status"`
    Latency  string        `json:"latency,omitempty"`
    Message  string        `json:"message,omitempty"`
}

var startTime = time.Now()

// GET /health/live - Kubernetes liveness probe
func LivenessCheck(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status": "alive",
        "timestamp": time.Now(),
    })
}

// GET /health/ready - Kubernetes readiness probe
func ReadinessCheck(c *fiber.Ctx) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Verificar PostgreSQL
    dbOk := checkPostgres(ctx)
    
    // Verificar Redis
    redisOk := checkRedis(ctx)
    
    if !dbOk || !redisOk {
        return c.Status(503).JSON(fiber.Map{
            "status": "not_ready",
            "database": dbOk,
            "redis": redisOk,
        })
    }
    
    return c.JSON(fiber.Map{
        "status": "ready",
    })
}

// GET /health/deep - Deep health check
func DeepHealthCheck(c *fiber.Ctx) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    checks := make(map[string]CheckResult)
    allHealthy := true
    
    // PostgreSQL Check
    start := time.Now()
    if err := checkPostgresDeep(ctx); err != nil {
        checks["postgresql"] = CheckResult{
            Status: "unhealthy",
            Message: err.Error(),
        }
        allHealthy = false
    } else {
        checks["postgresql"] = CheckResult{
            Status: "healthy",
            Latency: time.Since(start).String(),
        }
    }
    
    // Redis Check
    start = time.Now()
    if err := checkRedisDeep(ctx); err != nil {
        checks["redis"] = CheckResult{
            Status: "unhealthy",
            Message: err.Error(),
        }
        allHealthy = false
    } else {
        checks["redis"] = CheckResult{
            Status: "healthy",
            Latency: time.Since(start).String(),
        }
    }
    
    // Chatwoot API Check
    start = time.Now()
    if err := checkChatwootAPI(ctx); err != nil {
        checks["chatwoot"] = CheckResult{
            Status: "degraded",
            Message: err.Error(),
        }
        // Não marca como unhealthy, apenas degraded
    } else {
        checks["chatwoot"] = CheckResult{
            Status: "healthy",
            Latency: time.Since(start).String(),
        }
    }
    
    // Disk Space Check
    diskStatus := checkDiskSpace()
    checks["disk"] = diskStatus
    if diskStatus.Status == "critical" {
        allHealthy = false
    }
    
    status := "healthy"
    statusCode := 200
    if !allHealthy {
        status = "unhealthy"
        statusCode = 503
    }
    
    return c.Status(statusCode).JSON(HealthStatus{
        Status:    status,
        Version:   config.Version,
        Timestamp: time.Now(),
        Uptime:    time.Since(startTime).String(),
        Checks:    checks,
    })
}

// Exemplo de response:
// {
//   "status": "healthy",
//   "version": "1.0.0",
//   "timestamp": "2026-01-30T10:30:00Z",
//   "uptime": "72h30m15s",
//   "checks": {
//     "postgresql": { "status": "healthy", "latency": "2.3ms" },
//     "redis": { "status": "healthy", "latency": "0.8ms" },
//     "chatwoot": { "status": "healthy", "latency": "45ms" },
//     "disk": { "status": "healthy", "message": "85% available" }
//   }
// }
```

### 5.4 Health Check no Docker/Swarm

```yaml
# docker-compose.yml
services:
  whatpro-api:
    image: whatpro/hub-api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
```

---

## 6. Melhores Práticas de Integração com Chatwoot

### 6.1 Estratégias de Autenticação

```
┌─────────────────────────────────────────────────────────────────────┐
│              FLUXO DE AUTENTICAÇÃO COMPLETO                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CENÁRIO 1: Dashboard Script (Super Admin)                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                  │
│  │ Chatwoot │─────▶│  Script  │─────▶│ WhatPro  │                  │
│  │          │Cookie│  (DOM)   │POST  │   API    │                  │
│  └──────────┘      └──────────┘      └──────────┘                  │
│                                                                     │
│  1. Script lê cookie 'cw_d_session_info'                           │
│  2. Extrai: access-token, client, uid                              │
│  3. Envia para WhatPro API via POST /auth/sso                      │
│  4. WhatPro valida contra Chatwoot API                             │
│  5. Retorna JWT próprio do WhatPro Hub                             │
│                                                                     │
│  CENÁRIO 2: Dashboard App (iframe)                                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                  │
│  │ Chatwoot │─────▶│  iframe  │─────▶│ WhatPro  │                  │
│  │          │postMsg│ (App)   │API   │   API    │                  │
│  └──────────┘      └──────────┘      └──────────┘                  │
│                                                                     │
│  1. Chatwoot envia AUTH_TOKEN via postMessage                      │
│  2. App recebe e envia para WhatPro API                            │
│  3. Mesma validação do cenário 1                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Validação de Token contra Chatwoot

```go
// services/chatwoot_auth.go
package services

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)

type ChatwootToken struct {
    AccessToken string `json:"access-token"`
    Client      string `json:"client"`
    UID         string `json:"uid"`
    TokenType   string `json:"token-type"`
}

type ChatwootUser struct {
    ID                int64  `json:"id"`
    AccountID         int64  `json:"account_id"`
    Email             string `json:"email"`
    Name              string `json:"name"`
    Role              string `json:"role"`
    AvailabilityStatus string `json:"availability_status"`
}

func ValidateChatwootToken(ctx context.Context, token ChatwootToken) (*ChatwootUser, error) {
    req, _ := http.NewRequestWithContext(ctx, "GET", 
        config.ChatwootURL + "/api/v1/profile", nil)
    
    // Headers de autenticação do Chatwoot
    req.Header.Set("access-token", token.AccessToken)
    req.Header.Set("client", token.Client)
    req.Header.Set("uid", token.UID)
    req.Header.Set("token-type", "Bearer")
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("chatwoot unreachable: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return nil, fmt.Errorf("invalid token: status %d", resp.StatusCode)
    }
    
    var user ChatwootUser
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("decode error: %w", err)
    }
    
    return &user, nil
}
```

### 6.3 Webhooks do Chatwoot

```go
// handlers/webhooks.go
package handlers

// Eventos disponíveis do Chatwoot:
// - conversation_created
// - conversation_status_changed
// - conversation_updated
// - message_created
// - message_updated
// - webwidget_triggered

type WebhookPayload struct {
    Event            string          `json:"event"`
    ID               int64           `json:"id"`
    Account          AccountPayload  `json:"account"`
    Conversation     ConvPayload     `json:"conversation,omitempty"`
    MessageType      string          `json:"message_type,omitempty"`
    Content          string          `json:"content,omitempty"`
    ContentType      string          `json:"content_type,omitempty"`
    Sender           SenderPayload   `json:"sender,omitempty"`
}

func HandleChatwootWebhook(c *fiber.Ctx) error {
    // Verificar assinatura HMAC
    signature := c.Get("X-Chatwoot-Signature")
    if !verifySignature(c.Body(), signature) {
        return c.Status(401).JSON(fiber.Map{"error": "Invalid signature"})
    }
    
    var payload WebhookPayload
    if err := c.BodyParser(&payload); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
    }
    
    // Processar assincronamente
    go processWebhook(payload)
    
    // Resposta imediata (Chatwoot espera 200)
    return c.SendStatus(200)
}

func processWebhook(payload WebhookPayload) {
    switch payload.Event {
    case "conversation_created":
        // Criar card no Kanban automaticamente
        kanbanService.CreateCardFromConversation(payload.Conversation)
        
    case "conversation_status_changed":
        // Mover card no Kanban
        kanbanService.MoveCardByStatus(payload.Conversation)
        
    case "message_created":
        // Atualizar timestamp, notificar, etc.
        notificationService.NotifyNewMessage(payload)
    }
}
```

### 6.4 Sincronização de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│              ESTRATÉGIA DE SINCRONIZAÇÃO                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DADOS MASTER NO CHATWOOT (read-only no WhatPro):                  │
│  ├── Accounts (empresas)                                            │
│  ├── Users (usuários)                                               │
│  ├── Conversations                                                  │
│  ├── Messages                                                       │
│  ├── Contacts                                                       │
│  └── Inboxes                                                        │
│                                                                     │
│  DADOS MASTER NO WHATPRO (gerenciados localmente):                 │
│  ├── Kanban Boards/Stages/Cards                                     │
│  ├── Providers (Evolution API, etc)                                 │
│  ├── Automações customizadas                                        │
│  ├── Templates de mensagem                                          │
│  ├── Métricas estendidas                                            │
│  └── Configurações de integração                                    │
│                                                                     │
│  ESTRATÉGIA DE SYNC:                                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Webhook-driven (tempo real)                                │  │
│  │    - Conversas novas → criar card                            │  │
│  │    - Status mudou → mover card                               │  │
│  │    - Usuário criado → sync local                             │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 2. Polling backup (a cada 5 min)                              │  │
│  │    - Verificar consistência                                   │  │
│  │    - Recuperar webhooks perdidos                              │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ 3. Full sync (diário, 3am)                                    │  │
│  │    - Reconciliação completa                                   │  │
│  │    - Limpeza de dados órfãos                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Segurança Enterprise & Compliance

### 7.1 Requisitos SOC 2

```
┌─────────────────────────────────────────────────────────────────────┐
│              SOC 2 TRUST SERVICES CRITERIA                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ SECURITY (Obrigatório)                                          │
│  ├── Firewall e network segmentation                                │
│  ├── Encryption at rest e in transit                                │
│  ├── Access control (RBAC implementado)                             │
│  ├── Vulnerability management                                       │
│  └── Incident response plan                                         │
│                                                                     │
│  ✅ AVAILABILITY (Recomendado para SaaS)                            │
│  ├── SLA de 99.9% uptime                                            │
│  ├── Disaster recovery plan                                         │
│  ├── Redundância de infraestrutura                                  │
│  └── Monitoramento 24/7                                             │
│                                                                     │
│  ✅ PROCESSING INTEGRITY (Recomendado)                              │
│  ├── Input validation                                               │
│  ├── Output verification                                            │
│  ├── Error handling                                                 │
│  └── Audit trails                                                   │
│                                                                     │
│  ✅ CONFIDENTIALITY (Obrigatório para dados sensíveis)              │
│  ├── Data classification                                            │
│  ├── Encryption                                                     │
│  ├── Access restrictions                                            │
│  └── Secure disposal                                                │
│                                                                     │
│  ⚠️ PRIVACY (Se processar PII)                                      │
│  ├── Consent management                                             │
│  ├── Data retention policies                                        │
│  ├── LGPD compliance                                                │
│  └── Data subject rights                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Implementação de Segurança

```go
// middleware/security.go
package middleware

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/helmet"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/csrf"
)

func SetupSecurity(app *fiber.App) {
    // 1. Security Headers (OWASP)
    app.Use(helmet.New(helmet.Config{
        XSSProtection:         "1; mode=block",
        ContentTypeNosniff:    "nosniff",
        XFrameOptions:         "SAMEORIGIN",
        HSTSMaxAge:            31536000,
        HSTSIncludeSubdomains: true,
        ContentSecurityPolicy: "default-src 'self'",
        ReferrerPolicy:        "strict-origin-when-cross-origin",
    }))
    
    // 2. CORS Restritivo
    app.Use(cors.New(cors.Config{
        AllowOrigins:     config.AllowedOrigins, // Apenas domínios conhecidos
        AllowMethods:     "GET,POST,PUT,DELETE,PATCH",
        AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
        AllowCredentials: true,
        MaxAge:           3600,
    }))
    
    // 3. Rate Limiting
    app.Use(limiter.New(limiter.Config{
        Max:        100,              // 100 requests
        Expiration: 60 * time.Second, // por minuto
        KeyGenerator: func(c *fiber.Ctx) string {
            // Rate limit por IP + User (se autenticado)
            if user := c.Locals("user"); user != nil {
                return fmt.Sprintf("%s:%d", c.IP(), user.(*models.User).ID)
            }
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(429).JSON(fiber.Map{
                "error": "Too many requests",
                "retry_after": 60,
            })
        },
    }))
    
    // 4. CSRF Protection (para forms)
    app.Use(csrf.New(csrf.Config{
        KeyLookup:      "header:X-CSRF-Token",
        CookieName:     "csrf_",
        CookieSameSite: "Strict",
        Expiration:     1 * time.Hour,
    }))
}

// 5. Input Validation
func ValidateInput(c *fiber.Ctx, payload interface{}) error {
    if err := c.BodyParser(payload); err != nil {
        return fiber.NewError(400, "Invalid JSON")
    }
    
    validate := validator.New()
    if err := validate.Struct(payload); err != nil {
        return fiber.NewError(400, formatValidationErrors(err))
    }
    
    return nil
}

// 6. SQL Injection Prevention (usando ORM/Query Builder)
// NUNCA use concatenação de strings para queries
func GetUserByEmail(email string) (*User, error) {
    var user User
    // ✅ CORRETO: Parameterized query
    err := db.Where("email = ?", email).First(&user).Error
    
    // ❌ ERRADO: String concatenation (SQL Injection!)
    // err := db.Raw("SELECT * FROM users WHERE email = '" + email + "'")
    
    return &user, err
}
```

### 7.3 Audit Logging

```go
// services/audit.go
package services

type AuditLog struct {
    ID          uuid.UUID       `json:"id"`
    Timestamp   time.Time       `json:"timestamp"`
    UserID      uuid.UUID       `json:"user_id"`
    AccountID   uuid.UUID       `json:"account_id"`
    Action      string          `json:"action"`      // "create", "update", "delete", "login"
    Resource    string          `json:"resource"`    // "user", "kanban_card", "provider"
    ResourceID  string          `json:"resource_id"`
    IPAddress   string          `json:"ip_address"`
    UserAgent   string          `json:"user_agent"`
    OldValue    json.RawMessage `json:"old_value,omitempty"`
    NewValue    json.RawMessage `json:"new_value,omitempty"`
    Status      string          `json:"status"`      // "success", "failure"
}

func LogAuditEvent(ctx context.Context, log AuditLog) error {
    log.ID = uuid.New()
    log.Timestamp = time.Now().UTC()
    
    // Inserir no banco de audit (tabela separada ou particionada)
    return db.Create(&log).Error
}

// Middleware para auto-logging
func AuditMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Capturar antes
        start := time.Now()
        
        // Processar request
        err := c.Next()
        
        // Log após
        if user := c.Locals("user"); user != nil {
            go LogAuditEvent(context.Background(), AuditLog{
                UserID:    user.(*models.User).ID,
                AccountID: user.(*models.User).AccountID,
                Action:    c.Method(),
                Resource:  c.Path(),
                IPAddress: c.IP(),
                UserAgent: c.Get("User-Agent"),
                Status:    getStatus(c.Response().StatusCode()),
            })
        }
        
        return err
    }
}
```

### 7.4 Encryption

```go
// utils/crypto.go
package utils

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
)

// Encryption at Rest para dados sensíveis
func EncryptSensitiveData(plaintext string, key []byte) (string, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)
    
    nonce := make([]byte, gcm.NonceSize())
    rand.Read(nonce)
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Usar para:
// - API Keys de providers
// - Tokens de integração
// - Dados PII sensíveis
```

---

## 8. Funcionalidades Não Mencionadas (Oportunidades)

### 8.1 Features Avançadas para Diferenciação

```
┌─────────────────────────────────────────────────────────────────────┐
│          FUNCIONALIDADES ADICIONAIS RECOMENDADAS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔥 AI/ML FEATURES                                                  │
│  ├── Classificação automática de leads (score)                      │
│  ├── Sugestão de respostas baseada em histórico                    │
│  ├── Detecção de sentimento em tempo real                          │
│  ├── Resumo automático de conversas                                │
│  └── Previsão de churn de clientes                                 │
│                                                                     │
│  📊 ANALYTICS AVANÇADO                                              │
│  ├── Dashboard de tempo de resposta por agente/time                │
│  ├── Funil de conversão do Kanban                                  │
│  ├── Heat map de horários de pico                                  │
│  ├── Análise de palavras-chave mais frequentes                     │
│  └── Exportação para BI (PowerBI, Metabase)                        │
│                                                                     │
│  🤖 AUTOMAÇÕES                                                      │
│  ├── Workflow builder visual (estilo N8N)                          │
│  ├── Triggers: tempo inativo, palavras-chave, horário              │
│  ├── Actions: mover card, notificar, atribuir, tagear              │
│  ├── Integração nativa com N8N para flows complexos               │
│  └── Agendamento de mensagens                                      │
│                                                                     │
│  📱 OMNICHANNEL ESTENDIDO                                           │
│  ├── Painel unificado de todos os providers WhatsApp               │
│  ├── Multi-number management                                        │
│  ├── Fallback automático entre números                             │
│  └── Health check de conexões                                      │
│                                                                     │
│  👥 GESTÃO DE TIMES                                                 │
│  ├── Escalas de trabalho (shifts)                                  │
│  ├── Distribuição inteligente (round-robin avançado)              │
│  ├── Capacity planning por agente                                  │
│  └── Gamification (ranking, metas, badges)                         │
│                                                                     │
│  📝 TEMPLATES & MACROS                                              │
│  ├── Biblioteca de templates por categoria                         │
│  ├── Variáveis dinâmicas (nome, empresa, etc)                     │
│  ├── Macros com múltiplas ações                                   │
│  └── Compartilhamento entre times                                  │
│                                                                     │
│  🔔 NOTIFICAÇÕES AVANÇADAS                                          │
│  ├── Push notifications (PWA)                                      │
│  ├── Integração Slack/Discord/Teams                                │
│  ├── SMS alerts para SLA crítico                                   │
│  └── Email digest diário/semanal                                   │
│                                                                     │
│  📋 COMPLIANCE & AUDITORIA                                          │
│  ├── Exportação de logs para SIEM                                  │
│  ├── Relatório de acesso (quem viu o quê)                         │
│  ├── LGPD: anonimização e exclusão de dados                       │
│  └── Backup automático com retenção configurável                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Integrações Externas

```
┌─────────────────────────────────────────────────────────────────────┐
│               INTEGRAÇÕES RECOMENDADAS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CRM                                                                 │
│  ├── Hubspot                                                        │
│  ├── Pipedrive                                                      │
│  ├── RD Station                                                     │
│  └── Salesforce                                                     │
│                                                                     │
│  PAGAMENTOS                                                          │
│  ├── Stripe                                                         │
│  ├── Asaas                                                          │
│  └── PagSeguro                                                      │
│                                                                     │
│  E-COMMERCE                                                          │
│  ├── Shopify                                                        │
│  ├── WooCommerce                                                    │
│  ├── Nuvemshop                                                      │
│  └── VTEX                                                           │
│                                                                     │
│  CALENDAR & SCHEDULING                                               │
│  ├── Google Calendar                                                │
│  ├── Calendly                                                       │
│  └── Microsoft Outlook                                              │
│                                                                     │
│  AI PROVIDERS                                                        │
│  ├── OpenAI (GPT-4)                                                 │
│  ├── Anthropic (Claude)                                             │
│  ├── Google (Gemini)                                                │
│  └── Groq (LLaMA ultra-rápido)                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Estrutura de Projeto Final

```
whatpro-hub/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Tests, lint, build
│   │   ├── cd.yml              # Deploy to staging/production
│   │   └── security.yml        # Dependency scanning
│   └── CODEOWNERS
│
├── apps/
│   ├── api/                    # Backend Go
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── config/         # Configuration
│   │   │   ├── handlers/       # HTTP handlers
│   │   │   ├── middleware/     # Auth, logging, etc
│   │   │   ├── models/         # Database models
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── services/       # Business logic
│   │   │   └── utils/          # Helpers
│   │   ├── pkg/
│   │   │   └── chatwoot/       # Chatwoot SDK
│   │   ├── migrations/         # SQL migrations
│   │   ├── Dockerfile
│   │   └── go.mod
│   │
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/     # UI Components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities
│   │   │   ├── services/       # API clients
│   │   │   └── stores/         # Zustand stores
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── worker/                 # Background jobs
│       ├── cmd/
│       │   └── worker/
│       │       └── main.go
│       ├── internal/
│       │   └── jobs/
│       └── Dockerfile
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── chatwoot-script/        # Dashboard Script source
│
├── deploy/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/             # K8s manifests (opcional)
│   └── terraform/              # IaC (opcional)
│
├── docs/
│   ├── api/                    # OpenAPI specs
│   ├── architecture/           # ADRs, diagramas
│   └── runbooks/               # Operações
│
├── scripts/
│   ├── setup.sh
│   ├── seed.sh
│   └── backup.sh
│
├── .env.example
├── Makefile
└── README.md
```

---

## 10. Roadmap de Implementação

### Fase 1: Fundação (Semanas 1-4)
- [ ] Setup do projeto (Go + Next.js)
- [ ] Implementar Auth/SSO com Chatwoot
- [ ] RBAC básico (super_admin, admin, agent)
- [ ] Health checks
- [ ] Docker compose para desenvolvimento
- [ ] CI/CD básico

### Fase 2: Hub Core (Semanas 5-8)
- [ ] CRUD de Providers
- [ ] Sync de Accounts/Users do Chatwoot
- [ ] Webhook receiver
- [ ] Painel admin básico

### Fase 3: Kanban (Semanas 9-14)
- [ ] Modelo de dados (Boards, Stages, Cards)
- [ ] Integração com conversas Chatwoot
- [ ] Drag & drop frontend
- [ ] Automações básicas

### Fase 4: Features Avançadas (Semanas 15-20)
- [ ] Chat interno
- [ ] Templates de mensagem
- [ ] Analytics dashboard
- [ ] Integrações externas

### Fase 5: Enterprise (Semanas 21-26)
- [ ] Audit logging completo
- [ ] Preparação SOC 2
- [ ] Multi-tenancy avançado
- [ ] White-label

---

## 11. Conclusões e Recomendações

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Linguagem Backend** | Go (Fiber) | Performance + Ecosystem + Hiring |
| **Framework Frontend** | Next.js 15 | SSR + App Router + Ecosystem |
| **Database** | PostgreSQL 16 | ACID + JSONB + RLS |
| **Cache** | Redis 7 | Sessions + Queues + Pub/Sub |
| **Sistema Único ou Dois** | **Sistema Único** | Menos complexidade, mais consistência |
| **Começar por** | **Backend + API** | Define contratos, segurança primeiro |
| **Deploy** | Docker Swarm | Já familiar, escalável |

### Próximos Passos Imediatos:

1. **Validar arquitetura** com este documento
2. **Setup inicial** do projeto Go + Next.js
3. **Implementar Auth/SSO** como primeira feature
4. **Criar SDK local** para Chatwoot API

---

*Documento preparado para WhatPro Hub v1.0*
*Arquitetura Enterprise-Grade com foco em Compliance e Performance*
