// Package handlers provides HTTP handlers for the API
package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"whatpro-hub/internal/config"
)

// Handler holds all dependencies for API handlers
type Handler struct {
	DB     *gorm.DB
	Redis  *redis.Client
	Config *config.Config
}

// NewHandler creates a new Handler with dependencies
func NewHandler(db *gorm.DB, rdb *redis.Client, cfg *config.Config) *Handler {
	return &Handler{
		DB:     db,
		Redis:  rdb,
		Config: cfg,
	}
}

// ErrorHandler is the global error handler
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   message,
		"status":  code,
		"success": false,
	})
}

// Response helper for consistent API responses
func (h *Handler) Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

// SuccessWithMeta helper for paginated responses
func (h *Handler) SuccessWithMeta(c *fiber.Ctx, data interface{}, meta interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
		"meta":    meta,
	})
}

// Error helper for error responses
func (h *Handler) Error(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{
		"success": false,
		"error":   message,
		"status":  status,
	})
}
