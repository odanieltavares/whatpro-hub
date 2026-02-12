// Package handlers contains HTTP handlers for chat module
package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"whatpro-hub/internal/middleware"
	"whatpro-hub/internal/services"
)

// ChatHandler handles chat HTTP requests
type ChatHandler struct {
	chatService *services.ChatService
}

// NewChatHandler creates a new chat handler
func NewChatHandler(chatService *services.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

// ============================================================================
// ROOMS
// ============================================================================

// ListRooms godoc
// @Summary List chat rooms
// @Description Get all chat rooms where current user is a member
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms [get]
// @Security BearerAuth
func (h *ChatHandler) ListRooms(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)

	rooms, err := h.chatService.GetMyRooms(c.Context(), accountID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to list rooms",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data":  rooms,
		"count": len(rooms),
	})
}

// CreateRoom godoc
// @Summary Create chat room
// @Description Create a new chat room (DM or group)
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param body body services.CreateRoomRequest true "Room creation request"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms [post]
// @Security BearerAuth
func (h *ChatHandler) CreateRoom(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)

	var req services.CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Validate
	if errs := middleware.ValidateStruct(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":  "Validation failed",
			"errors": errs,
		})
	}

	room, err := h.chatService.CreateRoom(c.Context(), accountID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to create room",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": room,
	})
}

// GetRoom godoc
// @Summary Get chat room
// @Description Get a chat room by ID
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId} [get]
// @Security BearerAuth
func (h *ChatHandler) GetRoom(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	room, err := h.chatService.GetRoom(c.Context(), accountID, userID, roomID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   "Room not found",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": room,
	})
}

// ============================================================================
// MEMBERS
// ============================================================================

// AddMemberRequest represents add member request body
type AddMemberRequest struct {
	UserID int `json:"user_id" validate:"required"`
}

// AddMember godoc
// @Summary Add room member
// @Description Add a user to a chat room (requires owner or moderator)
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Param body body AddMemberRequest true "Add member request"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId}/members [post]
// @Security BearerAuth
func (h *ChatHandler) AddMember(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	actorID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	var req AddMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.chatService.AddMember(c.Context(), accountID, actorID, roomID, req.UserID); err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "permission denied: requires owner or moderator role" {
			status = fiber.StatusForbidden
		}
		return c.Status(status).JSON(fiber.Map{
			"error":   "Failed to add member",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Member added successfully",
	})
}

// RemoveMember godoc
// @Summary Remove room member
// @Description Remove a user from a chat room
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Param userId path int true "User ID to remove"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId}/members/{userId} [delete]
// @Security BearerAuth
func (h *ChatHandler) RemoveMember(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	actorID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")
	targetUserID, err := c.ParamsInt("userId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	if err := h.chatService.RemoveMember(c.Context(), accountID, actorID, roomID, targetUserID); err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "permission denied: requires owner or moderator role" {
			status = fiber.StatusForbidden
		}
		return c.Status(status).JSON(fiber.Map{
			"error":   "Failed to remove member",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Member removed successfully",
	})
}

// ============================================================================
// MESSAGES
// ============================================================================

// ListMessages godoc
// @Summary List room messages
// @Description Get paginated messages for a room
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Param limit query int false "Limit (default 50, max 100)"
// @Param cursor query string false "Cursor (RFC3339 timestamp)"
// @Success 200 {object} map[string]interface{}
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId}/messages [get]
// @Security BearerAuth
func (h *ChatHandler) ListMessages(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")
	limit := c.QueryInt("limit", 50)

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	var cursor *time.Time
	cursorStr := c.Query("cursor")
	if cursorStr != "" {
		t, err := time.Parse(time.RFC3339, cursorStr)
		if err == nil {
			cursor = &t
		}
	}

	messages, err := h.chatService.GetMessages(c.Context(), accountID, userID, roomID, limit, cursor)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Failed to get messages",
			"message": err.Error(),
		})
	}

	var nextCursor string
	if len(messages) > 0 {
		nextCursor = messages[len(messages)-1].CreatedAt.Format(time.RFC3339Nano)
	}

	return c.JSON(fiber.Map{
		"data":        messages,
		"count":       len(messages),
		"next_cursor": nextCursor,
	})
}

