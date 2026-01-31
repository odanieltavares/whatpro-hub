// Package main is the entry point for WhatPro Hub API
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"whatpro-hub/internal/config"
	"whatpro-hub/internal/handlers"
	"whatpro-hub/internal/middleware"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:               "WhatPro Hub API",
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		IdleTimeout:           120 * time.Second,
		DisableStartupMessage: cfg.Env == "production",
		ErrorHandler:          handlers.ErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Initialize database connection
	db, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis connection
	rdb, err := config.InitRedis(cfg)
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
	}

	// Initialize handlers
	h := handlers.NewHandler(db, rdb, cfg)

	// =========================================================================
	// Routes
	// =========================================================================

	// Health checks (public)
	app.Get("/health/live", h.HealthLive)
	app.Get("/health/ready", h.HealthReady)
	app.Get("/health/deep", h.HealthDeep)
	app.Get("/metrics", h.Metrics)

	// API v1
	api := app.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/sso", h.AuthSSO)
	auth.Post("/refresh", h.AuthRefresh)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.JWT(cfg.JWTSecret))

	// Auth (protected)
	protected.Post("/auth/logout", h.AuthLogout)
	protected.Get("/auth/me", h.AuthMe)

	// Accounts
	accounts := protected.Group("/accounts")
	accounts.Get("/", middleware.RequireRole("super_admin"), h.ListAccounts)
	accounts.Get("/:id", middleware.RequireRole("admin", "super_admin"), h.GetAccount)
	accounts.Post("/", middleware.RequireRole("super_admin"), h.CreateAccount)
	accounts.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateAccount)

	// Teams
	teams := protected.Group("/accounts/:accountId/teams")
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
	users := protected.Group("/accounts/:accountId/users")
	users.Get("/", h.ListUsers)
	users.Get("/:id", h.GetUser)
	users.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateUser)
	users.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateUser)
	users.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteUser)

	// Providers
	providers := protected.Group("/accounts/:accountId/providers")
	providers.Get("/", h.ListProviders)
	providers.Get("/:id", h.GetProvider)
	providers.Post("/", middleware.RequireRole("admin", "super_admin"), h.CreateProvider)
	providers.Put("/:id", middleware.RequireRole("admin", "super_admin"), h.UpdateProvider)
	providers.Delete("/:id", middleware.RequireRole("admin", "super_admin"), h.DeleteProvider)
	providers.Get("/:id/health", h.CheckProviderHealth)

	// Kanban - Boards
	boards := protected.Group("/accounts/:accountId/boards")
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

	// Webhooks (from Chatwoot)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/chatwoot", h.ChatwootWebhook)

	// Chatwoot Proxy (for frontend to call Chatwoot APIs)
	chatwoot := protected.Group("/chatwoot")
	chatwoot.All("/*", h.ChatwootProxy)

	// =========================================================================
	// Graceful shutdown
	// =========================================================================

	// Start server in goroutine
	go func() {
		addr := ":" + cfg.Port
		log.Printf("🚀 WhatPro Hub API starting on %s", addr)
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
