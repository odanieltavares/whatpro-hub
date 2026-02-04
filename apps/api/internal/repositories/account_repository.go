// Package repositories provides data access layer
package repositories

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

var (
	ErrAccountNotFound      = errors.New("account not found")
	ErrAccountAlreadyExists = errors.New("account already exists")
)

// AccountRepository handles account database operations
type AccountRepository struct {
	db *gorm.DB
}

// NewAccountRepository creates a new account repository
func NewAccountRepository(db *gorm.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

// FindAll returns all accounts with optional filtering
func (r *AccountRepository) FindAll(ctx context.Context, filters map[string]interface{}) ([]models.Account, error) {
	var accounts []models.Account
	query := r.db.WithContext(ctx)

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, err
	}

	return accounts, nil
}

// FindByID returns an account by ID
func (r *AccountRepository) FindByID(ctx context.Context, id uint) (*models.Account, error) {
	var account models.Account
	if err := r.db.WithContext(ctx).First(&account, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// FindByChatwootID returns an account by Chatwoot ID
func (r *AccountRepository) FindByChatwootID(ctx context.Context, chatwootID int) (*models.Account, error) {
	var account models.Account
	if err := r.db.WithContext(ctx).Where("chatwoot_id = ?", chatwootID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// Create creates a new account
func (r *AccountRepository) Create(ctx context.Context, account *models.Account) error {
	// Check if account with same chatwoot_id already exists
	var existing models.Account
	if err := r.db.WithContext(ctx).Where("chatwoot_id = ?", account.ChatwootID).First(&existing).Error; err == nil {
		return ErrAccountAlreadyExists
	}

	if err := r.db.WithContext(ctx).Create(account).Error; err != nil {
		return err
	}
	return nil
}

// Update updates an existing account
func (r *AccountRepository) Update(ctx context.Context, account *models.Account) error {
	account.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(account).Error; err != nil {
		return err
	}
	return nil
}

// Delete soft deletes an account (marks as inactive)
func (r *AccountRepository) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Model(&models.Account{}).
		Where("id = ?", id).
		Update("status", "inactive")
	
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return ErrAccountNotFound
	}
	
	return nil
}

// Count returns the total number of accounts
func (r *AccountRepository) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&models.Account{})

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// UpdateSettings updates only the settings field
func (r *AccountRepository) UpdateSettings(ctx context.Context, id uint, settings models.JSON) error {
	result := r.db.WithContext(ctx).Model(&models.Account{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"settings":   settings,
			"updated_at": time.Now(),
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrAccountNotFound
	}

	return nil
}

// UpdateFeatures updates only the features field
func (r *AccountRepository) UpdateFeatures(ctx context.Context, id uint, features models.JSON) error {
	result := r.db.WithContext(ctx).Model(&models.Account{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"features":   features,
			"updated_at": time.Now(),
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrAccountNotFound
	}

	return nil
}
