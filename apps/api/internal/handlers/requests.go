package handlers

import (
	"whatpro-hub/internal/models"
)

// ============================================================================
// Provider Requests
// ============================================================================

// ListProvidersRequest represents the query parameters for listing providers
type ListProvidersRequest struct {
	AccountID int    `query:"account_id"`
	Status    string `query:"status"`
	Type      string `query:"type"`
	Page      int    `query:"page"`
	Limit     int    `query:"limit"`
}

// CreateProviderRequest represents the request body for creating a provider
type CreateProviderRequest struct {
	Name           string      `json:"name" validate:"required,min=3,max=100"`
	Type           string      `json:"type" validate:"required,provider_type"`
	BaseURL        string      `json:"base_url" validate:"required,url"`
	APIKey         string      `json:"api_key" validate:"required,min=32"`
	InstanceName   string      `json:"instance_name" validate:"required,min=3,max=50"`
	HealthCheckURL string      `json:"health_check_url,omitempty" validate:"omitempty,url"`
	Metadata       models.JSON `json:"metadata,omitempty"`
}

// UpdateProviderRequest represents the request body for updating a provider
type UpdateProviderRequest struct {
	Name           *string      `json:"name,omitempty" validate:"omitempty,min=3,max=100"`
	Type           *string      `json:"type,omitempty" validate:"omitempty,provider_type"`
	BaseURL        *string      `json:"base_url,omitempty" validate:"omitempty,url"`
	APIKey         *string      `json:"api_key,omitempty" validate:"omitempty,min=32"`
	InstanceName   *string      `json:"instance_name,omitempty" validate:"omitempty,min=3,max=50"`
	HealthCheckURL *string      `json:"health_check_url,omitempty" validate:"omitempty,url"`
	Status         *string      `json:"status,omitempty" validate:"omitempty,oneof=connected disconnected error"`
	Metadata       *models.JSON `json:"metadata,omitempty"`
}

// ============================================================================
// Account Requests
// ============================================================================

// ListAccountsRequest represents the query parameters for listing accounts
type ListAccountsRequest struct {
	Status string `query:"status"`
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
}

// CreateAccountRequest represents the request body for creating an account
type CreateAccountRequest struct {
	ChatwootID   int    `json:"chatwoot_id" validate:"required,gt=0"`
	Name         string `json:"name" validate:"required,min=2,max=100"`
	Locale       string `json:"locale,omitempty" validate:"omitempty,len=5"` // pt_BR, en_US, etc.
	Domain       string `json:"domain,omitempty" validate:"omitempty,hostname"`
	SupportEmail string `json:"support_email,omitempty" validate:"omitempty,email"`
}

// UpdateAccountRequest represents the request body for updating an account
type UpdateAccountRequest struct {
	Name         *string      `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Locale       *string      `json:"locale,omitempty" validate:"omitempty,len=5"`
	Domain       *string      `json:"domain,omitempty" validate:"omitempty,hostname"`
	SupportEmail *string      `json:"support_email,omitempty" validate:"omitempty,email"`
	Status       *string      `json:"status,omitempty" validate:"omitempty,oneof=active inactive suspended"`
	Features     *models.JSON `json:"features,omitempty"`
	Settings     *models.JSON `json:"settings,omitempty"`
}

// ============================================================================
// User Requests
// ============================================================================

// CreateUserRequest represents the request body for creating a user
type CreateUserRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Name        string `json:"name" validate:"required,min=2,max=100"`
	WhatproRole string `json:"whatpro_role" validate:"required,whatpro_role"`
	AvatarURL   string `json:"avatar_url,omitempty" validate:"omitempty,url"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	Name               *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	WhatproRole        *string `json:"whatpro_role,omitempty" validate:"omitempty,whatpro_role"`
	AvatarURL          *string `json:"avatar_url,omitempty" validate:"omitempty,url"`
	AvailabilityStatus *string `json:"availability_status,omitempty" validate:"omitempty,oneof=online offline busy"`
}

