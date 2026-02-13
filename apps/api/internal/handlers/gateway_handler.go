package handlers

import (
	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/models"
)

// HandleEvolutionWebhook handles webhooks from Evolution API
func (h *Handler) HandleEvolutionWebhook(c *fiber.Ctx) error {
	instanceToken := c.Params("instanceId") // or token
	
	var payload models.JSON
	if err := c.BodyParser(&payload); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid payload")
	}

	// Async processing? Or Sync? 
	// For high throughput, we might want to push to queue.
	// For now, sync processing with DB log.
	
	if err := h.GatewayService.ProcessEvolutionWebhook(c.Context(), instanceToken, payload); err != nil {
		h.Logger.Printf("Error processing webhook: %v", err)
		return h.Error(c, fiber.StatusInternalServerError, "Processing failed")
	}

	return c.SendStatus(fiber.StatusOK)
}
