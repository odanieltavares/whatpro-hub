# Security Middleware - Implementation Plan

> **Spec Reference**: [spec-security-middleware.md](./spec-security-middleware.md)
> **Feature ID**: SEC-001
> **Sprint**: 1 (1-2 weeks)

---

## Constitution Check ✅

Verificando alinhamento com constitution.md:

- [x] **I. Security-First**: Rate limiting + Input validation ✅
- [x] **II. RBAC Hierárquico**: Role-based rate limiting ✅
- [x] **III. API-First Design**: Consistent error responses ✅
- [x] **IV. TDD**: Testes definidos nos acceptance criteria ✅
- [x] **VII. Observability**: Audit logging ✅

---

## Phase 1: Dependencies & Configuration

### 1.1 Add Dependencies

**File**: `apps/api/go.mod`

```bash
go get github.com/go-playground/validator/v10@latest
go get github.com/gofiber/storage/redis/v3@latest
```

### 1.2 Extend Configuration

**File**: `apps/api/internal/config/config.go`

```go
// Add new fields to Config struct:
type Config struct {
    // ... existing fields ...

    // Rate Limiting
    RateLimitPerMinute int      `env:"RATE_LIMIT_PER_MINUTE" default:"100"`
    RateLimitStorage   string   `env:"RATE_LIMIT_STORAGE" default:"memory"` // memory | redis

    // CORS
    AllowedOrigins []string // Parsed from CORS_ALLOWED_ORIGINS

    // Trusted Proxies
    TrustedProxies []string `env:"TRUSTED_PROXIES" default:""`
}
```

---

## Phase 2: Rate Limiting Middleware

### 2.1 IP-Based Rate Limiter

**File**: `apps/api/internal/middleware/rate_limiter.go`

```go
package middleware

import (
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "github.com/gofiber/storage/redis/v3"
    redisClient "github.com/redis/go-redis/v9"

    "whatpro-hub/internal/config"
)

// NewIPRateLimiter creates IP-based rate limiter
func NewIPRateLimiter(cfg *config.Config, rdb *redisClient.Client) fiber.Handler {
    var storage fiber.Storage

    if cfg.RateLimitStorage == "redis" && rdb != nil {
        storage = redis.New(redis.Config{
            Conn: rdb,
        })
    }

    return limiter.New(limiter.Config{
        Max:        cfg.RateLimitPerMinute,
        Expiration: 1 * time.Minute,
        KeyGenerator: func(c *fiber.Ctx) string {
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
                "success":     false,
                "error":       "Too Many Requests",
                "status":      429,
                "retry_after": 60,
            })
        },
        Next: func(c *fiber.Ctx) bool {
            // Skip health checks
            return strings.HasPrefix(c.Path(), "/health")
        },
        Storage: storage,
    })
}
```

### 2.2 Role-Based Rate Limiter

**File**: `apps/api/internal/middleware/role_limiter.go`

```go
package middleware

import (
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/limiter"
)

var roleLimits = map[string]int{
    "agent":       200,
    "supervisor":  500,
    "admin":       1000,
    "super_admin": 0, // unlimited
}

// NewRoleRateLimiter creates role-based rate limiter (after auth)
func NewRoleRateLimiter() fiber.Handler {
    return limiter.New(limiter.Config{
        Max: 200, // default for unknown roles
        MaxFunc: func(c *fiber.Ctx) int {
            role, ok := c.Locals("whatpro_role").(string)
            if !ok {
                return 200
            }
            if limit, exists := roleLimits[role]; exists {
                return limit
            }
            return 200
        },
        Expiration: 1 * time.Minute,
        KeyGenerator: func(c *fiber.Ctx) string {
            userID, _ := c.Locals("user_id").(int)
            return fmt.Sprintf("role_limit:%d", userID)
        },
        Next: func(c *fiber.Ctx) bool {
            role, ok := c.Locals("whatpro_role").(string)
            return ok && role == "super_admin"
        },
    })
}
```

---

## Phase 3: Input Validation

### 3.1 Validator Setup

**File**: `apps/api/internal/middleware/validator.go`

