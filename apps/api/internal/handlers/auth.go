// Package handlers provides HTTP handlers for the API
package handlers

import (
	"whatpro-hub/internal/middleware"
	"whatpro-hub/internal/models"
	"whatpro-hub/pkg/chatwoot"

	"github.com/gofiber/fiber/v2"
)

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token     string       `json:"token"`
	ExpiresAt string       `json:"expires_at"`
	User      *models.User `json:"user"`
}

// AuthSSO handles POST /api/v1/auth/sso
// Validates Chatwoot token and issues WhatPro Hub JWT
func (h *Handler) AuthSSO(c *fiber.Ctx) error {
	var req SSORequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate against Chatwoot
	client := chatwoot.New(h.Config.ChatwootURL, req.Token)
	cwUser, err := client.ValidateToken()
	if err != nil {
		return h.Error(c, fiber.StatusUnauthorized, "Invalid Chatwoot token")
	}

	// Find or create user in local database
	var user models.User
	result := h.DB.Where("chatwoot_id = ?", cwUser.ID).First(&user)
	if result.Error != nil {
		// Create new user
		user = models.User{
			ChatwootID:   cwUser.ID,
			AccountID:    cwUser.AccountID,
			Email:        cwUser.Email,
			Name:         cwUser.Name,
			AvatarURL:    cwUser.AvatarURL,
			ChatwootRole: cwUser.Role,
			WhatproRole:  determineWhatproRole(cwUser.Role),
		}
		if err := h.DB.Create(&user).Error; err != nil {
			return h.Error(c, fiber.StatusInternalServerError, "Failed to create user")
		}
	} else {
		// Update existing user
		user.Name = cwUser.Name
		user.Email = cwUser.Email
		user.AvatarURL = cwUser.AvatarURL
		user.ChatwootRole = cwUser.Role
		h.DB.Save(&user)
	}

	// Generate JWT
	claims := &middleware.UserClaims{
		UserID:       int(user.ID),
		ChatwootID:   user.ChatwootID,
		AccountID:    user.AccountID,
		Email:        user.Email,
		Name:         user.Name,
		ChatwootRole: user.ChatwootRole,
		WhatproRole:  user.WhatproRole,
	}

	token, expiresAt, err := middleware.GenerateToken(h.Config.JWTSecret, claims)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to generate token")
	}

	return h.Success(c, AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt.Format("2006-01-02T15:04:05Z"),
		User:      &user,
	})
}

// AuthRefresh handles POST /api/v1/auth/refresh
func (h *Handler) AuthRefresh(c *fiber.Ctx) error {
	tokenString := middleware.ExtractToken(c)
	if tokenString == "" {
		return h.Error(c, fiber.StatusUnauthorized, "No token provided")
	}

	// TODO: Validate and refresh token
	return h.Error(c, fiber.StatusNotImplemented, "Not implemented yet")
}

// AuthLogout handles POST /api/v1/auth/logout
func (h *Handler) AuthLogout(c *fiber.Ctx) error {
	// TODO: Invalidate session in Redis
	return h.Success(c, fiber.Map{
		"message": "Logged out successfully",
	})
}

// AuthMe handles GET /api/v1/auth/me
func (h *Handler) AuthMe(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		return h.Error(c, fiber.StatusNotFound, "User not found")
	}

	return h.Success(c, user)
}

// determineWhatproRole maps Chatwoot role to WhatPro role
func determineWhatproRole(chatwootRole string) string {
	switch chatwootRole {
	case "administrator":
		return "admin"
	case "agent":
		return "agent"
	default:
		return "agent"
	}
}
