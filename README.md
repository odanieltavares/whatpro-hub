# WhatPro Hub

**Plataforma de integração nativa com Chatwoot para gestão de atendimento, automação e operações.**

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose
- Go 1.22+ (para desenvolvimento local)
- Git

### 1. Clone e Configure

```bash
# Clone o repositório
git clone https://github.com/whatpro/whatpro-hub.git
cd whatpro-hub

# Copie o arquivo de ambiente
cp deploy/docker/.env.example deploy/docker/.env

# Edite as variáveis conforme necessário
nano deploy/docker/.env
```

### 2. Inicie a Stack

```bash
cd deploy/docker

# Inicie todos os serviços
docker-compose up -d

# Acompanhe os logs
docker-compose logs -f
```

### 3. Acesse os Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Chatwoot** | http://localhost:8080 | Plataforma de atendimento |
| **WhatPro Hub API** | http://localhost:3001 | API do Hub |
| **Portainer** | http://localhost:9000 | Gerenciador Docker |
| **Traefik Dashboard** | http://localhost:8081 | Proxy reverso |

### 4. Primeiro Acesso ao Chatwoot

1. Acesse http://localhost:8080
2. Crie sua conta de administrador
3. Configure sua primeira inbox

---

## 📁 Estrutura do Projeto

```
whatpro-hub/
├── apps/
│   ├── api/              # Backend Go (Fiber)
│   │   ├── cmd/server/   # Entry point
│   │   ├── internal/     # Código interno
│   │   │   ├── config/   # Configuração
│   │   │   ├── handlers/ # HTTP handlers
│   │   │   ├── middleware/ # JWT, RBAC
│   │   │   ├── models/   # Database models
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── pkg/chatwoot/ # Chatwoot SDK
│   ├── web/              # Frontend Next.js (futuro)
│   └── worker/           # Background jobs (futuro)
│
├── deploy/
│   └── docker/           # Docker Compose
│
├── docs/                 # Documentação
│   ├── WhatPro-Hub-PRD-v1.0.md
│   └── whatpro-hub-architecture.md
│
└── scripts/              # Scripts úteis
```

---

## 🛠️ Stack Tecnológica

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| **Backend** | Go + Fiber | 1.22 |
| **Database** | PostgreSQL + pgvector | 16 |
| **Cache/Queue** | Redis | 7 |
| **Chat Platform** | Chatwoot | v4.10.0 |
| **Proxy** | Traefik | v3.5.3 |
| **Container Management** | Portainer CE | latest |

---

## 🔧 Desenvolvimento

### Build Local do Backend

```bash
cd apps/api

# Instalar dependências
go mod download

# Rodar em desenvolvimento
go run ./cmd/server

# Build
go build -o whatpro-api ./cmd/server
```

### Variáveis de Ambiente

```env
# App
APP_ENV=development
APP_PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/whatpro_hub

# Redis
REDIS_URL=redis://localhost:6379

# Chatwoot
CHATWOOT_URL=http://localhost:8080
CHATWOOT_API_KEY=your-api-key

# JWT
JWT_SECRET=your-secret-key
```

---

## 📖 API Endpoints

### Health Checks

```
GET  /health/live   # Liveness probe
GET  /health/ready  # Readiness probe
GET  /health/deep   # Deep health check
GET  /metrics       # Prometheus metrics
```

### Authentication

```
POST /api/v1/auth/sso     # SSO via Chatwoot
POST /api/v1/auth/refresh # Refresh token
POST /api/v1/auth/logout  # Logout
GET  /api/v1/auth/me      # Current user
```

### Resources

```
# Accounts
GET    /api/v1/accounts
GET    /api/v1/accounts/:id
POST   /api/v1/accounts
PUT    /api/v1/accounts/:id

# Teams
GET    /api/v1/accounts/:id/teams
POST   /api/v1/accounts/:id/teams
...

# Kanban
GET    /api/v1/accounts/:id/boards
GET    /api/v1/boards/:id/stages
GET    /api/v1/boards/:id/cards
POST   /api/v1/boards/:id/cards/:id/move
```

---

## 📄 Documentação

- [PRD - Product Requirements Document](docs/WhatPro-Hub-PRD-v1.0.md)
- [Arquitetura do Sistema](docs/whatpro-hub-architecture.md)

---

## 🔐 Segurança

- JWT para autenticação
- RBAC com 4 níveis (super_admin, admin, supervisor, agent)
- Audit logging
- CORS configurável
- Rate limiting (planejado)

---

## 📝 License

MIT License - WhatPro Solutions
