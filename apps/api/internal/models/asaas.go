// Package models — Asaas payment gateway customer and subscription entities
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AsaasBillingCycle represents the recurrence period for a subscription
type AsaasBillingCycle string

const (
	AsaasBillingMonthly AsaasBillingCycle = "MONTHLY"
	AsaasBillingYearly  AsaasBillingCycle = "YEARLY"
)

// AsaasSubscriptionStatus reflects the current payment state from Asaas webhooks
type AsaasSubscriptionStatus string

const (
	AsaasStatusPending   AsaasSubscriptionStatus = "pending"
	AsaasStatusActive    AsaasSubscriptionStatus = "active"
	AsaasStatusOverdue   AsaasSubscriptionStatus = "overdue"
	AsaasStatusCancelled AsaasSubscriptionStatus = "cancelled"
)

// AsaasCustomer links an account to an Asaas customer object.
// One account maps to exactly one Asaas customer (UNIQUE account_id).
// NEVER log cpf_cnpj — use SanitizeForAudit() before any log call.
type AsaasCustomer struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID uint      `gorm:"not null;uniqueIndex" json:"account_id"`
	// AsaasID is the external identifier returned by the Asaas API (e.g., "cus_000005113026")
	AsaasID   string    `gorm:"size:50;not null;uniqueIndex" json:"asaas_id"`
	Name      string    `gorm:"size:255" json:"name"`
	Email     string    `gorm:"size:255" json:"email"`
	// CpfCnpj is stored but MUST be redacted in all logs and error responses
	CpfCnpj   string    `gorm:"size:20" json:"-"` // omitted from JSON responses
	CreatedAt time.Time `json:"created_at"`
}

// TableName overrides the default GORM table name
func (AsaasCustomer) TableName() string {
	return "asaas_customers"
}

// BeforeCreate sets UUID if not provided
func (a *AsaasCustomer) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// AsaasSubscription tracks the active plan subscription via Asaas.
// Status is updated exclusively by incoming Asaas webhooks — never manually.
type AsaasSubscription struct {
	ID           uuid.UUID               `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID    uint                    `gorm:"not null;index" json:"account_id"`
	CustomerID   uuid.UUID               `gorm:"type:uuid;not null" json:"customer_id"`
	// AsaasSubID is the external subscription identifier from Asaas (e.g., "sub_000001234567")
	AsaasSubID   string                  `gorm:"size:50;not null;uniqueIndex" json:"asaas_sub_id"`
	PlanID       string                  `gorm:"size:50;not null" json:"plan_id"` // e.g., "basic", "pro"
	Status       AsaasSubscriptionStatus `gorm:"size:20;not null;default:'pending'" json:"status"`
	BillingCycle AsaasBillingCycle       `gorm:"size:20;not null" json:"billing_cycle"`
	NextDueDate  *time.Time              `json:"next_due_date,omitempty"`
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`
}

// TableName overrides the default GORM table name
func (AsaasSubscription) TableName() string {
	return "asaas_subscriptions"
}

// BeforeCreate sets UUID if not provided
func (a *AsaasSubscription) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
