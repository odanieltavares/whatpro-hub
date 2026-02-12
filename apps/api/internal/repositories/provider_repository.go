// Package repositories provides data access layer
package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

var (
	ErrProviderNotFound      = errors.New("provider not found")
	ErrProviderAlreadyExists = errors.New("provider already exists")
)

// ProviderRepository handles provider database operations
type ProviderRepository struct {
	db *gorm.DB
}

// NewProviderRepository creates a new provider repository
func NewProviderRepository(db *gorm.DB) *ProviderRepository {
	return &ProviderRepository{db: db}
}

// FindAll returns all providers with optional filtering
func (r *ProviderRepository) FindAll(ctx context.Context, filters map[string]interface{}) ([]models.Provider, error) {
	var providers []models.Provider
	query := r.db.WithContext(ctx)

	// Apply filters
	if accountID, ok := filters["account_id"].(int); ok && accountID > 0 {
		query = query.Where("account_id = ?", accountID)
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if providerType, ok := filters["type"].(string); ok && providerType != "" {
		query = query.Where("type = ?", providerType)
	}

	if err := query.Order("created_at DESC").Find(&providers).Error; err != nil {
		return nil, err
	}

	return providers, nil
}

// FindByID returns a provider by ID
func (r *ProviderRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Provider, error) {
	var provider models.Provider
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&provider).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}
	return &provider, nil
}

// FindByIDForAccount returns a provider by ID scoped to an account
func (r *ProviderRepository) FindByIDForAccount(ctx context.Context, id uuid.UUID, accountID int) (*models.Provider, error) {
	var provider models.Provider
	if err := r.db.WithContext(ctx).
		Where("id = ? AND account_id = ?", id, accountID).
		First(&provider).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}
	return &provider, nil
}

// FindByAccountID returns all providers for an account
func (r *ProviderRepository) FindByAccountID(ctx context.Context, accountID int) ([]models.Provider, error) {
	var providers []models.Provider
	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).Find(&providers).Error; err != nil {
		return nil, err
	}
	return providers, nil
}

// Create creates a new provider
func (r *ProviderRepository) Create(ctx context.Context, provider *models.Provider) error {
	if provider.ID == uuid.Nil {
		provider.ID = uuid.New()
	}
	
	if err := r.db.WithContext(ctx).Create(provider).Error; err != nil {
		return err
	}
	return nil
}

// Update updates an existing provider
func (r *ProviderRepository) Update(ctx context.Context, provider *models.Provider) error {
	provider.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(provider).Error; err != nil {
		return err
	}
	return nil
}

// Delete soft deletes a provider (marks as inactive)
func (r *ProviderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result := r.db.WithContext(ctx).Model(&models.Provider{}).
		Where("id = ?", id).
		Update("status", "inactive")

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}

// DeleteForAccount soft deletes a provider scoped to an account
func (r *ProviderRepository) DeleteForAccount(ctx context.Context, id uuid.UUID, accountID int) error {
	result := r.db.WithContext(ctx).Model(&models.Provider{}).
		Where("id = ? AND account_id = ?", id, accountID).
		Update("status", "inactive")

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}

// UpdateStatus updates only the status field
func (r *ProviderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	result := r.db.WithContext(ctx).Model(&models.Provider{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}

// UpdateHealthCheck updates the last health check timestamp
func (r *ProviderRepository) UpdateHealthCheck(ctx context.Context, id uuid.UUID, status string) error {
	result := r.db.WithContext(ctx).Model(&models.Provider{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":            status,
			"last_health_check": time.Now(),
			"updated_at":        time.Now(),
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrProviderNotFound
	}

	return nil
}

// Count returns the total number of providers
func (r *ProviderRepository) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&models.Provider{})

	// Apply filters
	if accountID, ok := filters["account_id"].(int); ok && accountID > 0 {
		query = query.Where("account_id = ?", accountID)
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}
