<!--
SYNC IMPACT REPORT
Version change: [template] → 1.0.0
Added sections: Core Principles (I–VII), Stack & Technology Constraints, Development Workflow, Governance
Modified principles: N/A (first ratification)
Removed sections: all placeholder tokens replaced
Templates updated:
  ✅ .specify/memory/constitution.md (this file)
  ✅ .specify/templates/plan-template.md (Constitution Check updated)
  ⚠  .specify/memory/plan-security-middleware.md (already aligned — no changes needed)
Deferred TODOs: none
-->

# WhatPro Hub Constitution

## Core Principles

### I. Security-First

Every feature MUST be analyzed for security implications before implementation begins.

- Input MUST be validated at all API boundaries using `go-playground/validator/v10`
- Rate limiting MUST be applied at both IP level (pre-auth) and Role level (post-auth)
- CORS MUST use an explicit origin whitelist; wildcard (`*`) is PROHIBITED in production
- Secrets and sensitive fields (API keys, tokens, passwords) MUST NOT appear in logs or
  error responses
- Authentication MUST use JWT with HTTPOnly refresh tokens and server-side revocation
- New external dependencies MUST be audited for known CVEs before adoption

### II. Hierarchical RBAC (RBAC Hierárquico)

All protected endpoints MUST enforce role-based access control via the `RequireRole()`
middleware — no ad-hoc role checks inside handlers.

- Role hierarchy (ascending privilege): `agent` → `supervisor` → `admin` → `super_admin`
- Rate limit ceilings MUST reflect role hierarchy (higher privilege = higher ceiling)
- Every new endpoint MUST declare its minimum required role in the feature plan
- `super_admin` is the only role that may operate across tenant boundaries

### III. API-First Design

All features MUST expose functionality via a well-defined RESTful HTTP API.

- Response envelope MUST be consistent: `{ "success": bool, "error"?: string,
  "status": int, "data"?: any, "details"?: [] }`
- HTTP status codes MUST be semantically correct (400 validation, 401 unauth,
  403 forbidden, 404 not found, 429 rate limit, 500 internal)
- All public endpoints MUST be documented in OpenAPI/Swagger (`/swagger/index.html`)
- Breaking API changes REQUIRE a new version prefix (e.g., `/api/v2/`)

### IV. Test-Driven Development (TDD)

Acceptance criteria MUST be defined in the spec (`spec.md`) before any implementation begins.

- Unit tests MUST cover middleware, validators, custom validators, and services
- Integration tests MUST cover: auth flow, tenant isolation, and audit logging paths
- Tests MUST be written to fail first; implementation follows the Red-Green-Refactor cycle
- CI pipeline MUST block merges on failing tests or build errors

### V. Tenant Isolation

Every database query on tenant-scoped resources MUST include an `account_id` filter.

- The `RequireAccountAccess()` middleware MUST be applied to all account-scoped route groups
- Repository methods MUST accept and apply an `accountID` scope parameter; returning
  data across tenants without explicit justification is a CRITICAL security defect (P0)
- RLS (Row-Level Security) at the database level SHOULD be configured as defense-in-depth
- Cross-tenant data leakage MUST be treated as a security incident requiring immediate hotfix

### VI. Async & Non-Blocking

The request lifecycle MUST NOT block on non-critical I/O operations.

- Audit logging, notification dispatch, and background sync MUST be performed asynchronously
- Goroutines spawned for async operations MUST recover from panics and log errors — silent
  failures are prohibited
- Background workers MUST use Redis queues with retry and dead-letter logic
- Async failure MUST NOT cause the originating HTTP request to fail (graceful degradation)

### VII. Observability

All write operations (POST, PUT, DELETE) MUST generate an audit log entry.

- Audit logs MUST be immutable — UPDATE and DELETE on `audit_logs` are PROHIBITED
- Structured logging MUST be used (JSON format in production, human-readable in development)
- Sensitive fields MUST be redacted or omitted in logs via `SanitizeForAudit()` before writing
- Error responses MUST log full context server-side while returning only safe messages to clients
- Health check endpoints (`/health/*`) MUST be unauthenticated and excluded from rate limiting

---

## Stack & Technology Constraints

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Go | 1.22+ |
| HTTP Framework | Fiber | v2 |
| ORM | GORM | latest stable |
| Database | PostgreSQL | 16 |
| Cache / Queue | Redis | 7 |
| Validation | go-playground/validator | v10 |
| Architecture | Modular Monolith | — |

Microservice decomposition is PROHIBITED unless a single component demonstrates sustained
load that cannot be resolved by horizontal scaling of the monolith.

## Development Workflow

Features follow the Spec-Driven Development (SDD) workflow:

1. `/speckit.specify` → feature spec (`spec.md`)
2. `/speckit.plan` → implementation plan (`plan.md`)
3. `/speckit.tasks` → task breakdown (`tasks.md`)
4. `/speckit.analyze` → cross-artifact consistency check
5. `/speckit.implement` → execution

Feature branches MUST follow the naming convention: `###-feature-name`
(e.g., `001-security-middleware`).

All features MUST pass the Constitution Check in `plan.md` before implementation.

## Governance

- This constitution supersedes all other practices, agent guidelines, and per-feature
  decisions unless explicitly overridden with documented justification
- Amendments require: (1) change description, (2) semantic version bump, (3) migration
  plan for affected specs/plans/tasks, (4) propagation to templates
- Version bump policy:
  - **MAJOR**: Principle removed, renamed, or fundamentally redefined
  - **MINOR**: New principle or section added, or material expansion of existing guidance
  - **PATCH**: Wording clarification, typo fix, non-semantic refinement
- All PRs touching security-critical paths MUST include a Constitution Check annotation
  in the PR description

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
