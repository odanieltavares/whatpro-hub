package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// GatewayService handles message routing and event processing
type GatewayService struct {
	repo         *repositories.GatewayRepository
	providerRepo *repositories.ProviderRepository
	accountRepo  *repositories.AccountRepository
	// TODO: Add ChatwootClient here
}

// NewGatewayService creates a new GatewayService
func NewGatewayService(repo *repositories.GatewayRepository, providerRepo *repositories.ProviderRepository, accountRepo *repositories.AccountRepository) *GatewayService {
	return &GatewayService{
		repo:         repo,
		providerRepo: providerRepo,
		accountRepo:  accountRepo,
	}
}

// ProcessEvolutionWebhook handles incoming webhooks from Evolution API
func (s *GatewayService) ProcessEvolutionWebhook(ctx context.Context, instanceToken string, payload models.JSON) error {
	// 1. Log receipt (Idempotency key could be added here)
	exec := &models.EventExecution{
		EventType: "evolution.webhook",
		Payload:   payload,
		Status:    "pending",
		StartedAt: nowPtr(),
	}
	
	if err := s.repo.CreateExecution(ctx, exec); err != nil {
		return fmt.Errorf("failed to log execution: %w", err)
	}

	// 2. Identify Provider/Account by Instance Token (or Name)
	// In Evolution, the instance name is often in the payload or URL
	// For now assuming we find it via token or lookup
	
	// Mock processing logic for now
	// In real impl, we specific switch case for event type (message, status, etc.)
	
	// 3. Mark success
	if err := s.repo.UpdateExecutionStatus(ctx, exec.ID, "success", ""); err != nil {
		return err
	}

	return nil
}

// Helper
func nowPtr() *time.Time {
	t := time.Now()
	return &t
}
