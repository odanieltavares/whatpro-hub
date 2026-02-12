package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// ListBoards handles listing boards
func (h *Handler) ListBoards(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	
	boards, err := h.KanbanService.ListBoards(c.Context(), accountID)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to list boards")
	}

	return h.Success(c, fiber.Map{"boards": boards})
}

// GetBoard handles getting a single board
func (h *Handler) GetBoard(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	board, err := h.KanbanService.GetBoard(c.Context(), accountID, id)
	if err != nil {
		if err == repositories.ErrBoardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Board not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to get board")
	}

	return h.Success(c, fiber.Map{"board": board})
}

// CreateBoard handles creating a board
func (h *Handler) CreateBoard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	var req struct {
		Name        string `json:"name" validate:"required"`
		Description string `json:"description"`
		Type        string `json:"type"`
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	board := &models.Board{
		AccountID:   accountID,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
	}

	if err := h.KanbanService.CreateBoard(c.Context(), board); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create board")
	}

	h.AuditCreate(c, "board", board.ID.String(), board)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"board":   board,
	})
}

// UpdateBoard handles updating a board
func (h *Handler) UpdateBoard(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateBoard(c.Context(), accountID, id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update board")
	}

	return h.Success(c, fiber.Map{"message": "Board updated successfully"})
}

// DeleteBoard handles deleting a board
func (h *Handler) DeleteBoard(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	if err := h.KanbanService.DeleteBoard(c.Context(), accountID, id); err != nil {
		if err == repositories.ErrBoardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Board not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete board")
	}

	return h.Success(c, fiber.Map{"message": "Board deleted successfully"})
}

// CreateStage handles creating a stage
func (h *Handler) CreateStage(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	var req struct {
		BoardID  string `json:"board_id" validate:"required"`
		Name     string `json:"name" validate:"required"`
		Color    string `json:"color"`
		Position int    `json:"position"`
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	boardID, err := uuid.Parse(req.BoardID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	stage := &models.Stage{
		BoardID:  boardID,
		Name:     req.Name,
		Color:    req.Color,
		Position: req.Position,
	}

	if err := h.KanbanService.CreateStage(c.Context(), accountID, stage); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create stage")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"stage":   stage,
	})
}

// UpdateStage handles updating a stage
func (h *Handler) UpdateStage(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateStage(c.Context(), accountID, id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update stage")
	}

	return h.Success(c, fiber.Map{"message": "Stage updated successfully"})
}

// DeleteStage handles deleting a stage
func (h *Handler) DeleteStage(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	if err := h.KanbanService.DeleteStage(c.Context(), accountID, id); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete stage")
	}

	return h.Success(c, fiber.Map{"message": "Stage deleted successfully"})
}

// ReorderStages handles reordering stages
func (h *Handler) ReorderStages(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	var req struct {
		BoardID  string   `json:"board_id" validate:"required"`
		StageIDs []string `json:"stage_ids" validate:"required"`
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	boardID, err := uuid.Parse(req.BoardID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	var stageIDs []uuid.UUID
	for _, idStr := range req.StageIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID: "+idStr)
		}
		stageIDs = append(stageIDs, id)
	}

	if err := h.KanbanService.ReorderStages(c.Context(), accountID, boardID, stageIDs); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to reorder stages")
	}

	return h.Success(c, fiber.Map{"message": "Stages reordered successfully"})
}

// CreateCard handles creating a card
func (h *Handler) CreateCard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	var req struct {
		StageID                string   `json:"stage_id" validate:"required"`
		Title                  string   `json:"title" validate:"required"`
		ChatwootConversationID int      `json:"chatwoot_conversation_id"`
		Priority               string   `json:"priority"`
		Value                  *float64 `json:"value"`
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	stageID, err := uuid.Parse(req.StageID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	card := &models.Card{
		StageID:                stageID,
		Title:                  req.Title,
		ChatwootConversationID: req.ChatwootConversationID,
		Priority:               req.Priority,
		Value:                  req.Value,
	}

	if err := h.KanbanService.CreateCard(c.Context(), accountID, card); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create card")
	}

	// Audit
	h.AuditCreate(c, "card", card.ID.String(), card)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"card":    card,
	})
}

// MoveCard handles moving a card
func (h *Handler) MoveCard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	var req struct {
		StageID  string `json:"stage_id" validate:"required"`
		Position int    `json:"position"`
	}
	
	if err := h.Validate(c, &req); err != nil {
		return err
	}

	stageID, err := uuid.Parse(req.StageID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	userID := c.Locals("user_id").(int)
	
	if err := h.KanbanService.MoveCard(c.Context(), accountID, id, stageID, req.Position, &userID); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to move card")
	}

	return h.Success(c, fiber.Map{"message": "Card moved successfully"})
}

// UpdateCard handles updating a card
func (h *Handler) UpdateCard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateCard(c.Context(), accountID, id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update card")
	}

	return h.Success(c, fiber.Map{"message": "Card updated successfully"})
}

// DeleteCard handles deleting a card
func (h *Handler) DeleteCard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	if err := h.KanbanService.DeleteCard(c.Context(), accountID, id); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete card")
	}

	return h.Success(c, fiber.Map{"message": "Card deleted successfully"})
}

func (h *Handler) GetCard(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	card, err := h.KanbanService.GetCard(c.Context(), accountID, id)
	if err != nil {
		if err == repositories.ErrCardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Card not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to get card")
	}

	return h.Success(c, fiber.Map{"card": card})
}

// ListStages handles listing stages for a board
func (h *Handler) ListStages(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}
	board, err := h.KanbanService.GetBoard(c.Context(), accountID, boardID)
	if err != nil {
		if err == repositories.ErrBoardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Board not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to get board")
	}
	return h.Success(c, fiber.Map{"stages": board.Stages})
}

// ListCards handles listing cards for a board
func (h *Handler) ListCards(c *fiber.Ctx) error {
	accountID := c.Locals("account_id").(int)
	boardID, err := uuid.Parse(c.Params("boardId"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}
	board, err := h.KanbanService.GetBoard(c.Context(), accountID, boardID)
	if err != nil {
		if err == repositories.ErrBoardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Board not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to get board")
	}
	var allCards []models.Card
	for _, stage := range board.Stages {
		cards, _ := h.KanbanService.ListCardsByStage(c.Context(), accountID, stage.ID)
		allCards = append(allCards, cards...)
	}
	return h.Success(c, fiber.Map{"cards": allCards})
}
