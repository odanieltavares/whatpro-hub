package handlers

import (
	"github.com/gofiber/fiber/v2"
)

// SyncAccounts syncs accounts from Chatwoot
func (h *Handler) SyncAccounts(c *fiber.Ctx) error {
	// Only super_admin can sync
	if err := h.AccountService.SyncFromChatwoot(c.Context()); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to sync accounts")
	}

	return h.Success(c, fiber.Map{
		"message": "Accounts synced successfully",
	})
}
