// Package services provides business logic layer
package services

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
	"whatpro-hub/pkg/crypto"
)

// ProviderService handles provider business logic
type ProviderService struct {
	repo      *repositories.ProviderRepository
	encryptor *crypto.Encryptor
}

// NewProviderService creates a new provider service
func NewProviderService(repo *repositories.ProviderRepository, encryptionKey string) (*ProviderService, error) {
	encryptor, err := crypto.NewEncryptor(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize encryptor: %w", err)
	}

	return &ProviderService{
		repo:      repo,
		encryptor: encryptor,
	}, nil
}

// ListProviders returns all providers with optional filters
func (s *ProviderService) ListProviders(ctx context.Context, filters map[string]interface{}) ([]models.Provider, error) {
	providers, err := s.repo.FindAll(ctx, filters)
	if err != nil {
		return nil, err
	}

	// Remove encrypted API keys from response for security
	for i := range providers {
		providers[i].APIKeyEncrypted = "[ENCRYPTED]"
	}

	return providers, nil
}

// GetProvider returns a provider by ID
func (s *ProviderService) GetProvider(ctx context.Context, id uuid.UUID) (*models.Provider, error) {
	provider, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Remove encrypted API key from response
	provider.APIKeyEncrypted = "[ENCRYPTED]"

	return provider, nil
}

// GetProviderWithKey returns a provider with decrypted API key (admin only)
func (s *ProviderService) GetProviderWithKey(ctx context.Context, id uuid.UUID) (*models.Provider, string, error) {
	provider, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, "", err
	}

	// Decrypt API key
	apiKey, err := s.encryptor.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decrypt API key: %w", err)
	}

	// Remove encrypted from provider object
	provider.APIKeyEncrypted = "[ENCRYPTED]"

	return provider, apiKey, nil
}

// CreateProvider creates a new provider with encrypted API key
func (s *ProviderService) CreateProvider(ctx context.Context, provider *models.Provider, apiKey string) error {
	// Encrypt API key
	encryptedKey, err := s.encryptor.Encrypt(apiKey)
	if err != nil {
		return fmt.Errorf("failed to encrypt API key: %w", err)
	}

	provider.APIKeyEncrypted = encryptedKey
	provider.Status = "disconnected" // Default status

	return s.repo.Create(ctx, provider)
}

// UpdateProvider updates an existing provider
func (s *ProviderService) UpdateProvider(ctx context.Context, id uuid.UUID, updates map[string]interface{}) error {
	provider, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Apply updates
	if name, ok := updates["name"].(string); ok {
		provider.Name = name
	}
	if providerType, ok := updates["type"].(string); ok {
		provider.Type = providerType
	}
	if baseURL, ok := updates["base_url"].(string); ok {
		provider.BaseURL = baseURL
	}
	if instanceName, ok := updates["instance_name"].(string); ok {
		provider.InstanceName = instanceName
	}
	if healthCheckURL, ok := updates["health_check_url"].(string); ok {
		provider.HealthCheckURL = healthCheckURL
	}
	if metadata, ok := updates["metadata"].(models.JSON); ok {
		provider.Metadata = metadata
	}

	// Handle API key update separately (needs encryption)
	if apiKey, ok := updates["api_key"].(string); ok && apiKey != "" {
		encryptedKey, err := s.encryptor.Encrypt(apiKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt API key: %w", err)
		}
		provider.APIKeyEncrypted = encryptedKey
	}

	return s.repo.Update(ctx, provider)
}

// DeleteProvider soft deletes a provider
func (s *ProviderService) DeleteProvider(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// CheckProviderHealth performs health check on a provider
func (s *ProviderService) CheckProviderHealth(ctx context.Context, id uuid.UUID) (bool, error) {
	provider, apiKey, err := s.GetProviderWithKey(ctx, id)
	if err != nil {
		return false, err
	}

	// Determine health check URL
	healthURL := provider.HealthCheckURL
	if healthURL == "" {
		// Default health check endpoints by provider type
		switch provider.Type {
		case "evolution":
			healthURL = provider.BaseURL + "/instance/connectionState/" + provider.InstanceName
		case "uazapi":
			healthURL = provider.BaseURL + "/instance/status"
		default:
			healthURL = provider.BaseURL + "/health"
		}
	}

	// Perform HTTP request
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequestWithContext(ctx, "GET", healthURL, nil)
	if err != nil {
		log.Printf("Failed to create health check request: %v", err)
		s.repo.UpdateHealthCheck(ctx, id, "error")
		return false, err
	}

	// Add API key to headers
	req.Header.Set("apikey", apiKey)
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Health check failed for provider %s: %v", id, err)
		s.repo.UpdateHealthCheck(ctx, id, "disconnected")
		return false, nil
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode == http.StatusOK {
		s.repo.UpdateHealthCheck(ctx, id, "connected")
		return true, nil
	}

	s.repo.UpdateHealthCheck(ctx, id, "disconnected")
	return false, nil
}

// CheckAllProvidersHealth runs health check on all active providers
func (s *ProviderService) CheckAllProvidersHealth(ctx context.Context) error {
	filters := map[string]interface{}{
		"status": "connected", // Only check connected providers
	}

	providers, err := s.repo.FindAll(ctx, filters)
	if err != nil {
		return err
	}

	for _, provider := range providers {
		go func(id uuid.UUID) {
			_, _ = s.CheckProviderHealth(context.Background(), id)
		}(provider.ID)
	}

	return nil
}

// GetProviderStats returns statistics for providers
func (s *ProviderService) GetProviderStats(ctx context.Context, accountID int) (map[string]interface{}, error) {
	providers, err := s.repo.FindByAccountID(ctx, accountID)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total":        len(providers),
		"connected":    0,
		"disconnected": 0,
		"error":        0,
		"by_type":      make(map[string]int),
	}

	for _, provider := range providers {
		// Count by status
		switch provider.Status {
		case "connected":
			stats["connected"] = stats["connected"].(int) + 1
		case "disconnected":
			stats["disconnected"] = stats["disconnected"].(int) + 1
		case "error":
			stats["error"] = stats["error"].(int) + 1
		}

		// Count by type
		byType := stats["by_type"].(map[string]int)
		byType[provider.Type]++
	}

	return stats, nil
}
