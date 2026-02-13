package migrations

import (
	"gorm.io/gorm"
	"time"
)

// AccountEntitlements defines the limits and features for an account
type AccountEntitlements struct {
	AccountID            int       `gorm:"primaryKey;autoIncrement:false"`
	MaxInboxes           int       `gorm:"default:2"`
	MaxAgents            int       `gorm:"default:5"`
	MaxTeams             int       `gorm:"default:2"`
	MaxIntegrations      int       `gorm:"default:1"`
	MaxMonthlyMessages   int       `gorm:"default:1000"`
	KanbanEnabled        bool      `gorm:"default:true"`
	AnalyticsEnabled     bool      `gorm:"default:false"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

// UsageDaily tracks daily usage metrics for an account
type UsageDaily struct {
	ID                   uint      `gorm:"primaryKey"`
	AccountID            int       `gorm:"index;not null"`
	Date                 time.Time `gorm:"index;not null;type:date"`
	ActiveUsers          int       `gorm:"default:0"`
	MessagesSent         int       `gorm:"default:0"`
	MessagesReceived     int       `gorm:"default:0"`
	ConversationsOpened  int       `gorm:"default:0"`
	ConversationsResolved int      `gorm:"default:0"`
	APIRequests          int       `gorm:"default:0"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

func MigrateEntitlements(db *gorm.DB) error {
	return db.AutoMigrate(&AccountEntitlements{}, &UsageDaily{})
}
