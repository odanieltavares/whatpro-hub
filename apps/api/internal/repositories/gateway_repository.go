package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

// GatewayRepository handles database operations for the gateway
type GatewayRepository struct {
	db *gorm.DB
}

// NewGatewayRepository creates a new GatewayRepository
func NewGatewayRepository(db *gorm.DB) *GatewayRepository {
	return &GatewayRepository{db: db}
}

// CreateExecution creates a new event execution record
func (r *GatewayRepository) CreateExecution(ctx context.Context, exec *models.EventExecution) error {
	return r.db.WithContext(ctx).Create(exec).Error
}

// UpdateExecutionStatus updates the status and error of an execution
func (r *GatewayRepository) UpdateExecutionStatus(ctx context.Context, id uuid.UUID, status string, errStr string) error {
	updates := map[string]interface{}{
		"status":      status,
		"finished_at": time.Now(),
		"updated_at":  time.Now(),
	}
	if errStr != "" {
		updates["error"] = errStr
	}
	
	// Schedule retry if status is retry
	if status == "retry" {
		updates["retries"] = gorm.Expr("retries + 1")
		// Exponential backoff: 30s, 60s, 120s...
		// We can't do complex math in map easily without fetching first, 
		// so for now just add 30s. A proper service would calc this.
		updates["next_retry_at"] = time.Now().Add(30 * time.Second)
		updates["status"] = "retry" // Ensure status is set
	}

	return r.db.WithContext(ctx).Model(&models.EventExecution{}).Where("id = ?", id).Updates(updates).Error
}

// CreateMapping creates a new message mapping
func (r *GatewayRepository) CreateMapping(ctx context.Context, mapping *models.MessageMapping) error {
	return r.db.WithContext(ctx).Create(mapping).Error
}

// FindMappingByWAID finds a mapping by WhatsApp Message ID
func (r *GatewayRepository) FindMappingByWAID(ctx context.Context, waMessageID string) (*models.MessageMapping, error) {
	var mapping models.MessageMapping
	if err := r.db.WithContext(ctx).Where("wa_message_id = ?", waMessageID).First(&mapping).Error; err != nil {
		return nil, err
	}
	return &mapping, nil
}

// FindMappingByCWID finds a mapping by Chatwoot Message ID
func (r *GatewayRepository) FindMappingByCWID(ctx context.Context, cwMessageID int) (*models.MessageMapping, error) {
	var mapping models.MessageMapping
	if err := r.db.WithContext(ctx).Where("chatwoot_message_id = ?", cwMessageID).First(&mapping).Error; err != nil {
		return nil, err
	}
	return &mapping, nil
}

// CreateLog writes a log entry
func (r *GatewayRepository) CreateLog(ctx context.Context, log *models.GatewayLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

// GetPendingRetries fetches executions ready for retry
func (r *GatewayRepository) GetPendingRetries(ctx context.Context, limit int) ([]models.EventExecution, error) {
	var execs []models.EventExecution
	err := r.db.WithContext(ctx).
		Where("status = ? AND next_retry_at <= ?", "retry", time.Now()).
		Where("retries < max_retries").
		Limit(limit).
		Find(&execs).Error
	return execs, err
}
