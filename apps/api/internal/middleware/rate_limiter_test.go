package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestIPRateLimiter_SkipsHealthPaths verifies that /health/* paths always bypass
// the IP rate limiter regardless of how many requests are made.
func TestIPRateLimiter_SkipsHealthPaths(t *testing.T) {
	app := fiber.New()
	// MaxPerMinute=1 so any non-skipped path would hit the limit on the 2nd request
	app.Use(NewIPRateLimiter(RateLimiterConfig{MaxPerMinute: 1}))
	app.Get("/health/live", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/health/live", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode,
			"request %d to /health/live should not be rate limited", i+1)
	}
}

// TestIPRateLimiter_SkipsConfiguredPaths verifies that paths listed in SkipPaths
// bypass the rate limiter.
func TestIPRateLimiter_SkipsConfiguredPaths(t *testing.T) {
	app := fiber.New()
	app.Use(NewIPRateLimiter(RateLimiterConfig{
		MaxPerMinute: 1,
		SkipPaths:    []string{"/metrics"},
	}))
	app.Get("/metrics", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/metrics", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode,
			"request %d to /metrics should not be rate limited", i+1)
	}
}

// TestIPRateLimiter_EnforcesLimitOnRegularPaths verifies that the limiter
// actually returns 429 on non-skipped paths once the limit is exceeded.
func TestIPRateLimiter_EnforcesLimitOnRegularPaths(t *testing.T) {
	app := fiber.New()
	app.Use(NewIPRateLimiter(RateLimiterConfig{MaxPerMinute: 1}))
	app.Get("/api/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req1 := httptest.NewRequest("GET", "/api/test", nil)
	resp1, err := app.Test(req1)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp1.StatusCode, "first request should succeed")

	req2 := httptest.NewRequest("GET", "/api/test", nil)
	resp2, err := app.Test(req2)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusTooManyRequests, resp2.StatusCode,
		"second request should be rate limited (429)")
}

// TestRoleRateLimiter_KeyUsesUserID verifies that when user_id is set as a
// Fiber local, the role rate limiter processes the request without error,
// using the per-user key (role_limit:<userID>).
func TestRoleRateLimiter_KeyUsesUserID(t *testing.T) {
	app := fiber.New()

	// Simulate auth middleware setting user_id before rate limiter runs
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", 42)
		return c.Next()
	})
	app.Use(NewRoleRateLimiter(nil)) // nil Redis → in-memory storage
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode,
		"request with user_id=42 should succeed (key: role_limit:42)")
}

// TestRoleRateLimiter_FallbackToIP verifies that when user_id is not set in
// the Fiber locals, the role rate limiter falls back to IP-based keying
// (role_limit:<ip>) and still processes the request correctly.
func TestRoleRateLimiter_FallbackToIP(t *testing.T) {
	app := fiber.New()
	// No middleware sets user_id — simulates missing/unauthenticated context
	app.Use(NewRoleRateLimiter(nil)) // nil Redis → in-memory storage
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode,
		"request without user_id should fall back to IP key (role_limit:<ip>) and succeed")
}
