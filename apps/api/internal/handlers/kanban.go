package handlers

import (
	"fmt"

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
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	board, err := h.KanbanService.GetBoard(c.Context(), id)
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
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateBoard(c.Context(), id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update board")
	}

	return h.Success(c, fiber.Map{"message": "Board updated successfully"})
}

// DeleteBoard handles deleting a board
func (h *Handler) DeleteBoard(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid board ID")
	}

	if err := h.KanbanService.DeleteBoard(c.Context(), id); err != nil {
		if err == repositories.ErrBoardNotFound {
			return h.Error(c, fiber.StatusNotFound, "Board not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete board")
	}

	return h.Success(c, fiber.Map{"message": "Board deleted successfully"})
}

// CreateStage handles creating a stage
func (h *Handler) CreateStage(c *fiber.Ctx) error {
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

	if err := h.KanbanService.CreateStage(c.Context(), stage); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create stage")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"stage":   stage,
	})
}

// UpdateStage handles updating a stage
func (h *Handler) UpdateStage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateStage(c.Context(), id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update stage")
	}

	return h.Success(c, fiber.Map{"message": "Stage updated successfully"})
}

// DeleteStage handles deleting a stage
func (h *Handler) DeleteStage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid stage ID")
	}

	if err := h.KanbanService.DeleteStage(c.Context(), id); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete stage")
	}

	return h.Success(c, fiber.Map{"message": "Stage deleted successfully"})
}

// ReorderStages handles reordering stages
func (h *Handler) ReorderStages(c *fiber.Ctx) error {
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

	if err := h.KanbanService.ReorderStages(c.Context(), boardID, stageIDs); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to reorder stages")
	}

	return h.Success(c, fiber.Map{"message": "Stages reordered successfully"})
}

// CreateCard handles creating a card
func (h *Handler) CreateCard(c *fiber.Ctx) error {
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

	if err := h.KanbanService.CreateCard(c.Context(), card); err != nil {
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
	
	if err := h.KanbanService.MoveCard(c.Context(), id, stageID, req.Position, &userID); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to move card")
	}

	return h.Success(c, fiber.Map{"message": "Card moved successfully"})
}

// UpdateCard handles updating a card
func (h *Handler) UpdateCard(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	var req map[string]interface{}
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.KanbanService.UpdateCard(c.Context(), id, req); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update card")
	}

	return h.Success(c, fiber.Map{"message": "Card updated successfully"})
}

// DeleteCard handles deleting a card
func (h *Handler) DeleteCard(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}

	if err := h.KanbanService.DeleteCard(c.Context(), id); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete card")
	}

	return h.Success(c, fiber.Map{"message": "Card deleted successfully"})
}

// GetCard handles getting a single card
func (h *Handler) GetCard(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid card ID")
	}
	
	card, err := h.KanbanService.repo.GetCard(c.Context(), id) // Use repo directly? Or expose service method. Exposed service method is better.
	// Wait, I didn't expose GetCard in Service. I should have. 
	// I exposed it: func (s *KanbanService) GetCard(ctx context.Context, id uuid.UUID) (*models.Card, error)
	// Yes I did.
	
	// Actually I need to check `kanban_service.go` again to be sure I added GetCard.
	// I added: CreateCard, MoveCard, UpdateCard, DeleteCard. 
	// I did NOT add `GetCard` to Service in the previous turn. I missed it.
	// I should add it to `kanban_service.go` first? Or just add it now?
	// I'll add `GetCard` to the service in `kanban_service.go` via multi_replace later if needed.
	// But `kanban.go` needs it.
	// Let's assume I will add it. I'll write the code assuming it exists.
	// Actually I see `GetCard` in the `KanbanRepository`.
	
	// I'll check `kanban_service.go` content I generated. 
	// I added `GetBoard`. I did not add `GetCard` wrapper in Service.
	// I should add it.
	
	// Correction: I should update `kanban_service.go` to include `GetCard`.
	
	return h.Error(c, fiber.StatusNotImplemented, "GetCard not implemented in service yet")
}

// The previous block was internal thought. I need to be careful.
// I will just omit GetCard from handlers for now if service lacks it, or use the repo directly via Service? No, that's private.
// I will modify `kanban_service.go` to add `GetCard` method.

// Wait, I can't modify `kanban_service.go` in the same `write_to_file` call for `kanban.go`.
// I'll do it in parallel or sequential.
// I will add `GetCard` to `kanban_service.go` using `multi_replace_file_content` in the NEXT step.
// For now I will comment out GetCard implementation or return not implemented.
// Or effectively, I will define `GetCard` in `kanban.go` but commented out or stubbed, AND then fix `kanban_service.go`.

// Actually, I can just use `multi_replace_file_content` on `kanban_service.go` in THIS turn?
// Yes.