// ============================================================================
// Team Requests
// ============================================================================

// CreateTeamRequest represents the request body for creating a team
type CreateTeamRequest struct {
	Name            string `json:"name" validate:"required,min=2,max=100"`
	Description     string `json:"description,omitempty" validate:"omitempty,max=500"`
	AllowAutoAssign bool   `json:"allow_auto_assign"`
}

// UpdateTeamRequest represents the request body for updating a team
type UpdateTeamRequest struct {
	Name            *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Description     *string `json:"description,omitempty" validate:"omitempty,max=500"`
	AllowAutoAssign *bool   `json:"allow_auto_assign,omitempty"`
}

// AddTeamMemberRequest represents the request body for adding a team member
type AddTeamMemberRequest struct {
	UserID int    `json:"user_id" validate:"required,gt=0"`
	Role   string `json:"role,omitempty" validate:"omitempty,oneof=member lead"`
}

// ============================================================================
// Kanban Requests
// ============================================================================

// CreateBoardRequest represents the request body for creating a board
type CreateBoardRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Description string `json:"description,omitempty" validate:"omitempty,max=500"`
	Type        string `json:"type,omitempty" validate:"omitempty,oneof=pipeline support custom"`
	IsDefault   bool   `json:"is_default"`
}

// UpdateBoardRequest represents the request body for updating a board
type UpdateBoardRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
	IsDefault   *bool   `json:"is_default,omitempty"`
}

// CreateStageRequest represents the request body for creating a stage
type CreateStageRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=50"`
	Color    string `json:"color,omitempty" validate:"omitempty,hexcolor"`
	Position int    `json:"position" validate:"gte=0"`
}

// UpdateStageRequest represents the request body for updating a stage
type UpdateStageRequest struct {
	Name     *string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
	Color    *string `json:"color,omitempty" validate:"omitempty,hexcolor"`
	Position *int    `json:"position,omitempty" validate:"omitempty,gte=0"`
}

// ReorderStagesRequest represents the request body for reordering stages
type ReorderStagesRequest struct {
	StageIDs []string `json:"stage_ids" validate:"required,min=1,dive,uuid"`
}

// CreateCardRequest represents the request body for creating a card
type CreateCardRequest struct {
	Title          string `json:"title" validate:"required,min=2,max=200"`
	Description    string `json:"description,omitempty" validate:"omitempty,max=2000"`
	StageID        string `json:"stage_id" validate:"required,uuid"`
	AssigneeID     *int   `json:"assignee_id,omitempty" validate:"omitempty,gt=0"`
	ConversationID *int   `json:"conversation_id,omitempty" validate:"omitempty,gt=0"`
	Priority       string `json:"priority,omitempty" validate:"omitempty,oneof=low medium high urgent"`
	DueDate        string `json:"due_date,omitempty" validate:"omitempty,datetime=2006-01-02"`
}

// UpdateCardRequest represents the request body for updating a card
type UpdateCardRequest struct {
	Title       *string `json:"title,omitempty" validate:"omitempty,min=2,max=200"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=2000"`
	AssigneeID  *int    `json:"assignee_id,omitempty" validate:"omitempty,gte=0"` // 0 to unassign
	Priority    *string `json:"priority,omitempty" validate:"omitempty,oneof=low medium high urgent"`
	DueDate     *string `json:"due_date,omitempty" validate:"omitempty,datetime=2006-01-02"`
}
// MoveCardRequest represents the request body for moving a card
type MoveCardRequest struct {
	StageID  string `json:"stage_id" validate:"required,uuid"`
	Position int    `json:"position" validate:"gte=0"`
}

// ============================================================================
// Auth Requests
// ============================================================================

// SSORequest represents the SSO authentication request
type SSORequest struct {
	Token     string `json:"token" validate:"required,min=10"`
	AccountID int    `json:"account_id" validate:"required,gt=0"`
}

// RefreshTokenRequest represents the token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required,min=10"`
}