```go
package middleware

import (
    "regexp"

    "github.com/go-playground/validator/v10"
    "github.com/google/uuid"
)

var validate *validator.Validate

func init() {
    validate = validator.New(validator.WithRequiredStructEnabled())

    // Register custom validators
    validate.RegisterValidation("uuid", validateUUID)
    validate.RegisterValidation("phone", validatePhone)
    validate.RegisterValidation("whatpro_role", validateWhatproRole)
}

// GetValidator returns the validator instance
func GetValidator() *validator.Validate {
    return validate
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(s interface{}) []ValidationError {
    var errors []ValidationError

    err := validate.Struct(s)
    if err != nil {
        for _, e := range err.(validator.ValidationErrors) {
            errors = append(errors, ValidationError{
                Field:   e.Field(),
                Message: formatValidationMessage(e),
            })
        }
    }

    return errors
}

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

// Custom validators
func validateUUID(fl validator.FieldLevel) bool {
    _, err := uuid.Parse(fl.Field().String())
    return err == nil
}

func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    match, _ := regexp.MatchString(`^\+[1-9]\d{1,14}$`, phone)
    return match
}

func validateWhatproRole(fl validator.FieldLevel) bool {
    role := fl.Field().String()
    validRoles := []string{"super_admin", "admin", "supervisor", "agent"}
    for _, r := range validRoles {
        if role == r {
            return true
        }
    }
    return false
}

func formatValidationMessage(e validator.FieldError) string {
    switch e.Tag() {
    case "required":
        return e.Field() + " is required"
    case "email":
        return "Invalid email format"
    case "url":
        return "Must be a valid URL"
    case "min":
        return fmt.Sprintf("Must be at least %s characters", e.Param())
    case "max":
        return fmt.Sprintf("Must be at most %s characters", e.Param())
    case "uuid":
        return "Must be a valid UUID"
    case "phone":
        return "Must be a valid phone number (E.164 format)"
    default:
        return "Invalid value"
    }
}
```

### 3.2 Handler Integration

**File**: `apps/api/internal/handlers/handler.go` (modify)

```go
// Add to Handler struct:
Validator *validator.Validate

// Add to NewHandler:
Validator: middleware.GetValidator(),

// Add helper method:
func (h *Handler) Validate(c *fiber.Ctx, req interface{}) error {
    if err := c.BodyParser(req); err != nil {
        return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
    }

    errors := middleware.ValidateStruct(req)
    if len(errors) > 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "success": false,
            "error":   "Validation failed",
            "status":  400,
            "details": errors,
        })
    }

    return nil
}
```

---

## Phase 4: Audit Logging

### 4.1 Audit Repository

**File**: `apps/api/internal/repositories/audit_repository.go`

```go
package repositories

import (
    "gorm.io/gorm"
    "whatpro-hub/internal/models"
)

type AuditRepository struct {
    db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) *AuditRepository {
    return &AuditRepository{db: db}
}

func (r *AuditRepository) Create(log *models.AuditLog) error {
    return r.db.Create(log).Error
}

func (r *AuditRepository) FindByResource(resourceType string, resourceID string) ([]models.AuditLog, error) {
    var logs []models.AuditLog
    err := r.db.Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
        Order("created_at DESC").
        Find(&logs).Error
    return logs, err
}

func (r *AuditRepository) FindByUser(userID int, limit int) ([]models.AuditLog, error) {
    var logs []models.AuditLog
    err := r.db.Where("user_id = ?", userID).
        Order("created_at DESC").
        Limit(limit).
        Find(&logs).Error
    return logs, err
}
```

### 4.2 Audit Service

**File**: `apps/api/internal/services/audit_service.go`

