// Package services provides business logic layer
package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
	"whatpro-hub/pkg/chatwoot"
)

// AccountService handles account business logic
type AccountService struct {
	repo           *repositories.AccountRepository
	chatwootClient *chatwoot.Client
}

// NewAccountService creates a new account service
func NewAccountService(repo *repositories.AccountRepository, chatwootURL, apiKey string) *AccountService {
	return &AccountService{
		repo:           repo,
		chatwootClient: chatwoot.New(chatwootURL, apiKey),
	}
}

// ListAccounts returns all accounts with optional filters
func (s *AccountService) ListAccounts(ctx context.Context, filters map[string]interface{}) ([]models.Account, error) {
	return s.repo.FindAll(ctx, filters)
}

// GetAccount returns an account by ID
func (s *AccountService) GetAccount(ctx context.Context, id uint) (*models.Account, error) {
	return s.repo.FindByID(ctx, id)
}

// CreateAccount creates a new account
func (s *AccountService) CreateAccount(ctx context.Context, account *models.Account) error {
	// Set default values
	if account.Status == "" {
		account.Status = "active"
	}
	if account.Locale == "" {
		account.Locale = "pt_BR"
	}
	if account.Features == nil {
		account.Features = models.JSON{}
	}
	if account.Settings == nil {
		account.Settings = models.JSON{}
	}

	return s.repo.Create(ctx, account)
}

// UpdateAccount updates an existing account
func (s *AccountService) UpdateAccount(ctx context.Context, id uint, updates map[string]interface{}) error {
	account, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok {
		account.Name = name
	}
	if locale, ok := updates["locale"].(string); ok {
		account.Locale = locale
	}
	if domain, ok := updates["domain"].(string); ok {
		account.Domain = domain
	}
	if email, ok := updates["support_email"].(string); ok {
		account.SupportEmail = email
	}
	if status, ok := updates["status"].(string); ok {
		account.Status = status
	}
	if features, ok := updates["features"].(models.JSON); ok {
		account.Features = features
	}
	if settings, ok := updates["settings"].(models.JSON); ok {
		account.Settings = settings
	}

	return s.repo.Update(ctx, account)
}

// DeleteAccount soft deletes an account
func (s *AccountService) DeleteAccount(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

// SyncFromChatwoot synchronizes accounts from Chatwoot
func (s *AccountService) SyncFromChatwoot(ctx context.Context) error {
	log.Println("🔄 Syncing accounts from Chatwoot...")

	// Get all accounts from Chatwoot
	cwAccounts, err := s.chatwootClient.ListAccounts()
	if err != nil {
		return fmt.Errorf("failed to fetch accounts from Chatwoot: %w", err)
	}

	synced := 0
	created := 0
	updated := 0

	for _, cwAccount := range cwAccounts {
		// Try to find existing account
		existing, err := s.repo.FindByChatwootID(ctx, cwAccount.ID)
		
		if err == repositories.ErrAccountNotFound {
			// Create new account
			account := &models.Account{
				ChatwootID:   cwAccount.ID,
				Name:         cwAccount.Name,
				Locale:       cwAccount.Locale,
				Domain:       cwAccount.Domain,
				SupportEmail: cwAccount.SupportEmail,
				Status:       "active",
				Features:     models.JSON{},
				Settings:     models.JSON{},
			}
			
			if err := s.repo.Create(ctx, account); err != nil {
				log.Printf("⚠️  Failed to create account %d: %v", cwAccount.ID, err)
				continue
			}
			created++
		} else if err == nil {
			// Update existing account
			existing.Name = cwAccount.Name
			existing.Locale = cwAccount.Locale
			existing.Domain = cwAccount.Domain
			existing.SupportEmail = cwAccount.SupportEmail
			
			if err := s.repo.Update(ctx, existing); err != nil {
				log.Printf("⚠️  Failed to update account %d: %v", cwAccount.ID, err)
				continue
			}
			updated++
		} else {
			log.Printf("⚠️  Error checking account %d: %v", cwAccount.ID, err)
			continue
		}
		
		synced++
	}

	log.Printf("✅ Sync completed: %d total, %d created, %d updated", synced, created, updated)
	return nil
}

// EnableFeature enables a feature for an account
func (s *AccountService) EnableFeature(ctx context.Context, id uint, feature string) error {
	account, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if account.Features == nil {
		account.Features = models.JSON{}
	}

	account.Features[feature] = true
	return s.repo.UpdateFeatures(ctx, id, account.Features)
}

// DisableFeature disables a feature for an account
func (s *AccountService) DisableFeature(ctx context.Context, id uint, feature string) error {
	account, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if account.Features == nil {
		account.Features = models.JSON{}
	}

	account.Features[feature] = false
	return s.repo.UpdateFeatures(ctx, id, account.Features)
}

// GetAccountStats returns statistics for an account
func (s *AccountService) GetAccountStats(ctx context.Context, id uint) (map[string]interface{}, error) {
	account, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"account_id":   account.ID,
		"name":         account.Name,
		"status":       account.Status,
		"created_at":   account.CreatedAt,
		"age_days":     time.Since(account.CreatedAt).Hours() / 24,
		// TODO: Add more stats (users count, boards count, etc)
	}

	return stats, nil
}
