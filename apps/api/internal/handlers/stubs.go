// Package handlers provides HTTP handlers for the API
// This file contains stub handlers that will be implemented later
package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// =========================================================================
// Board Handlers (Kanban)
// =========================================================================

// Kanban Handlers have been moved to kanban.go

// =========================================================================
// Webhook Handler
// =========================================================================

func (h *Handler) ChatwootWebhook(c *fiber.Ctx) error {
	// TODO: Process Chatwoot webhooks (conversation_created, etc.)
	// For now, just acknowledge
	return c.SendStatus(fiber.StatusOK)
}

// =========================================================================
// Chatwoot Proxy Handler
// =========================================================================

func (h *Handler) ChatwootProxy(c *fiber.Ctx) error {
	// TODO: Proxy requests to Chatwoot API
	return h.Error(c, fiber.StatusNotImplemented, "Not implemented yet")
}
