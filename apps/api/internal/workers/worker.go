// Package workers provides background job processing with Asynq
package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"whatpro-hub/internal/config"
	"whatpro-hub/internal/repositories"
	"whatpro-hub/internal/services"
)

// Task types
const (
	TypeSyncAccounts   = "sync:accounts"
	TypeSyncUsers      = "sync:users"
	TypeProviderHealth = "provider:health_check"
	TypeWebhookProcess = "webhook:process"
)

// Worker holds dependencies for background jobs
type Worker struct {
	DB              *gorm.DB
	Redis           *redis.Client
	Config          *config.Config
	AccountService  *services.AccountService
	ProviderService *services.ProviderService
	Logger          *log.Logger
}

// NewWorker creates a new Worker instance
func NewWorker(db *gorm.DB, rdb *redis.Client, cfg *config.Config) (*Worker, error) {
	// Initialize repositories
	accountRepo := repositories.NewAccountRepository(db)
	providerRepo := repositories.NewProviderRepository(db)

	// Initialize services
	accountService := services.NewAccountService(accountRepo, cfg.ChatwootURL, cfg.ChatwootAPIKey)

	encryptionKey := getEnvWorker("ENCRYPTION_KEY", "12345678901234567890123456789012")
	providerService, err := services.NewProviderService(providerRepo, encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to init provider service: %w", err)
	}

	return &Worker{
		DB:              db,
		Redis:           rdb,
		Config:          cfg,
		AccountService:  accountService,
		ProviderService: providerService,
		Logger:          log.Default(),
	}, nil
}

// RegisterHandlers registers all task handlers with Asynq server
func (w *Worker) RegisterHandlers(mux *asynq.ServeMux) {
	mux.HandleFunc(TypeSyncAccounts, w.HandleSyncAccounts)
	mux.HandleFunc(TypeProviderHealth, w.HandleProviderHealth)
	mux.HandleFunc(TypeWebhookProcess, w.HandleWebhookProcess)
}

// HandleSyncAccounts syncs accounts from Chatwoot
func (w *Worker) HandleSyncAccounts(ctx context.Context, t *asynq.Task) error {
	w.Logger.Printf("[Worker] Starting account sync...")

	start := time.Now()

	// Call AccountService to sync
	if err := w.AccountService.SyncFromChatwoot(ctx); err != nil {
		w.Logger.Printf("[Worker] Failed to sync accounts: %v", err)
		return fmt.Errorf("account sync failed: %w", err)
	}

	duration := time.Since(start)
	w.Logger.Printf("[Worker] Account sync completed in %v", duration)

	return nil
}

// HandleProviderHealth checks health of all providers
func (w *Worker) HandleProviderHealth(ctx context.Context, t *asynq.Task) error {
	w.Logger.Printf("[Worker] Starting provider health checks...")

	// Get all providers
	providers, err := w.ProviderService.ListProviders(ctx, map[string]interface{}{})
	if err != nil {
		return fmt.Errorf("failed to list providers: %w", err)
	}

	healthyCount := 0
	unhealthyCount := 0

	for _, provider := range providers {
		isHealthy, err := w.ProviderService.CheckProviderHealth(ctx, provider.AccountID, provider.ID)
		if err != nil {
			w.Logger.Printf("[Worker] Health check error for provider %s: %v", provider.ID, err)
			unhealthyCount++
			continue
		}

		if isHealthy {
			healthyCount++
		} else {
			unhealthyCount++
		}
	}

	w.Logger.Printf("[Worker] Provider health check completed: %d healthy, %d unhealthy", healthyCount, unhealthyCount)

	return nil
}

// WebhookPayload is the payload for webhook processing tasks
type WebhookPayload struct {
	Event   string          `json:"event"`
	Payload json.RawMessage `json:"payload"`
}

// HandleWebhookProcess processes Chatwoot webhooks asynchronously
func (w *Worker) HandleWebhookProcess(ctx context.Context, t *asynq.Task) error {
	w.Logger.Printf("[Worker] Processing webhook...")

	var payload WebhookPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("invalid webhook payload: %w", err)
	}

	w.Logger.Printf("[Worker] Processing webhook event: %s", payload.Event)

	// TODO: Process webhook based on event type
	// - conversation_created: Create Kanban card
	// - message_created: Update card preview

	return nil
}

// getEnvWorker helper function
func getEnvWorker(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
