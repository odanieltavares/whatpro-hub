// Package handlers provides HTTP handlers for webhooks
package handlers

import (
	"fmt"
	"io"
	"log"

	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/config"
	"whatpro-hub/pkg/webhooks"
)

// WebhookHandler handles webhook processing
type WebhookHandler struct {
	config *config.Config
	logger *log.Logger
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(cfg *config.Config) *WebhookHandler {
	return &WebhookHandler{
		config: cfg,
		logger: log.Default(),
	}
}

// HandleChatwootWebhook processes incoming Chatwoot webhooks
func (h *WebhookHandler) HandleChatwootWebhook(c *fiber.Ctx) error {
	// Read raw body for signature validation
	body := c.Body()
	
	// Get signature from header
	signature := c.Get("X-Chatwoot-Signature", "")
	
	// Validate signature (using JWT_SECRET as webhook secret)
	if err := webhooks.ValidateSignature(body, signature, h.config.JWTSecret); err != nil {
		h.logger.Printf("⚠️  Invalid webhook signature: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid signature",
		})
	}

	// Parse webhook
	webhook, err := webhooks.ParseWebhook(body)
	if err != nil {
		h.logger.Printf("⚠️  Failed to parse webhook: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid payload",
		})
	}

	h.logger.Printf("📥 Received webhook: event=%s, account_id=%d", webhook.Event, webhook.AccountID)

	// Route webhook to appropriate handler
	switch webhook.Event {
	case "conversation_created":
		return h.handleConversationCreated(c, webhook)
	case "conversation_updated":
		return h.handleConversationUpdated(c, webhook)
	case "conversation_status_changed":
		return h.handleConversationStatusChanged(c, webhook)
	case "message_created":
		return h.handleMessageCreated(c, webhook)
	case "message_updated":
		return h.handleMessageUpdated(c, webhook)
	default:
		h.logger.Printf("⚠️  Unknown webhook event: %s", webhook.Event)
		// Still return 200 to avoid retries
		return c.JSON(fiber.Map{
			"success": true,
			"message": fmt.Sprintf("Event %s received but not processed", webhook.Event),
		})
	}
}

// handleConversationCreated processes conversation_created event
func (h *WebhookHandler) handleConversationCreated(c *fiber.Ctx, webhook *webhooks.ChatwootWebhook) error {
	payload, err := webhooks.ParseConversationCreated(webhook.Data)
	if err != nil {
		h.logger.Printf("⚠️  Failed to parse conversation_created: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid conversation payload",
		})
	}

	h.logger.Printf("💬 New conversation #%d created (inbox=%d, contact=%d, status=%s)",
		payload.ID, payload.InboxID, payload.ContactID, payload.Status)

	// TODO: Create a Card in Kanban board
	// - Get or create Board for the account
	// - Get the appropriate Stage (default: "open")
	// - Create a Card with conversation details
	// - Link card to conversation_id

	// For now, just log
	h.logger.Printf("   Contact: %s (%s)", payload.Contact.Name, payload.Contact.PhoneNumber)
	if len(payload.Messages) > 0 {
		h.logger.Printf("   First message: %s", payload.Messages[0].Content)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Conversation created event processed",
		"data": fiber.Map{
			"conversation_id": payload.ID,
			"action":          "logged", // TODO: "card_created"
		},
	})
}

// handleConversationUpdated processes conversation_updated event
func (h *WebhookHandler) handleConversationUpdated(c *fiber.Ctx, webhook *webhooks.ChatwootWebhook) error {
	h.logger.Printf("🔄 Conversation updated: %d", webhook.ID)
	
	// TODO: Update Card in Kanban
	// - Find Card by conversation_id
	// - Update card fields if changed
	
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Conversation updated event processed",
	})
}

// handleConversationStatusChanged processes conversation_status_changed event
func (h *WebhookHandler) handleConversationStatusChanged(c *fiber.Ctx, webhook *webhooks.ChatwootWebhook) error {
	h.logger.Printf("🔀 Conversation status changed: %d", webhook.ID)
	
	// TODO: Move Card to appropriate Stage
	// - Get new status from webhook.Data
	// - Find Card by conversation_id
	// - Move to Stage corresponding to new status
	// - Update card metadata
	
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Conversation status changed event processed",
	})
}

// handleMessageCreated processes message_created event
func (h *WebhookHandler) handleMessageCreated(c *fiber.Ctx, webhook *webhooks.ChatwootWebhook) error {
	payload, err := webhooks.ParseMessageCreated(webhook.Data)
	if err != nil {
		h.logger.Printf("⚠️  Failed to parse message_created: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid message payload",
		})
	}

	msgType := "incoming"
	if payload.MessageType == 0 {
		msgType = "outgoing"
	} else if payload.Private {
		msgType = "note"
	}

	h.logger.Printf("💬 New %s message in conversation #%d: %s",
		msgType, payload.ConversationID, truncate(payload.Content, 50))

	// TODO: Update Card last activity timestamp
	// - Find Card by conversation_id
	// - Update last_message_at
	// - Optionally add to card history
	
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Message created event processed",
		"data": fiber.Map{
			"message_id":      payload.ID,
			"conversation_id": payload.ConversationID,
			"type":            msgType,
		},
	})
}

// handleMessageUpdated processes message_updated event
func (h *WebhookHandler) handleMessageUpdated(c *fiber.Ctx, webhook *webhooks.ChatwootWebhook) error {
	h.logger.Printf("✏️  Message updated: %d", webhook.ID)
	
	// Usually not needed for Kanban, but log for debugging
	
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Message updated event processed",
	})
}

// truncate truncates a string to max length with ellipsis
func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

// HandleWebhookTest is a test endpoint to verify webhook setup
func (h *WebhookHandler) HandleWebhookTest(c *fiber.Ctx) error {
	body, err := io.ReadAll(c.Request().BodyStream())
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to read body",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Webhook test endpoint",
		"data": fiber.Map{
			"headers": c.GetReqHeaders(),
			"body":    string(body),
		},
	})
}
