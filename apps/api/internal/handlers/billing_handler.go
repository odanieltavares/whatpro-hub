package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// HandleAsaasWebhook handles webhooks from Asaas
func (h *Handler) HandleAsaasWebhook(c *fiber.Ctx) error {
	if err := h.BillingService.ProcessWebhook(c.Context(), c.Body()); err != nil {
		h.Logger.Printf("Error processing payment webhook: %v", err)
		return h.Error(c, fiber.StatusInternalServerError, "Processing failed")
	}
	return c.SendStatus(fiber.StatusOK)
}

// SubscribeAccount handles plan subscription requests
func (h *Handler) SubscribeAccount(c *fiber.Ctx) error {
	type Request struct {
		PlanID uuid.UUID `json:"plan_id"`
	}
	
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request")
	}

	// Assume Auth middleware sets UserID and AccountID
	// For now mocked
	accountID := 1 
	userID := uint(1)

	sub, err := h.BillingService.SubscribeAccount(c.Context(), accountID, req.PlanID, userID)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(sub)
}
