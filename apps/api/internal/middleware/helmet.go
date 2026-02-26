package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// Helmet adds security headers to protect against common web vulnerabilities
// Follows OWASP Security Headers recommendations
func Helmet() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Prevent clickjacking attacks
		c.Set("X-Frame-Options", "DENY")

		// Prevent MIME-sniffing
		c.Set("X-Content-Type-Options", "nosniff")

		// Enable browser XSS protection
		c.Set("X-XSS-Protection", "1; mode=block")

		// Referrer policy (don't leak URLs to external sites)
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content Security Policy (strict)
		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline'; " +
			"style-src 'self' 'unsafe-inline'; " +
			"img-src 'self' data: https:; " +
			"font-src 'self' data:; " +
			"connect-src 'self'; " +
			"frame-ancestors 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self'"
		c.Set("Content-Security-Policy", csp)

		// Permissions Policy (restrict dangerous features)
		c.Set("Permissions-Policy",
			"geolocation=(), "+
				"microphone=(), "+
				"camera=(), "+
				"payment=(), "+
				"usb=(), "+
				"magnetometer=()")

		// Strict Transport Security (HTTPS only) - 1 year
		// Only enable in production with HTTPS
		if c.Protocol() == "https" {
			c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		// Remove server identification
		c.Set("Server", "")

		return c.Next()
	}
}
