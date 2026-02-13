package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"whatpro-hub/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// APIKeyAuth middleware for validating X-API-Key header
func APIKeyAuth(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Get Key from Header
		apiKey := c.Get("X-API-Key")
		if apiKey == "" {
			return c.Next() // Fallback to other auth methods if not present
		}

		// Format: wp_live_<prefix>.<secret>
		parts := strings.Split(apiKey, ".")
		if len(parts) != 2 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid API Key format",
			})
		}

		prefixPart := parts[0] // wp_live_prefix
		secret := parts[1]

		// Extract real prefix (remove wp_live_)
		if !strings.HasPrefix(prefixPart, "wp_live_") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid API Key prefix",
			})
		}
		prefix := strings.TrimPrefix(prefixPart, "wp_live_")

		// 2. Compute Hash of Secret
		hash := sha256.New()
		hash.Write([]byte(secret))
		hashedSecret := hex.EncodeToString(hash.Sum(nil))

		// 3. Find Key in DB by Prefix AND Hash
		var keyRecord models.APIKey
		if err := db.Where("prefix = ? AND key_hash = ?", prefix, hashedSecret).First(&keyRecord).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid API Key",
			})
		}

		// 4. Check Revocation/Expiry
		if keyRecord.RevokedAt != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "API Key revoked",
			})
		}

		// 5. Store in Context
		c.Locals("account_id", keyRecord.AccountID)
		c.Locals("api_key_id", keyRecord.ID)
		c.Locals("scopes", keyRecord.Scopes)
		c.Locals("auth_method", "api_key")

		return c.Next()
	}
}
