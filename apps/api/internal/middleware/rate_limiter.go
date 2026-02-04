// Package middleware provides HTTP middleware for the API
package middleware

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/storage/redis/v3"
	redisClient "github.com/redis/go-redis/v9"
)

// RateLimiterConfig holds rate limiter configuration
type RateLimiterConfig struct {
	MaxPerMinute   int
	UseRedis       bool
	RedisClient    *redisClient.Client
	SkipPaths      []string
	TrustedProxies []string
}

// NewIPRateLimiter creates IP-based rate limiter middleware
// This runs BEFORE authentication to protect against DDoS and brute force
func NewIPRateLimiter(cfg RateLimiterConfig) fiber.Handler {
	var storage fiber.Storage

	// Use Redis storage for distributed rate limiting (cluster-ready)
	if cfg.UseRedis && cfg.RedisClient != nil {
		storage = redis.New(redis.Config{
			URL: getRedisURL(cfg.RedisClient),
		})
	}

	return limiter.New(limiter.Config{
		Max:        cfg.MaxPerMinute,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use X-Forwarded-For if behind proxy, otherwise use direct IP
			xff := c.Get("X-Forwarded-For")
			if xff != "" {
				// Take the first IP (client IP)
				ips := strings.Split(xff, ",")
				return "ip_limit:" + strings.TrimSpace(ips[0])
			}
			return "ip_limit:" + c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success":     false,
				"error":       "Too Many Requests",
				"message":     "Rate limit exceeded. Please try again later.",
				"status":      429,
				"retry_after": 60,
			})
		},
		Next: func(c *fiber.Ctx) bool {
			// Skip rate limiting for health check endpoints
			path := c.Path()
			if strings.HasPrefix(path, "/health") {
				return true
			}
			// Skip for configured paths
			for _, skipPath := range cfg.SkipPaths {
				if strings.HasPrefix(path, skipPath) {
					return true
				}
			}
			return false
		},
		Storage: storage,
	})
}

// Role-based rate limits (requests per minute)
var roleLimits = map[string]int{
	"agent":       200,
	"supervisor":  500,
	"admin":       1000,
	"super_admin": 0, // 0 means unlimited
}

// NewRoleRateLimiter creates role-based rate limiter middleware
// This runs AFTER authentication to apply per-user limits based on role
// Note: Using fixed max for Fiber v2 compatibility (v3 has MaxFunc)
func NewRoleRateLimiter(rdb *redisClient.Client) fiber.Handler {
	var storage fiber.Storage

	if rdb != nil {
		storage = redis.New(redis.Config{
			URL: getRedisURL(rdb),
		})
	}

	// For Fiber v2, we use a fixed max and skip super_admin
	// Role-based dynamic limits would need custom middleware in v2
	return limiter.New(limiter.Config{
		Max:        200, // Default limit (agents)
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use user ID for role-based limiting
			userID, ok := c.Locals("user_id").(int)
			if !ok {
				// Fallback to IP if user ID not available
				return fmt.Sprintf("role_limit:%s", c.IP())
			}
			return fmt.Sprintf("role_limit:%d", userID)
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success":     false,
				"error":       "Rate Limit Exceeded",
				"message":     "You have exceeded your rate limit. Please wait before making more requests.",
				"status":      429,
				"retry_after": 60,
			})
		},
		Next: func(c *fiber.Ctx) bool {
			// Skip rate limiting for super_admin and admin
			role, ok := c.Locals("whatpro_role").(string)
			if ok && (role == "super_admin" || role == "admin") {
				return true
			}
			return false
		},
		Storage: storage,
	})
}

// getRedisURL builds Redis URL from client options
// This is a workaround since gofiber/storage/redis/v3 doesn't accept Conn directly
func getRedisURL(client *redisClient.Client) string {
	opts := client.Options()
	// Build URL: redis://user:password@host:port/db
	if opts.Password != "" {
		return fmt.Sprintf("redis://:%s@%s/%d", opts.Password, opts.Addr, opts.DB)
	}
	return fmt.Sprintf("redis://%s/%d", opts.Addr, opts.DB)
}
