// Package handlers provides HTTP handlers for the API
package handlers

import (
	"time"
	"whatpro-hub/internal/middleware"
	"whatpro-hub/internal/models"
	"whatpro-hub/pkg/chatwoot"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// SSORequest is the request body for SSO
type SSORequest struct {
	Token string `json:"token" validate:"required"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresAt    string       `json:"expires_at"`
	User         *models.User `json:"user"`
}

// AuthSSO handles POST /api/v1/auth/sso
// @Summary Authenticate via Chatwoot SSO
// @Description Validates Chatwoot token and issues WhatPro Hub JWT
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body SSORequest true "SSO Token"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /auth/sso [post]
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

	accessToken, refreshToken, expiresAt, err := middleware.GenerateTokens(h.Config.JWTSecret, claims)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to generate token")
	}

	return h.Success(c, AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt.Format("2006-01-02T15:04:05Z"),
		User:         &user,
	})
}

// RefreshRequest is the request body for refreshing token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// AuthRefresh handles POST /api/v1/auth/refresh
// @Summary Refresh access token
// @Description Rotate access tokens using refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh Token"
// @Success 200 {object} AuthResponse
// @Failure 401 {object} map[string]interface{}
// @Router /auth/refresh [post]
func (h *Handler) AuthRefresh(c *fiber.Ctx) error {
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Parse Refresh Token
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.Config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return h.Error(c, fiber.StatusUnauthorized, "Invalid refresh token")
	}

	// Check if refresh token is blacklisted in Redis
	if h.Redis != nil {
		claims, ok := token.Claims.(jwt.MapClaims)
		if ok {
			jti, _ := claims["jti"].(string)
			if jti != "" {
				isBlacklisted, _ := h.Redis.Get(c.Context(), "blacklist:"+jti).Result()
				if isBlacklisted != "" {
					return h.Error(c, fiber.StatusUnauthorized, "Token revoked")
				}
			}
		}
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["sub"] != "refresh" {
		return h.Error(c, fiber.StatusUnauthorized, "Invalid token type")
	}

	// Extract User Info from Refresh Token Claims
	userID := int(claims["user_id"].(float64))

	// Verify user still exists and is active
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		return h.Error(c, fiber.StatusUnauthorized, "User no longer exists")
	}

	// Generate New Tokens
	newClaims := &middleware.UserClaims{
		UserID:       int(user.ID),
		ChatwootID:   user.ChatwootID,
		AccountID:    user.AccountID,
		Email:        user.Email,
		Name:         user.Name,
		ChatwootRole: user.ChatwootRole,
		WhatproRole:  user.WhatproRole,
	}

	accessToken, refreshToken, expiresAt, err := middleware.GenerateTokens(h.Config.JWTSecret, newClaims)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to generate tokens")
	}

	return h.Success(c, AuthResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt.Format("2006-01-02T15:04:05Z"),
		User:         &user,
	})
}

// LogoutRequest is the request body for logout
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// AuthLogout handles POST /api/v1/auth/logout
// @Summary Logout user
// @Description Invalidate session and tokens
// @Tags Auth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param request body LogoutRequest false "Refresh Token to revoke"
// @Success 200 {object} map[string]interface{}
// @Router /auth/logout [post]
func (h *Handler) AuthLogout(c *fiber.Ctx) error {
	// 1. Revoke Access Token (from Header)
	token := c.Locals("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	jti, _ := claims["jti"].(string)

	if jti != "" && h.Redis != nil {
		h.Redis.Set(c.Context(), "blacklist:"+jti, "revoked", 15*time.Minute) // Access token is short-lived
	}

	// 2. Revoke Refresh Token (from Body)
	var req LogoutRequest
	if err := c.BodyParser(&req); err == nil && req.RefreshToken != "" {
		refreshToken, _ := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
			return []byte(h.Config.JWTSecret), nil
		})
		
		if refreshToken != nil {
			if refreshClaims, ok := refreshToken.Claims.(jwt.MapClaims); ok {
				refreshJti, _ := refreshClaims["jti"].(string)
				if refreshJti != "" && h.Redis != nil {
					h.Redis.Set(c.Context(), "blacklist:"+refreshJti, "revoked", 7*24*time.Hour)
				}
			}
		}
	}

	return h.Success(c, fiber.Map{
		"message": "Logged out successfully",
	})
}

// AuthMe handles GET /api/v1/auth/me
// @Summary Get current user
// @Description Get details of currently logged in user
// @Tags Auth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Success 200 {object} models.User
// @Failure 404 {object} map[string]interface{}
// @Router /auth/me [get]
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
