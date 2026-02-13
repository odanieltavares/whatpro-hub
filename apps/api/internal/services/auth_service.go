package services

import (
	"errors"
	"time"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"

	"github.com/google/uuid"
)

type AuthService struct {
	SessionRepo repositories.SessionRepository
	UserRepo    repositories.UserRepository
}

func NewAuthService(sessionRepo repositories.SessionRepository, userRepo repositories.UserRepository) *AuthService {
	return &AuthService{
		SessionRepo: sessionRepo,
		UserRepo:    userRepo,
	}
}

// CreateSession creates a new session for a user
func (s *AuthService) CreateSession(userID, accountID int, ip, userAgent string) (*models.Session, string, error) {
	// 1. Generate Refresh Token (Opaque or JWT, here using UUID for simplicity/opacity)
	refreshToken := uuid.New().String()

	// 2. Create Session Record
	session := &models.Session{
		UserID:       uint(userID),
		AccountID:    accountID,
		RefreshToken: refreshToken, 
		IPAddress:    ip,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour), // 7 days expiration
		LastSeenAt:   nil, // Handled by pointer logic if needed, or set to Now
	}
	now := time.Now()
	session.LastSeenAt = &now

	if err := s.SessionRepo.Create(session); err != nil {
		return nil, "", err
	}

	return session, refreshToken, nil
}

// VerifySession checks if a session is valid and active
func (s *AuthService) VerifySession(sessionID uuid.UUID, refreshToken string) (*models.Session, error) {
	session, err := s.SessionRepo.FindByID(sessionID)
	if err != nil {
		return nil, errors.New("intervals: session not found")
	}

	if session.RevokedAt != nil {
		return nil, errors.New("intervals: session revoked")
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, errors.New("intervals: session expired")
	}

	// In production, compare Hash(refreshToken)
	if session.RefreshToken != refreshToken {
		return nil, errors.New("intervals: invalid token")
	}

	// Update LastSeen
	s.SessionRepo.UpdateLastSeen(sessionID)

	return session, nil
}

// RevokeSession revokes a single session
func (s *AuthService) RevokeSession(sessionID uuid.UUID) error {
	return s.SessionRepo.Revoke(sessionID)
}

// RevokeAllSessions revokes all sessions for a user
func (s *AuthService) RevokeAllUserSessions(userID int) error {
	return s.SessionRepo.RevokeAllForUser(userID)
}
