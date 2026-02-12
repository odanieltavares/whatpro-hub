// Package middleware provides HTTP middleware for the API
package middleware

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// UserClaims represents the JWT claims for a user
type UserClaims struct {
	UserID       int    `json:"user_id"`
	ChatwootID   int    `json:"chatwoot_id"`
	AccountID    int    `json:"account_id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	ChatwootRole string `json:"chatwoot_role"`
	WhatproRole  string `json:"whatpro_role"`
	jwt.RegisteredClaims
}

// JWT returns the JWT authentication middleware
func JWT(secret string, rdb *redis.Client) fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(secret)},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Unauthorized",
				"message": "Invalid or expired token",
			})
		},
		SuccessHandler: func(c *fiber.Ctx) error {
			// Extract user claims and store in context
			token := c.Locals("user").(*jwt.Token)
			claims := token.Claims.(jwt.MapClaims)

			// Check if token is blacklisted (if Redis is available)
			if rdb != nil {
				jti, ok := claims["jti"].(string)
				if ok {
					isBlacklisted, _ := rdb.Get(c.Context(), "blacklist:"+jti).Result()
					if isBlacklisted != "" {
						return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
							"error":   "Unauthorized",
							"message": "Token revoked",
						})
					}
				}
			}

			c.Locals("user_id", int(claims["user_id"].(float64)))
			c.Locals("chatwoot_id", int(claims["chatwoot_id"].(float64)))
			c.Locals("account_id", int(claims["account_id"].(float64)))
			c.Locals("email", claims["email"].(string))
			c.Locals("name", claims["name"].(string))
			c.Locals("chatwoot_role", claims["chatwoot_role"].(string))
			c.Locals("whatpro_role", claims["whatpro_role"].(string))

			return c.Next()
		},
	})
}

// RequireRole checks if the user has one of the required roles
func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("whatpro_role").(string)

		// super_admin has access to everything
		if userRole == "super_admin" {
			return c.Next()
		}

		// Check if user role is in allowed roles
		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Forbidden",
			"message": "Insufficient permissions for this action",
		})
	}
}

// RequireAccountAccess ensures the user has access to the requested account
func RequireAccountAccess() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userAccountID := c.Locals("account_id").(int)
		userRole := c.Locals("whatpro_role").(string)

		// super_admin can access all accounts
		if userRole == "super_admin" {
			return c.Next()
		}

		// Get account ID from path parameter
		accountID, err := c.ParamsInt("accountId")
		if err != nil {
			// If no accountId in path, allow (might be other routes)
			return c.Next()
		}

		// Check if user belongs to this account
		if userAccountID != accountID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Forbidden",
				"message": "Access denied to this account",
			})
		}

		return c.Next()
	}
}

// GenerateTokens creates new access and refresh tokens for a user
func GenerateTokens(secret string, claims *UserClaims) (string, string, time.Time, error) {
	// 1. Access Token (Short-lived: 15 mins)
	accessExpires := time.Now().Add(15 * time.Minute)
	accessID := uuid.New().String()
	
	claims.RegisteredClaims = jwt.RegisteredClaims{
		ID:        accessID,
		ExpiresAt: jwt.NewNumericDate(accessExpires),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "whatpro-hub",
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessTokenString, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		return "", "", time.Time{}, err
	}

	// 2. Refresh Token (Long-lived: 7 days)
	refreshExpires := time.Now().Add(7 * 24 * time.Hour)
	refreshID := uuid.New().String()
	
	// Copy claims but set new exp
	refreshClaims := *claims
	refreshClaims.RegisteredClaims = jwt.RegisteredClaims{
		ID:        refreshID,
		ExpiresAt: jwt.NewNumericDate(refreshExpires),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "whatpro-hub",
		Subject:   "refresh",
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		return "", "", time.Time{}, err
	}

	return accessTokenString, refreshTokenString, accessExpires, nil
}

// ExtractToken extracts the token from the Authorization header
func ExtractToken(c *fiber.Ctx) string {
	auth := c.Get("Authorization")
	if auth == "" {
		return ""
	}

	parts := strings.Split(auth, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}

	return parts[1]
}
