// Package repositories provides data access layer for the API
package repositories

import (
	"time"

	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

// AuditRepository handles audit log persistence
type AuditRepository struct {
	db *gorm.DB
}

// NewAuditRepository creates a new AuditRepository
func NewAuditRepository(db *gorm.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

// Create inserts a new audit log entry
func (r *AuditRepository) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

// FindByResource retrieves audit logs for a specific resource
func (r *AuditRepository) FindByResource(resourceType string, resourceID string, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

// FindByUser retrieves audit logs for a specific user
func (r *AuditRepository) FindByUser(userID int, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

// FindByAccount retrieves audit logs for a specific account
func (r *AuditRepository) FindByAccount(accountID int, limit int, offset int) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	// Count total
	if err := r.db.Model(&models.AuditLog{}).Where("account_id = ?", accountID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Where("account_id = ?", accountID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&logs).Error

	return logs, total, err
}

// FindByDateRange retrieves audit logs within a date range
func (r *AuditRepository) FindByDateRange(accountID int, startDate, endDate time.Time, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("account_id = ? AND created_at BETWEEN ? AND ?", accountID, startDate, endDate).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

// FindByAction retrieves audit logs by action type
func (r *AuditRepository) FindByAction(accountID int, action string, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("account_id = ? AND action = ?", accountID, action).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

// AuditQueryFilters holds filters for querying audit logs
type AuditQueryFilters struct {
	AccountID    int
	UserID       *int
	Action       *string
	ResourceType *string
	ResourceID   *string
	StartDate    *time.Time
	EndDate      *time.Time
	Limit        int
	Offset       int
}

// FindWithFilters retrieves audit logs with multiple filters
func (r *AuditRepository) FindWithFilters(filters AuditQueryFilters) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := r.db.Model(&models.AuditLog{})

	// Apply filters
	if filters.AccountID > 0 {
		query = query.Where("account_id = ?", filters.AccountID)
	}
	if filters.UserID != nil {
		query = query.Where("user_id = ?", *filters.UserID)
	}
	if filters.Action != nil {
		query = query.Where("action = ?", *filters.Action)
	}
	if filters.ResourceType != nil {
		query = query.Where("resource_type = ?", *filters.ResourceType)
	}
	if filters.ResourceID != nil {
		query = query.Where("resource_id = ?", *filters.ResourceID)
	}
	if filters.StartDate != nil {
		query = query.Where("created_at >= ?", *filters.StartDate)
	}
	if filters.EndDate != nil {
		query = query.Where("created_at <= ?", *filters.EndDate)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and get results
	if filters.Limit <= 0 {
		filters.Limit = 50
	}
	err := query.Order("created_at DESC").
		Limit(filters.Limit).
		Offset(filters.Offset).
		Find(&logs).Error

	return logs, total, err
}