```go
package services

import (
    "encoding/json"

    "github.com/gofiber/fiber/v2"
    "whatpro-hub/internal/models"
    "whatpro-hub/internal/repositories"
)

type AuditService struct {
    repo *repositories.AuditRepository
}

func NewAuditService(repo *repositories.AuditRepository) *AuditService {
    return &AuditService{repo: repo}
}

func (s *AuditService) Log(c *fiber.Ctx, action, resourceType, resourceID string, oldValue, newValue interface{}) error {
    userID, _ := c.Locals("user_id").(int)
    accountID, _ := c.Locals("account_id").(int)

    var oldJSON, newJSON []byte
    if oldValue != nil {
        oldJSON, _ = json.Marshal(oldValue)
    }
    if newValue != nil {
        newJSON, _ = json.Marshal(newValue)
    }

    log := &models.AuditLog{
        UserID:       userID,
        AccountID:    accountID,
        Action:       action,
        ResourceType: resourceType,
        ResourceID:   resourceID,
        OldValue:     string(oldJSON),
        NewValue:     string(newJSON),
        IPAddress:    c.IP(),
        UserAgent:    c.Get("User-Agent"),
    }

    // Async write (don't block request)
    go func() {
        if err := s.repo.Create(log); err != nil {
            // Log error but don't fail
            log.Printf("Audit log error: %v", err)
        }
    }()

    return nil
}
```

---

## Phase 5: CORS Enhancement

### 5.1 CORS Configuration

**File**: `apps/api/cmd/server/main.go` (modify)

```go
// Replace current CORS config:
app.Use(cors.New(cors.Config{
    AllowOrigins: strings.Join(cfg.AllowedOrigins, ","),
    AllowOriginsFunc: func(origin string) bool {
        // In production, validate against whitelist
        if cfg.Env == "production" {
            for _, allowed := range cfg.AllowedOrigins {
                if origin == allowed {
                    return true
                }
            }
            return false
        }
        // In development, allow localhost
        return strings.HasPrefix(origin, "http://localhost")
    },
    AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
    AllowCredentials: true,
    MaxAge:           86400,
}))

// Add startup validation:
if cfg.Env == "production" {
    for _, origin := range cfg.AllowedOrigins {
        if origin == "*" {
            log.Fatal("CORS wildcard (*) not allowed in production")
        }
    }
}
```

---

## Phase 6: Integration

### 6.1 Main.go Middleware Chain

**File**: `apps/api/cmd/server/main.go`

```go
// Order matters! Add after fiber.New():

// 1. Recovery (catch panics)
app.Use(recover.New())

// 2. Logger
app.Use(logger.New())

// 3. Rate Limit by IP (before auth)
app.Use(middleware.NewIPRateLimiter(cfg, rdb))

// 4. CORS
app.Use(cors.New(...))

// 5. Auth routes (public)
// ... existing auth routes ...

// 6. Protected routes with role limiter
protected := api.Group("")
protected.Use(middleware.JWT(cfg.JWTSecret))
protected.Use(middleware.NewRoleRateLimiter()) // After JWT
```

---

## Verification Commands

```bash
# 1. Run unit tests
cd apps/api
go test ./internal/middleware/... -v

# 2. Test rate limiting
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/health/ready
done | tail -20

# 3. Test validation
curl -X POST http://localhost:4000/api/v1/accounts/1/providers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ab"}'  # Should fail (min=3)

# 4. Check audit logs
psql -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

---

## Files Changed Summary

| File                               | Action  | Lines   |
| ---------------------------------- | ------- | ------- |
| `go.mod`                           | Modify  | +2 deps |
| `config/config.go`                 | Modify  | +15     |
| `middleware/rate_limiter.go`       | **New** | ~60     |
| `middleware/role_limiter.go`       | **New** | ~50     |
| `middleware/validator.go`          | **New** | ~100    |
| `repositories/audit_repository.go` | **New** | ~40     |
| `services/audit_service.go`        | **New** | ~50     |
| `handlers/handler.go`              | Modify  | +20     |
| `cmd/server/main.go`               | Modify  | +30     |

**Total**: 5 new files, 4 modified files, ~370 lines

---

## Timeline

| Day | Task                  |
| --- | --------------------- |
| 1   | Dependencies + Config |
| 2   | Rate Limiter (IP)     |
| 3   | Rate Limiter (Role)   |
| 4   | Input Validation      |
| 5   | Audit Service         |
| 6   | Integration + CORS    |
| 7   | Testing + Fixes       |

---

**Ready for Tasks Breakdown**: Yes
**Next Step**: `/speckit.tasks`