// SendMessage godoc
// @Summary Send message
// @Description Send a message to a room
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Param body body services.SendMessageRequest true "Message request"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId}/messages [post]
// @Security BearerAuth
func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	var req services.SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if errs := middleware.ValidateStruct(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":  "Validation failed",
			"errors": errs,
		})
	}

	message, err := h.chatService.SendMessage(c.Context(), accountID, userID, roomID, req)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Failed to send message",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": message,
	})
}

// DeleteMessage godoc
// @Summary Delete message
// @Description Soft-delete a message (sender or moderator only)
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param messageId path string true "Message ID" format(uuid)
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /accounts/{accountId}/chat/messages/{messageId} [delete]
// @Security BearerAuth
func (h *ChatHandler) DeleteMessage(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	actorID := c.Locals("user_id").(int)
	messageIDStr := c.Params("messageId")

	messageID, err := uuid.Parse(messageIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	if err := h.chatService.DeleteMessage(c.Context(), accountID, actorID, messageID); err != nil {
		status := fiber.StatusBadRequest
		if err.Error() == "message not found" {
			status = fiber.StatusNotFound
		} else if err.Error() == "permission denied: only sender or moderator can delete" {
			status = fiber.StatusForbidden
		}
		return c.Status(status).JSON(fiber.Map{
			"error":   "Failed to delete message",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Message deleted successfully",
	})
}

// ============================================================================
// READ STATUS
// ============================================================================

// MarkAsRead godoc
// @Summary Mark room as read
// @Description Mark all messages in room as read
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param roomId path string true "Room ID" format(uuid)
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /accounts/{accountId}/chat/rooms/{roomId}/read [post]
// @Security BearerAuth
func (h *ChatHandler) MarkAsRead(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)
	roomIDStr := c.Params("roomId")

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	if err := h.chatService.MarkRoomAsRead(c.Context(), accountID, userID, roomID); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Failed to mark as read",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Marked as read",
	})
}

// ============================================================================
// MENTIONS
// ============================================================================

// ListMentions godoc
// @Summary List mentions
// @Description List mentions for current user
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param unread query bool false "Only unread mentions"
// @Success 200 {object} map[string]interface{}
// @Router /accounts/{accountId}/chat/mentions [get]
// @Security BearerAuth
func (h *ChatHandler) ListMentions(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	userID := c.Locals("user_id").(int)
	unreadOnly := c.QueryBool("unread", true)

	mentions, err := h.chatService.ListMentions(c.Context(), accountID, userID, unreadOnly)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to list mentions",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data":  mentions,
		"count": len(mentions),
	})
}

// MarkMentionRead godoc
// @Summary Mark mention as read
// @Description Mark a mention as read
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param mentionId path string true "Mention ID" format(uuid)
// @Success 200 {object} map[string]string
// @Router /accounts/{accountId}/chat/mentions/{mentionId}/read [post]
// @Security BearerAuth
func (h *ChatHandler) MarkMentionRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	mentionIDStr := c.Params("mentionId")
	mentionID, err := uuid.Parse(mentionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid mention ID",
		})
	}

	if err := h.chatService.MarkMentionRead(c.Context(), mentionID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to mark mention read",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Mention marked as read",
	})
}

// ============================================================================
// QUOTES
// ============================================================================

// CreateQuote godoc
// @Summary Create quote
// @Description Attach a Chatwoot conversation quote to a chat message
// @Tags Chat
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param body body services.QuoteRequest true "Quote request"
// @Success 201 {object} map[string]interface{}
// @Router /accounts/{accountId}/chat/quotes [post]
// @Security BearerAuth
func (h *ChatHandler) CreateQuote(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	var req struct {
		MessageID uuid.UUID            `json:"message_id"`
		Quote     services.QuoteRequest `json:"quote"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	if req.MessageID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "message_id is required",
		})
	}

	quote, err := h.chatService.CreateQuote(c.Context(), accountID, req.MessageID, req.Quote)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to create quote",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": quote,
	})
}
