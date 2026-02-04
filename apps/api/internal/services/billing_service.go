package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// PaymentProvider interface defines methods for payment gateways
type PaymentProvider interface {
	CreateCustomer(ctx context.Context, user *models.User) (string, error)
	CreateSubscription(ctx context.Context, customerID string, planID string) (string, error)
	CancelSubscription(ctx context.Context, subID string) error
	ParseWebhook(payload []byte) (*models.Transaction, error)
}

// AsaasProvider is the implementation for Asaas
type AsaasProvider struct {
	APIKey string
	URL    string
}

func NewAsaasProvider(apiKey string) *AsaasProvider {
	return &AsaasProvider{APIKey: apiKey, URL: "https://api.asaas.com/v3"}
}

// CreateCustomer creates a customer in Asaas
func (p *AsaasProvider) CreateCustomer(ctx context.Context, user *models.User) (string, error) {
	// TODO: Call Asaas API
	return "cus_" + uuid.NewString(), nil // Stub
}

// CreateSubscription creates a subscription in Asaas
func (p *AsaasProvider) CreateSubscription(ctx context.Context, customerID string, planID string) (string, error) {
	// TODO: Call Asaas API
	return "sub_" + uuid.NewString(), nil // Stub
}

// CancelSubscription cancels a subscription
func (p *AsaasProvider) CancelSubscription(ctx context.Context, subID string) error {
	return nil // Stub
}

// ParseWebhook parses incoming Asaas webhooks
func (p *AsaasProvider) ParseWebhook(payload []byte) (*models.Transaction, error) {
	// TODO: Parse standard Asaas JSON
	return &models.Transaction{
		Status: "paid",
		Amount: 99.90,
		ProviderID: "pay_" + uuid.NewString(),
	}, nil
}


// BillingService handles subscription logic
type BillingService struct {
	repo     *repositories.BillingRepository
	users    *repositories.UserRepository
	provider PaymentProvider
}

// NewBillingService creates a new BillingService
func NewBillingService(repo *repositories.BillingRepository, users *repositories.UserRepository, apiKey string) *BillingService {
	return &BillingService{
		repo:     repo,
		users:    users,
		provider: NewAsaasProvider(apiKey),
	}
}

// SubscribeAccount subscribes an account to a plan
func (s *BillingService) SubscribeAccount(ctx context.Context, accountID int, planID uuid.UUID, userID uint) (*models.Subscription, error) {
	// 1. Get User/Owner for billing details
	user, err := s.users.GetUser(ctx, int(userID))
	if err != nil {
		return nil, err
	}

	// 2. Get Plan to link
	plan, err := s.repo.GetPlan(ctx, planID)
	if err != nil {
		return nil, err
	}

	// 3. Create Remote Customer (Idempotent)
	customerID, err := s.provider.CreateCustomer(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment profile: %w", err)
	}

	// 4. Create Remote Subscription
	subID, err := s.provider.CreateSubscription(ctx, customerID, plan.AsaasID)
	if err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	// 5. Save Local Subscription
	sub := &models.Subscription{
		AccountID:          accountID,
		PlanID:             plan.ID,
		Status:             "pending",
		Provider:           models.ProviderAsaas,
		ProviderSubID:      subID,
		CurrentPeriodStart: time.Now(),
		CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0), // 1 month
	}

	if err := s.repo.CreateSubscription(ctx, sub); err != nil {
		return nil, err
	}

	return sub, nil
}

// ProcessWebhook handles provider callbacks
func (s *BillingService) ProcessWebhook(ctx context.Context, payload []byte) error {
	// 1. Parse generic transaction
	tx, err := s.provider.ParseWebhook(payload)
	if err != nil {
		return err
	}

	// 2. Find Subscription
	sub, err := s.repo.FindSubscriptionByProviderID(ctx, tx.ProviderID) // Assumes we map payment -> sub
	if err != nil {
		return errors.New("subscription not found for payment")
	}

	// 3. Log Transaction
	tx.SubscriptionID = sub.ID
	tx.AccountID = sub.AccountID
	s.repo.CreateTransaction(ctx, tx)

	// 4. Update Subscription Status if Paid
	if tx.Status == "paid" {
		sub.Status = "active"
		sub.CurrentPeriodEnd = time.Now().AddDate(0, 1, 0) // Renew
		return s.repo.UpdateSubscription(ctx, sub)
	} else if tx.Status == "failed" {
		sub.Status = "overdue"
		return s.repo.UpdateSubscription(ctx, sub)
	}

	return nil
}
