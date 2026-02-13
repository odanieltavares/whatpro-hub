package models

import (
	"time"

	"github.com/google/uuid"
)

// PaymentProviderEnum defines supported providers
const (
	ProviderAsaas       = "asaas"
	ProviderMercadoPago = "mercadopago"
	ProviderStripe      = "stripe"
)

// Plan represents a SaaS pricing tier
type Plan struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name        string    `json:"name"`        // e.g., "Basic", "Pro"
	Description string    `json:"description"` // e.g., "Up to 5 users"
	Price       float64   `json:"price"`       // Monthly price
	Currency    string    `gorm:"default:BRL" json:"currency"`
	Features    JSON      `gorm:"type:jsonb" json:"features"` // Feature flags/limits
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	
	// External Provider IDs (Mapping)
	AsaasID       string `json:"asaas_id,omitempty"`
	MercadoPagoID string `json:"mercadopago_id,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Subscription represents an Account's active plan
type Subscription struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	AccountID int       `gorm:"index" json:"account_id"`
	PlanID    uuid.UUID `gorm:"type:uuid;index" json:"plan_id"`
	
	Status        string     `gorm:"default:trial" json:"status"` // active, overdue, trial, canceled
	Provider      string     `json:"provider"`                    // asaas, mercadopago
	ProviderSubID string     `gorm:"index" json:"provider_sub_id"` // Subscription ID in external system
	
	CurrentPeriodStart time.Time `json:"current_period_start"`
	CurrentPeriodEnd   time.Time `json:"current_period_end"`
	TrialEndsAt        *time.Time `json:"trial_ends_at,omitempty"`
	CanceledAt         *time.Time `json:"canceled_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Transaction represents a payment event
type Transaction struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	SubscriptionID uuid.UUID `gorm:"type:uuid;index" json:"subscription_id"`
	AccountID      int       `gorm:"index" json:"account_id"`
	
	Amount        float64   `json:"amount"`
	Currency      string    `json:"currency"`
	Status        string    `json:"status"` // paid, pending, failed, refunded
	ProviderID    string    `json:"provider_id"` // Transaction ID in provider
	InvoiceURL    string    `json:"invoice_url"`
	PaymentMethod string    `json:"payment_method"` // credit_card, pix, boleto
	
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}
