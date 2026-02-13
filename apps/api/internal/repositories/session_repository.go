package repositories

import (
	"whatpro-hub/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionRepository interface {
	Create(session *models.Session) error
	FindByID(id uuid.UUID) (*models.Session, error)
	Revoke(id uuid.UUID) error
	RevokeAllForUser(userID int) error
	UpdateLastSeen(id uuid.UUID) error
}

type sessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

func (r *sessionRepository) FindByID(id uuid.UUID) (*models.Session, error) {
	var session models.Session
	err := r.db.Where("id = ?", id).First(&session).Error
	return &session, err
}

func (r *sessionRepository) Revoke(id uuid.UUID) error {
	return r.db.Model(&models.Session{}).Where("id = ?", id).Update("revoked_at", gorm.Expr("NOW()")).Error
}

func (r *sessionRepository) RevokeAllForUser(userID int) error {
	return r.db.Model(&models.Session{}).Where("user_id = ? AND revoked_at IS NULL", userID).Update("revoked_at", gorm.Expr("NOW()")).Error
}

func (r *sessionRepository) UpdateLastSeen(id uuid.UUID) error {
	return r.db.Model(&models.Session{}).Where("id = ?", id).Update("last_seen_at", gorm.Expr("NOW()")).Error
}
