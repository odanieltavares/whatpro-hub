// Package services provides business logic for the API
package services

import (
	"encoding/json"
	"log"

	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// AuditService handles audit logging operations
type AuditService struct {
	repo   *repositories.AuditRepository
	logger *log.Logger
}

// NewAuditService creates a new AuditService
func NewAuditService(repo *repositories.AuditRepository) *AuditService {
	return &AuditService{
		repo:   repo,
		logger: log.Default(),
	}
}

// AuditAction represents the type of action being audited
type AuditAction string

const (
	AuditActionCreate AuditAction = "create"
	AuditActionUpdate AuditAction = "update"
	AuditActionDelete AuditAction = "delete"
	AuditActionLogin  AuditAction = "login"
	AuditActionLogout AuditAction = "logout"
	AuditActionExport AuditAction = "export"
	AuditActionImport AuditAction = "import"
)

// Log creates an audit log entry asynchronously
// This method does NOT block the request - it logs in the background
func (s *AuditService) Log(c *fiber.Ctx, action AuditAction, resourceType, resourceID string, oldValue, newValue interface{}) {
	// Extract user context
	userID, _ := c.Locals("user_id").(int)
	accountID, _ := c.Locals("account_id").(int)

	// Serialize values to JSON (models.JSON is map[string]interface{})
	var oldJSON, newJSON models.JSON
	if oldValue != nil {
		if m, ok := sanitizeForAudit(oldValue).(map[string]interface{}); ok {
			oldJSON = models.JSON(m)
		}
	}
	if newValue != nil {
		if m, ok := sanitizeForAudit(newValue).(map[string]interface{}); ok {
			newJSON = models.JSON(m)
		}
	}

	// Build audit log entry
	userIDPtr := &userID
	auditLog := &models.AuditLog{
		UserID:       userIDPtr,
		AccountID:    accountID,
		Action:       string(action),
		ResourceType: resourceType,
		ResourceID:   resourceID,
		OldValues:    oldJSON,
		NewValues:    newJSON,
		IPAddress:    c.IP(),
		UserAgent:    c.Get("User-Agent"),
	}

	// Write asynchronously to not block the request
	go func(entry *models.AuditLog) {
		if err := s.repo.Create(entry); err != nil {
			s.logger.Printf("[AUDIT ERROR] Failed to create audit log: %v", err)
		}
	}(auditLog)
}

// LogSync creates an audit log entry synchronously
// Use this when you need to ensure the log is written before proceeding
func (s *AuditService) LogSync(c *fiber.Ctx, action AuditAction, resourceType, resourceID string, oldValue, newValue interface{}) error {
	userID, _ := c.Locals("user_id").(int)
	accountID, _ := c.Locals("account_id").(int)

	var oldJSON, newJSON models.JSON
	if oldValue != nil {
		if m, ok := sanitizeForAudit(oldValue).(map[string]interface{}); ok {
			oldJSON = models.JSON(m)
		}
	}
	if newValue != nil {
		if m, ok := sanitizeForAudit(newValue).(map[string]interface{}); ok {
			newJSON = models.JSON(m)
		}
	}

	userIDPtr := &userID
	auditLog := &models.AuditLog{
		UserID:       userIDPtr,
		AccountID:    accountID,
		Action:       string(action),
		ResourceType: resourceType,
		ResourceID:   resourceID,
		OldValues:    oldJSON,
		NewValues:    newJSON,
		IPAddress:    c.IP(),
		UserAgent:    c.Get("User-Agent"),
	}

	return s.repo.Create(auditLog)
}

// GetByResource retrieves audit logs for a specific resource
func (s *AuditService) GetByResource(resourceType, resourceID string, limit int) ([]models.AuditLog, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.FindByResource(resourceType, resourceID, limit)
}

// GetByAccount retrieves audit logs for an account with pagination
func (s *AuditService) GetByAccount(accountID, limit, offset int) ([]models.AuditLog, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.FindByAccount(accountID, limit, offset)
}

// GetWithFilters retrieves audit logs with custom filters
func (s *AuditService) GetWithFilters(filters repositories.AuditQueryFilters) ([]models.AuditLog, int64, error) {
	return s.repo.FindWithFilters(filters)
}

// ============================================================================
// Helper Functions
// ============================================================================

// sanitizeForAudit removes sensitive fields from data before logging
func sanitizeForAudit(data interface{}) interface{} {
	// Convert to map if possible
	switch v := data.(type) {
	case map[string]interface{}:
		return sanitizeMap(v)
	default:
		// For structs, convert to map first
		if bytes, err := json.Marshal(data); err == nil {
			var m map[string]interface{}
			if err := json.Unmarshal(bytes, &m); err == nil {
				return sanitizeMap(m)
			}
		}
		return data
	}
}

// sensitiveFields lists fields that should be redacted in audit logs
var sensitiveFields = map[string]bool{
	"password":          true,
	"api_key":           true,
	"api_key_encrypted": true,
	"secret":            true,
	"token":             true,
	"access_token":      true,
	"refresh_token":     true,
	"encryption_key":    true,
	"private_key":       true,
}

// sanitizeMap removes sensitive fields from a map
func sanitizeMap(m map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range m {
		// Check if this is a sensitive field
		if sensitiveFields[k] {
			result[k] = "[REDACTED]"
			continue
		}
		// Recursively sanitize nested maps
		if nested, ok := v.(map[string]interface{}); ok {
			result[k] = sanitizeMap(nested)
		} else {
			result[k] = v
		}
	}
	return result
}
