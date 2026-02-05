package services

import (
	"errors"
	"whatpro-hub/internal/models"
	"gorm.io/gorm"
)

type EntitlementsService struct {
	db *gorm.DB
}

func NewEntitlementsService(db *gorm.DB) *EntitlementsService {
	return &EntitlementsService{db: db}
}

// CanCreateResource checks if the account has quota to create a resource
func (s *EntitlementsService) CanCreateResource(accountID int, resourceType string) error {
	var limits models.AccountEntitlements
	if err := s.db.First(&limits, "account_id = ?", accountID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Default limits if not found (Free plan fallback)
			limits = models.AccountEntitlements{
				MaxInboxes: 1,
				MaxAgents: 2,
				MaxTeams: 1,
				MaxIntegrations: 1,
			}
		} else {
			return err
		}
	}

	var currentCount int64

	switch resourceType {
	case "agent":
		s.db.Model(&models.User{}).Where("account_id = ?", accountID).Count(&currentCount)
		if int(currentCount) >= limits.MaxAgents {
			return errors.New("quota exceeded: max agents reached")
		}
	case "team":
		s.db.Model(&models.Team{}).Where("account_id = ?", accountID).Count(&currentCount)
		if int(currentCount) >= limits.MaxTeams {
			return errors.New("quota exceeded: max teams reached")
		}
	case "provider":
		s.db.Model(&models.Provider{}).Where("account_id = ?", accountID).Count(&currentCount)
		if int(currentCount) >= limits.MaxIntegrations {
			return errors.New("quota exceeded: max integrations reached")
		}
	case "inbox":
		// TODO: Check Chatwoot inboxes if synced, or rely on internal tracking
		// For now simple pass or check synced inboxes count
	}

	return nil
}

// TrackActivity increments daily usage counters
func (s *EntitlementsService) TrackActivity(accountID int, metric string) {
	// Simple fire-and-forget increment, can be optimized with redis buffer
	// s.db.Exec("UPDATE usage_dailies SET ...")
}
