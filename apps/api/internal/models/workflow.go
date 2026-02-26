// Package models — workflow automation definitions and execution records
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkflowStatus represents the lifecycle state of a workflow definition
type WorkflowStatus string

const (
	WorkflowStatusDraft  WorkflowStatus = "draft"
	WorkflowStatusActive WorkflowStatus = "active"
)

// ExecutionStatus represents the result state of a single workflow run
type ExecutionStatus string

const (
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusCompleted ExecutionStatus = "completed"
	ExecutionStatusFailed    ExecutionStatus = "failed"
)

// WorkflowDefinition persists the visual automation graph created in the FlowEditor.
// Each account owns its own set of workflows (tenant-scoped via account_id).
type WorkflowDefinition struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID   uint       `gorm:"not null;index" json:"account_id"`
	Name        string     `gorm:"size:255;not null" json:"name" validate:"required,min=3,max=255"`
	Description string     `gorm:"type:text" json:"description"`
	// Nodes stores the XYFlow node array as JSONB (id, type, position, data)
	Nodes       JSON       `gorm:"type:jsonb;not null;default:'[]'" json:"nodes"`
	// Edges stores the XYFlow edge array as JSONB (id, source, target, data)
	Edges       JSON       `gorm:"type:jsonb;not null;default:'[]'" json:"edges"`
	IsActive    bool       `gorm:"default:false" json:"is_active"`
	CreatedBy   uint       `gorm:"index" json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
}

// TableName overrides the default GORM table name
func (WorkflowDefinition) TableName() string {
	return "workflow_definitions"
}

// BeforeCreate sets UUID if not provided
func (w *WorkflowDefinition) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

// WorkflowExecution is an immutable record of a single workflow run.
// Never UPDATE or DELETE — append only (Constitution Principle VII).
type WorkflowExecution struct {
	ID              uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	WorkflowID      uuid.UUID       `gorm:"type:uuid;not null;index" json:"workflow_id"`
	AccountID       uint            `gorm:"not null;index" json:"account_id"`
	TriggerEvent    string          `gorm:"size:100;not null" json:"trigger_event"`
	// TriggerPayload stores the raw event data that triggered execution
	TriggerPayload  JSON            `gorm:"type:jsonb" json:"trigger_payload"`
	Status          ExecutionStatus `gorm:"size:20;not null;default:'running'" json:"status"`
	// Result stores the execution output (nullable)
	Result          JSON            `gorm:"type:jsonb" json:"result,omitempty"`
	// ErrorMessage contains the error detail when Status = 'failed'
	ErrorMessage    *string         `gorm:"type:text" json:"error_message,omitempty"`
	StartedAt       time.Time       `gorm:"default:now()" json:"started_at"`
	CompletedAt     *time.Time      `json:"completed_at,omitempty"`
}

// TableName overrides the default GORM table name
func (WorkflowExecution) TableName() string {
	return "workflow_executions"
}

// BeforeCreate sets UUID if not provided
func (w *WorkflowExecution) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}
