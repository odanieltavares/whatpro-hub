package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

// BillingRepository handles database operations for billing
type BillingRepository struct {
	db *gorm.DB
}

// NewBillingRepository creates a new BillingRepository
func NewBillingRepository(db *gorm.DB) *BillingRepository {
	return &BillingRepository{db: db}
}

// CreateSubscription creates a new subscription
func (r *BillingRepository) CreateSubscription(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Create(sub).Error
}

// GetSubscriptionByAccount returns the active subscription for an account
func (r *BillingRepository) GetSubscriptionByAccount(ctx context.Context, accountID int) (*models.Subscription, error) {
	var sub models.Subscription
	if err := r.db.WithContext(ctx).
		Where("account_id = ? AND status IN ?", accountID, []string{"active", "trial", "overdue"}).
		Order("created_at DESC").
		First(&sub).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

// UpdateSubscription updates a subscription
func (r *BillingRepository) UpdateSubscription(ctx context.Context, sub *models.Subscription) error {
	sub.UpdatedAt = time.Now()
	return r.db.WithContext(ctx).Save(sub).Error
}

// FindSubscriptionByProviderID finds a subscription by external ID
func (r *BillingRepository) FindSubscriptionByProviderID(ctx context.Context, providerSubID string) (*models.Subscription, error) {
	var sub models.Subscription
	if err := r.db.WithContext(ctx).Where("provider_sub_id = ?", providerSubID).First(&sub).Error; err != nil {
		return nil, err
	}
	return &sub, nil
}

// CreateTransaction logs a payment transaction
func (r *BillingRepository) CreateTransaction(ctx context.Context, tx *models.Transaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

// ListPlans returns all active plans
func (r *BillingRepository) ListPlans(ctx context.Context) ([]models.Plan, error) {
	var plans []models.Plan
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

// GetPlan returns a plan by ID
func (r *BillingRepository) GetPlan(ctx context.Context, id uuid.UUID) (*models.Plan, error) {
	var plan models.Plan
	if err := r.db.WithContext(ctx).First(&plan, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}
