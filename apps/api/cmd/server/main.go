// Package main is the entry point for WhatPro Hub API
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"whatpro-hub/internal/config"
	"whatpro-hub/internal/handlers"
	"whatpro-hub/internal/middleware"
	"whatpro-hub/internal/migrations"
	"whatpro-hub/internal/seeds"

	// Swagger
	"github.com/gofiber/swagger"
	_ "whatpro-hub/docs" // Import docs for side effects
)

// @title WhatPro Hub API
// @version 1.0
// @description Enterprise WhatsApp Manager & Kanban CRM API
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@whatpro.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1
// @schemes http
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// =========================================================================
	// Security Validation (Production)
	// =========================================================================
	if cfg.Env == "production" {
		// Validate CORS is not wildcard in production
		if cfg.CORSOrigins == "*" {
			log.Fatal("SECURITY ERROR: CORS wildcard (*) is not allowed in production. Set CORS_ORIGINS to specific domains.")
		}
		// Validate JWT secret is set
		if cfg.JWTSecret == "" || cfg.JWTSecret == "your-super-secret-jwt-key-change-in-production" {
			log.Fatal("SECURITY ERROR: JWT_SECRET must be set to a strong secret in production")
		}
	}

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:               "WhatPro Hub API",
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		IdleTimeout:           120 * time.Second,
		DisableStartupMessage: cfg.Env == "production",
		ErrorHandler:          handlers.ErrorHandler,
		// Enable trusted proxy headers (X-Forwarded-For, X-Real-IP)
		EnableTrustedProxyCheck: cfg.Env == "production",
		TrustedProxies:          parseTrustedProxies(cfg),
	})

	// =========================================================================
	// Global Middleware (Order Matters!)
	// =========================================================================

	// 1. Recovery - catch panics and return 500
	app.Use(recover.New())

	// 2. Request Logger
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))

	// Initialize database connection (needed for handlers)
	db, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis connection
	rdb, err := config.InitRedis(cfg)
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v - Rate limiting will use in-memory storage", err)
	}

	// 3. IP-Based Rate Limiting (BEFORE authentication)
	// Protects against DDoS and brute force attacks
	rateLimitPerMinute := getEnvInt("RATE_LIMIT_PER_MINUTE", 100)
	useRedisStorage := rdb != nil && cfg.Env == "production"
	
	app.Use(middleware.NewIPRateLimiter(middleware.RateLimiterConfig{
		MaxPerMinute: rateLimitPerMinute,
		UseRedis:     useRedisStorage,
		RedisClient:  rdb,
		SkipPaths:    []string{"/health", "/metrics"},
	}))

	// 4. CORS Configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSOrigins,
		AllowOriginsFunc: func(origin string) bool {
			// In production, strictly validate against whitelist
			if cfg.Env == "production" {
				allowedOrigins := strings.Split(cfg.CORSOrigins, ",")
				for _, allowed := range allowedOrigins {
					if strings.TrimSpace(allowed) == origin {
						return true
					}
				}
				return false
			}
			// In development, allow localhost
			return strings.HasPrefix(origin, "http://localhost") || 
			       strings.HasPrefix(origin, "http://127.0.0.1")
		},
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-ID",
		AllowCredentials: cfg.CORSOrigins != "*",
		MaxAge:           86400, // 24 hours
	}))

	// Run migrations (only in development for safety)
	if cfg.Env == "development" {
		if err := migrations.RunMigrations(db); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
		// Seed Demo Data
		seeds.SeedDemoData(db)
	}

	// Initialize handlers
	h := handlers.NewHandler(db, rdb, cfg)

	// =========================================================================
	// Routes
	// =========================================================================

	// Health checks (public - no rate limiting)
	app.Get("/health/live", h.HealthLive)
	app.Get("/health/ready", h.HealthReady)
	app.Get("/health/deep", h.HealthDeep)
	app.Get("/metrics", h.Metrics)

	app.Get("/metrics", h.Metrics)

	// Swagger Docs
	app.Get("/swagger/*", swagger.HandlerDefault)

	// API v1
	api := app.Group("/api/v1")

	// Billing
	billing := api.Group("/billing")
	billing.Post("/subscribe", h.SubscribeAccount)

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/sso", h.AuthSSO)
	auth.Post("/refresh", h.AuthRefresh)

	// Webhooks (public - Chatwoot will call these)
	webhookHandler := handlers.NewWebhookHandler(cfg)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/chatwoot", webhookHandler.HandleChatwootWebhook)
	webhooks.Post("/evolution/:instanceId", h.HandleEvolutionWebhook) 
	webhooks.Post("/asaas", h.HandleAsaasWebhook) // NEW: Payment Webhook
	webhooks.Post("/test", webhookHandler.HandleWebhookTest) 

	// =========================================================================
	// Protected routes (requires JWT authentication)
	// =========================================================================
	protected := api.Group("")
	protected.Use(middleware.JWT(cfg.JWTSecret, rdb))

	// 5. Role-Based Rate Limiting (AFTER authentication)
	// Applies different limits based on user role
	protected.Use(middleware.NewRoleRateLimiter(rdb))

	// Auth (protected)
	protected.Post("/auth/logout", h.AuthLogout)
	protected.Get("/auth/me", h.AuthMe)

	// Accounts
	accounts := protected.Group("/accounts")
	accounts.Get("/", middleware.RequireRole("super_admin"), h.ListAccounts)
	accounts.Get("/:id", middleware.RequireRole("admin", "super_admin"), h.GetAccount)
	accounts.Post("/", middleware.RequireRole("super_admin"), h.CreateAccount)
	accounts.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateAccount)
	accounts.Post("/sync", middleware.RequireRole("super_admin"), h.SyncAccounts)

	// Teams
	teams := protected.Group("/accounts/:accountId/teams", middleware.RequireAccountAccess())
	teams.Get("/", h.ListTeams)
	teams.Get("/:id", h.GetTeam)
	teams.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateTeam)
	teams.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateTeam)
	teams.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteTeam)

	// Team Members
	teams.Get("/:id/members", h.ListTeamMembers)
	teams.Post("/:id/members", middleware.RequireRole("admin", "super_admin"), h.AddTeamMember)
	teams.Delete("/:id/members/:userId", middleware.RequireRole("admin", "super_admin"), h.RemoveTeamMember)

	// Users/Agents
	users := protected.Group("/accounts/:accountId/users", middleware.RequireAccountAccess())
	users.Get("/", h.ListUsers)
	users.Get("/:id", h.GetUser)
	users.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateUser)
	users.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateUser)
	users.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteUser)

	// Providers
	providers := protected.Group("/accounts/:accountId/providers", middleware.RequireAccountAccess())
	providers.Get("/", h.ListProviders)
	providers.Get("/:id", h.GetProvider)
	providers.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateProvider)
	providers.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateProvider)
	providers.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteProvider)
	providers.Get("/:id/health", h.CheckProviderHealth)

	// Kanban - Boards
	boards := protected.Group("/accounts/:accountId/boards", middleware.RequireAccountAccess())
	boards.Get("/", h.ListBoards)
	boards.Get("/:id", h.GetBoard)
	boards.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateBoard)
	boards.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateBoard)
	boards.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteBoard)

	// Kanban - Stages
	stages := protected.Group("/boards/:boardId/stages")
	stages.Get("/", h.ListStages)
	stages.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateStage)
	stages.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateStage)
	stages.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteStage)
	stages.Post("/reorder", middleware.RequireRole("admin", "supervisor", "super_admin"), h.ReorderStages)

	// Kanban - Cards
	cards := protected.Group("/boards/:boardId/cards")
	cards.Get("/", h.ListCards)
	cards.Get("/:id", h.GetCard)
	cards.Post("/", h.CreateCard)
	cards.Put("/:id", h.UpdateCard)
	cards.Post("/:id/move", h.MoveCard)
	cards.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteCard)

	// =========================================================================
	// Internal Chat Routes
	// =========================================================================
	chatHandler := handlers.NewChatHandler(h.ChatService)
	chat := protected.Group("/accounts/:accountId/chat", middleware.RequireAccountAccess())
	
	// Rooms
	chat.Get("/rooms", chatHandler.ListRooms)
	chat.Post("/rooms", chatHandler.CreateRoom)
	chat.Get("/rooms/:roomId", chatHandler.GetRoom)
	
	// Members
	chat.Post("/rooms/:roomId/members", chatHandler.AddMember)
	chat.Delete("/rooms/:roomId/members/:userId", chatHandler.RemoveMember)
	
	// Messages
	chat.Get("/rooms/:roomId/messages", chatHandler.ListMessages)
	chat.Post("/rooms/:roomId/messages", chatHandler.SendMessage)
	chat.Delete("/messages/:messageId", chatHandler.DeleteMessage)
	
	// Read Status
	chat.Post("/rooms/:roomId/read", chatHandler.MarkAsRead)
	// Mentions
	chat.Get("/mentions", chatHandler.ListMentions)
	chat.Post("/mentions/:mentionId/read", chatHandler.MarkMentionRead)
	// Quotes
	chat.Post("/quotes", chatHandler.CreateQuote)

	// Chatwoot Proxy (for frontend to call Chatwoot APIs through our API)
	chatwoot := protected.Group("/chatwoot")
	chatwoot.All("/*", h.ChatwootProxy)

	// =========================================================================
	// Graceful shutdown
	// =========================================================================

	// Start server in goroutine
	go func() {
		addr := ":" + cfg.Port
		log.Printf("🚀 WhatPro Hub API starting on %s (env: %s)", addr, cfg.Env)
		log.Printf("🛡️ Security: Rate limiting %d req/min, CORS: %s", rateLimitPerMinute, cfg.CORSOrigins)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}

// ============================================================================
// Helper Functions
// ============================================================================

// getEnvInt gets an environment variable as int or returns a default
func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	var result int
	if _, err := os.Stdout.WriteString(""); err == nil {
		// Parse int
		for _, c := range value {
			if c >= '0' && c <= '9' {
				result = result*10 + int(c-'0')
			} else {
				return defaultValue
			}
		}
	}
	if result == 0 {
		return defaultValue
	}
	return result
}

// parseTrustedProxies parses trusted proxies from config
func parseTrustedProxies(cfg *config.Config) []string {
	trustedProxies := os.Getenv("TRUSTED_PROXIES")
	if trustedProxies == "" {
		// Default Docker/Traefik network
		return []string{"172.20.0.0/24", "172.21.0.0/24"}
	}
	return strings.Split(trustedProxies, ",")
}
