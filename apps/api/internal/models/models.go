// Package models contains the database models
package models

import (
	"time"

	"github.com/google/uuid"
)

// Account represents a Chatwoot account (synced)
type Account struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ChatwootID   int       `gorm:"uniqueIndex" json:"chatwoot_id"`
	Name         string    `json:"name"`
	Locale       string    `gorm:"default:pt_BR" json:"locale"`
	Domain       string    `json:"domain"`
	SupportEmail string    `json:"support_email"`
	Status       string    `gorm:"default:active" json:"status"`
	Features     JSON      `gorm:"type:jsonb;default:'{}'" json:"features"`
	Settings     JSON      `gorm:"type:jsonb;default:'{}'" json:"settings"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// User represents a Chatwoot user (synced)
type User struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	ChatwootID         int       `gorm:"uniqueIndex" json:"chatwoot_id"`
	AccountID          int       `gorm:"index" json:"account_id"`
	Email              string    `gorm:"uniqueIndex" json:"email"`
	Name               string    `json:"name"`
	AvatarURL          string    `json:"avatar_url"`
	ChatwootRole       string    `gorm:"default:agent" json:"chatwoot_role"`
	WhatproRole        string    `gorm:"default:agent" json:"whatpro_role"`
	CustomRoleID       *int      `json:"custom_role_id,omitempty"`
	AvailabilityStatus string    `gorm:"default:online" json:"availability_status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Team represents a Chatwoot team (synced)
type Team struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	ChatwootID      int       `gorm:"uniqueIndex" json:"chatwoot_id"`
	AccountID       int       `gorm:"index" json:"account_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	AllowAutoAssign bool      `gorm:"default:true" json:"allow_auto_assign"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// TeamMember represents team membership
type TeamMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TeamID    uint      `gorm:"index" json:"team_id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// Company represents a Business Entity (B2B Context)
type Company struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID int       `gorm:"index" json:"account_id"`
	Name      string    `json:"name"`
	CNPJ      string    `json:"cnpj"`       // Tax ID
	TaxRegime string    `json:"tax_regime"` // Simples, Lucro Presumido, etc.
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ChecklistItem represents a task within a Card or Stage template
type ChecklistItem struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CardID      *uuid.UUID `gorm:"type:uuid;index" json:"card_id,omitempty"`  // If instance
	StageID     *uuid.UUID `gorm:"type:uuid;index" json:"stage_id,omitempty"` // If template
	Text        string     `json:"text"`
	IsCompleted bool       `gorm:"default:false" json:"is_completed"`
	IsRequired  bool       `gorm:"default:false" json:"is_required"`
	Position    int        `json:"position"`
}

// Provider represents a WhatsApp API provider
type Provider struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID       int       `gorm:"index" json:"account_id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"` // evolution, uazapi, baileys
	BaseURL         string    `json:"base_url"`
	APIKeyEncrypted string    `json:"-"` // Not exposed in JSON
	InstanceName    string    `json:"instance_name"`
	Status          string    `gorm:"default:disconnected" json:"status"`
	HealthCheckURL  string    `json:"health_check_url"`
	LastHealthCheck *time.Time `json:"last_health_check"`
	Metadata        JSON      `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Board represents a Kanban board
type Board struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID   int       `gorm:"index" json:"account_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `gorm:"default:pipeline" json:"type"` // pipeline, support, custom
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	Settings    JSON      `gorm:"type:jsonb;default:'{}'" json:"settings"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Stages      []Stage   `gorm:"foreignKey:BoardID" json:"stages,omitempty"`
}

