# WhatPro Hub (Backend)

> **Enterprise WhatsApp Manager & Kanban CRM**  
> High-performance, secure backend for managing WhatsApp interactions, CRM workflows, and multi-tenant operations.

![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)
![Fiber](https://img.shields.io/badge/Fiber-v2-black?style=flat&logo=gofiber)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

## 🏗️ Architecture

WhatPro Hub uses a **Modular Monolith** architecture designed for scalability and strict tenant isolation.

### Core Components

- **API Gateway (Fiber)**: RESTful API with strict middleware chains.
- **Service Layer**: Business logic decoupled from HTTP transport.
- **Repository Layer**: Data access using GORM with scope validation.
- **Background Workers**: Async processing via Redis (planned).

### Security Features (🛡️ Implemented)

- **Tenant Isolation**: Strict `account_id` scoping middleware (`RequireAccountAccess`).
- **Authentication**:
  - **Session Management**: Device tracking, Revocation, Refresh Tokens (HTTPOnly).
  - **API Keys**: Server-to-server auth with SHA-256 hashing.
- **Role-Based Access Control (RBAC)**: Granular permissions (`super_admin`, `admin`, `agent`).
- **Rate Limiting**: Multi-layer protection (IP-based + Role-based).
- **Entitlements**: Hard limits on resources based on account plans (`max_agents`, `max_teams`).
- **Audit Logging**: Comprehensive activity tracking for compliance.

## 🚀 Getting Started

### ⚡ Quick Install (Recommended)

Use our fail-proof installer to set up the entire environment (infra, docker, apps) automatically:

```bash
cd installer
bash whatpro-setup
```

[Read the Full Installation Guide](installer/INSTALL.md)

### Manual Prerequisites

- **Go 1.22+**
- **Docker & Docker Compose**
- **PostgreSQL 16**
- **Redis 7**

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/odanieltavares/whatpro-hub.git
   cd whatpro-hub
   ```

2. **Environment Setup**
   Copy the example environment file:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

3. **Run Infrastructure**
   Start DB and Redis:

   ```bash
   docker-compose up -d db redis
   ```

4. **Run Application**

   ```bash
   cd apps/api
   go mod tidy
   go run cmd/server/main.go
   ```

   API will be available at `http://localhost:8080/api/v1`.
   Swagger Docs at `http://localhost:8080/swagger/index.html`.

## 📚 API Documentation

### Authentication

- `POST /auth/sso`: Authenticate via Chatwoot SSO.
- `POST /auth/refresh`: Rotate access tokens.

### Core Resources

All resource endpoints require `Authorization: Bearer <token>` and are scoped to an account.

- `GET /accounts/:accountId/users`
- `GET /accounts/:accountId/teams`
- `GET /accounts/:accountId/providers`
- `GET /accounts/:accountId/boards`

## 🧪 Testing

Run strict backend verification:

```bash
./verify_backend.sh
```

## 📜 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
