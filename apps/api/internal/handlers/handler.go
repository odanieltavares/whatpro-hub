// Package handlers provides HTTP handlers for the API
package handlers

import (
	"log"
	"os"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"whatpro-hub/internal/config"
	"whatpro-hub/internal/middleware"
	"whatpro-hub/internal/repositories"
	"whatpro-hub/internal/services"
)

// Handler holds all dependencies for API handlers
type Handler struct {
	DB              *gorm.DB
	Redis           *redis.Client
	Config              *config.Config
	AccountService      *services.AccountService
	ProviderService     *services.ProviderService
	TeamService         *services.TeamService
	UserService         *services.UserService
	AuthService         *services.AuthService
	EntitlementsService *services.EntitlementsService // Added EntitlementsService
	AuditService        *services.AuditService
	KanbanService       *services.KanbanService
	GatewayService      *services.GatewayService
	BillingService      *services.BillingService
	Validator           *validator.Validate
	Logger              *log.Logger
}

// NewHandler creates a new Handler with dependencies
func NewHandler(db *gorm.DB, rdb *redis.Client, cfg *config.Config) *Handler {
	// Initialize repositories
	accountRepo := repositories.NewAccountRepository(db)
	providerRepo := repositories.NewProviderRepository(db)
	teamRepo := repositories.NewTeamRepository(db)
	userRepo := repositories.NewUserRepository(db)
	auditRepo := repositories.NewAuditRepository(db)
	kanbanRepo := repositories.NewKanbanRepository(db)
	gatewayRepo := repositories.NewGatewayRepository(db)
	billingRepo := repositories.NewBillingRepository(db)
	sessionRepo := repositories.NewSessionRepository(db)

	// Initialize services
	accountService := services.NewAccountService(accountRepo, cfg.ChatwootURL, cfg.ChatwootAPIKey)
	auditService := services.NewAuditService(auditRepo)
	teamService := services.NewTeamService(teamRepo)
	userService := services.NewUserService(userRepo)
	authService := services.NewAuthService(sessionRepo, userRepo)
	entitlementsService := services.NewEntitlementsService(db) // Initialize EntitlementsService
	kanbanService := services.NewKanbanService(kanbanRepo)
	gatewayService := services.NewGatewayService(gatewayRepo, nil, accountRepo) // TODO: Add ProviderRepo
	billingService := services.NewBillingService(billingRepo, userRepo, "ASAAS_API_KEY")

	// Provider service needs encryption key (32 bytes for AES-256)
	// You should set ENCRYPTION_KEY in your .env file
	encryptionKey := getEnv("ENCRYPTION_KEY", "12345678901234567890123456789012") // 32 bytes
	providerService, err := services.NewProviderService(providerRepo, encryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize provider service: %v", err)
	}

	return &Handler{
		DB:                  db,
		Redis:               rdb,
		Config:              cfg,
		AccountService:      accountService,
		ProviderService:     providerService,
		TeamService:         teamService,
		UserService:         userService,
		AuthService:         authService,
		EntitlementsService: entitlementsService, // Injected EntitlementsService
		AuditService:        auditService,
		KanbanService:       kanbanService,
		GatewayService:      gatewayService,
		BillingService:      billingService,
		Validator:           middleware.GetValidator(),
		Logger:              log.Default(),
	}
}

// getEnv gets an environment variable or returns a default
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// ErrorHandler is the global error handler
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   message,
		"status":  code,
		"success": false,
	})
}

// ============================================================================
// Response Helpers
// ============================================================================

// Success helper for consistent API responses
func (h *Handler) Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

// SuccessWithMeta helper for paginated responses
func (h *Handler) SuccessWithMeta(c *fiber.Ctx, data interface{}, meta interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
		"meta":    meta,
	})
}

// Error helper for error responses
func (h *Handler) Error(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{
		"success": false,
		"error":   message,
		"status":  status,
	})
}

// ============================================================================
// Validation Helper
// ============================================================================

// Validate parses the request body and validates it against the struct tags
// Returns nil if validation passes, or sends a 400 error response and returns error
func (h *Handler) Validate(c *fiber.Ctx, req interface{}) error {
	// Parse request body
	if err := c.BodyParser(req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body: "+err.Error())
	}

	// Validate struct
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

// ValidateQuery validates query parameters
func (h *Handler) ValidateQuery(c *fiber.Ctx, req interface{}) error {
	// Parse query parameters
	if err := c.QueryParser(req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid query parameters: "+err.Error())
	}

	// Validate struct
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

// ============================================================================
// Audit Helpers
// ============================================================================

// Audit logs an action asynchronously (does not block request)
func (h *Handler) Audit(c *fiber.Ctx, action services.AuditAction, resourceType, resourceID string, oldValue, newValue interface{}) {
	h.AuditService.Log(c, action, resourceType, resourceID, oldValue, newValue)
}

// AuditCreate logs a create action
func (h *Handler) AuditCreate(c *fiber.Ctx, resourceType, resourceID string, newValue interface{}) {
	h.AuditService.Log(c, services.AuditActionCreate, resourceType, resourceID, nil, newValue)
}

// AuditUpdate logs an update action
func (h *Handler) AuditUpdate(c *fiber.Ctx, resourceType, resourceID string, oldValue, newValue interface{}) {
	h.AuditService.Log(c, services.AuditActionUpdate, resourceType, resourceID, oldValue, newValue)
}

// AuditDelete logs a delete action
func (h *Handler) AuditDelete(c *fiber.Ctx, resourceType, resourceID string, oldValue interface{}) {
	h.AuditService.Log(c, services.AuditActionDelete, resourceType, resourceID, oldValue, nil)
}