// Stage represents a Kanban stage (column)
type Stage struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	BoardID     uuid.UUID `gorm:"type:uuid;index" json:"board_id"`
	Name        string    `json:"name"`
	Color       string    `gorm:"default:#4ECDC4" json:"color"`
	Position    int       `json:"position"`
	SLAHours    *int      `json:"sla_hours,omitempty"`
	AutoActions JSON      `gorm:"type:jsonb;default:'[]'" json:"auto_actions"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	Cards             []Card          `gorm:"foreignKey:StageID" json:"cards,omitempty"`
	ChecklistTemplate []ChecklistItem `gorm:"foreignKey:StageID" json:"checklist_template,omitempty"`
}

// Card represents a Kanban card (linked to Chatwoot conversation)
type Card struct {
	ID                     uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	StageID                uuid.UUID  `gorm:"type:uuid;index" json:"stage_id"`
	ChatwootConversationID int        `gorm:"index" json:"chatwoot_conversation_id"`
	ChatwootContactID      *int       `json:"chatwoot_contact_id,omitempty"`
	Title                  string     `json:"title"`
	ContactName            string     `json:"contact_name"`
	ContactAvatarURL       string     `json:"contact_avatar_url"`
	LastMessage            string     `json:"last_message"`
	LastMessageAt          *time.Time `json:"last_message_at"`
	Value                  *float64   `json:"value,omitempty"`
	Priority               string     `gorm:"default:medium" json:"priority"` // low, medium, high, urgent
	DueDate                *time.Time `json:"due_date,omitempty"`
	AssigneeID             *int       `gorm:"index" json:"assignee_id,omitempty"`
	Labels                 StringArray `gorm:"type:text[]" json:"labels"`
	CustomAttributes       JSON       `gorm:"type:jsonb;default:'{}'" json:"custom_attributes"`
	Position               int        `json:"position"`
	CreatedAt              time.Time       `json:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at"`
	SelectedCompanyID      *uuid.UUID      `gorm:"type:uuid;index" json:"selected_company_id,omitempty"`
	SelectedCompany        *Company        `gorm:"foreignKey:SelectedCompanyID" json:"selected_company,omitempty"`
	Checklist              []ChecklistItem `gorm:"foreignKey:CardID" json:"checklist,omitempty"`
}

// CardHistory represents card movement history
type CardHistory struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CardID      uuid.UUID  `gorm:"type:uuid;index" json:"card_id"`
	UserID      *int       `json:"user_id,omitempty"`
	Action      string     `json:"action"` // created, moved, updated, archived
	FromStageID *uuid.UUID `gorm:"type:uuid" json:"from_stage_id,omitempty"`
	ToStageID   *uuid.UUID `gorm:"type:uuid" json:"to_stage_id,omitempty"`
	Metadata    JSON       `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt   time.Time  `json:"created_at"`
}

// Session represents a JWT session
type Session struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	TokenHash string    `gorm:"uniqueIndex" json:"-"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID       *int      `json:"user_id,omitempty"`
	AccountID    int       `gorm:"index" json:"account_id"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resource_type"`
	ResourceID   string    `json:"resource_id"`
	OldValues    JSON      `gorm:"type:jsonb" json:"old_values,omitempty"`
	NewValues    JSON      `gorm:"type:jsonb" json:"new_values,omitempty"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	CreatedAt    time.Time `json:"created_at"`
}

// ============================================================================
// GATEWAY & MESSAGE ROUTING MODELS
// ============================================================================

// MessageMapping links messages between WhatsApp and Chatwoot
type MessageMapping struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID         int       `gorm:"index" json:"account_id"`
	ProviderID        uuid.UUID `gorm:"type:uuid;index" json:"provider_id"`
	
	// IDs
	ChatwootMessageID *int      `gorm:"index" json:"chatwoot_message_id,omitempty"`
	WAMessageID       string    `gorm:"index" json:"wa_message_id"` // Provider's message ID
	WAConversationID  string    `gorm:"index" json:"wa_conversation_id"` // E.g., remote JID
	
	// Metadata
	Direction         string    `json:"direction"` // "p2c" (Provider to Chatwoot) or "c2p" (Chatwoot to Provider)
	Status            string    `gorm:"default:sent" json:"status"` // sent, delivered, read, failed
	ErrorMessage      string    `json:"error_message,omitempty"`
	
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// EventExecution tracks the lifecycle of a webhook/event processing
type EventExecution struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID      int       `gorm:"index" json:"account_id"`
	ProviderID     *uuid.UUID `gorm:"type:uuid;index" json:"provider_id,omitempty"`
	
	EventType      string    `json:"event_type"` // e.g., "message.created", "status.update"
	Payload        JSON      `gorm:"type:jsonb" json:"payload"`
	Status         string    `gorm:"default:pending" json:"status"` // pending, processing, success, retry, failed
	
	Retries        int       `gorm:"default:0" json:"retries"`
	MaxRetries     int       `gorm:"default:3" json:"max_retries"`
	NextRetryAt    *time.Time `gorm:"index" json:"next_retry_at,omitempty"`
	
	StartedAt      *time.Time `json:"started_at,omitempty"`
	FinishedAt     *time.Time `json:"finished_at,omitempty"`
	Error          string     `json:"error,omitempty"`
	
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// GatewayLog provides diagnostic logs for the gateway
type GatewayLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Level     string    `json:"level"` // info, warn, error
	Component string    `json:"component"` // gateway, provider, chatwoot
	Message   string    `json:"message"`
	Context   JSON      `gorm:"type:jsonb" json:"context,omitempty"`
	CreatedAt time.Time `json:"created_at" gorm:"index"`
}
