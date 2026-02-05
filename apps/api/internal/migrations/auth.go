package migrations

import (
	"gorm.io/gorm"
	"time"
)

// Session tracks active user sessions for device management and revocation
type Session struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       int       `gorm:"index;not null"`
	AccountID    int       `gorm:"index;not null"`
	RefreshToken string    `gorm:"type:text;not null"` // Storing hash ideally, but for MVP checking existence
	UserAgent    string    `gorm:"type:text"`
	IPAddress    string    `gorm:"type:varchar(45)"`
	ExpiresAt    time.Time `gorm:"index"`
	RevokedAt    *time.Time
	CreatedAt    time.Time
	LastSeenAt   time.Time
}

// APIKey allows server-to-server authentication
type APIKey struct {
	ID        string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	AccountID int        `gorm:"index;not null"`
	Name      string     `gorm:"size:100;not null"`
	Prefix    string     `gorm:"size:10;index;unique;not null"`
	KeyHash   string     `gorm:"text;not null"` // Store bcrypt hash
	Scopes    string     `gorm:"type:text"`     // JSON or comma-separated scopes
	LastUsedAt *time.Time
	ExpiresAt  *time.Time
	RevokedAt  *time.Time
	CreatedAt  time.Time
}

func MigrateAuth(db *gorm.DB) error {
	return db.AutoMigrate(&Session{}, &APIKey{})
}
