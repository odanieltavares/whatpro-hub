package middleware

import (
	"whatpro-hub/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// SessionAuth creates a middleware that checks for active session
func SessionAuth(authService *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Extract Refresh Token from Cookie (preferred) or Header
		refreshToken := c.Cookies("refresh_token")
		if refreshToken == "" {
			// Fallback to header for mobile/API clients
			authHeader := c.Get("X-Refresh-Token")
			if authHeader != "" {
				refreshToken = authHeader
			}
		}

		if refreshToken == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing refresh token",
			})
		}
		
		// 2. Extract Session ID from context (set by JWT middleware usually, 
		// but here we might be hitting refresh endpoint)
		// For verification flow, we need the session ID. 
		// Assume it comes from the JWT 'sid' claim if verified, or request body.
		// IMPLEMENTATION NOTE: Real world flow:
		// Access Token (JWT) -> contains 'sid'
		// Middleware verifies JWT -> Extracts 'sid' -> Checks DB if 'sid' is revoked.
		
		sessionIDstr := c.Locals("session_id")
		if sessionIDstr == nil {
             // If we are just checking access token validity, we need 'sid' claim.
			 // If this middleware runs AFTER JWT middleware, 'sid' should be in Locals.
			 return c.Next() 
		}

		sessionUUID, err := uuid.Parse(sessionIDstr.(string))
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid session ID",
			})
		}

		// 3. Verify Session in DB
		_, err = authService.VerifySession(sessionUUID, refreshToken)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Session revoked or expired",
			})
		}

		return c.Next()
	}
}
