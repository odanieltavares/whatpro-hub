package services

import (
	"context"
	"time"

	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// KanbanService handles kanban business logic
type KanbanService struct {
	repo *repositories.KanbanRepository
}

// NewKanbanService creates a new kanban service
func NewKanbanService(repo *repositories.KanbanRepository) *KanbanService {
	return &KanbanService{repo: repo}
}

// =========================================================================
// BOARD SERVICES
// =========================================================================

// CreateBoard creates a new board
func (s *KanbanService) CreateBoard(ctx context.Context, board *models.Board) error {
	if board.Settings == nil {
		board.Settings = models.JSON{}
	}
	return s.repo.CreateBoard(ctx, board)
}

// GetBoard returns a board by ID scoped to an account
func (s *KanbanService) GetBoard(ctx context.Context, accountID int, id uuid.UUID) (*models.Board, error) {
	return s.repo.GetBoardForAccount(ctx, id, accountID)
}

// ListBoards returns all boards for an account
func (s *KanbanService) ListBoards(ctx context.Context, accountID int) ([]models.Board, error) {
	return s.repo.ListBoards(ctx, accountID)
}

// UpdateBoard updates an existing board
func (s *KanbanService) UpdateBoard(ctx context.Context, accountID int, id uuid.UUID, updates map[string]interface{}) error {
	board, err := s.repo.GetBoardForAccount(ctx, id, accountID)
	if err != nil {
		return err
	}

	if name, ok := updates["name"].(string); ok {
		board.Name = name
	}
	if description, ok := updates["description"].(string); ok {
		board.Description = description
	}
	if isDefault, ok := updates["is_default"].(bool); ok {
		board.IsDefault = isDefault
	}
	if settings, ok := updates["settings"].(models.JSON); ok {
		board.Settings = settings
	}

	return s.repo.UpdateBoard(ctx, board)
}

// DeleteBoard deletes a board
func (s *KanbanService) DeleteBoard(ctx context.Context, accountID int, id uuid.UUID) error {
	if _, err := s.repo.GetBoardForAccount(ctx, id, accountID); err != nil {
		return err
	}
	return s.repo.DeleteBoard(ctx, id)
}

// =========================================================================
// STAGE SERVICES
// =========================================================================

// CreateStage creates a new stage
func (s *KanbanService) CreateStage(ctx context.Context, accountID int, stage *models.Stage) error {
	if _, err := s.repo.GetBoardForAccount(ctx, stage.BoardID, accountID); err != nil {
		return err
	}
	// TODO: Calculate position (append to end) if not provided
	if stage.AutoActions == nil {
		stage.AutoActions = models.JSON{} // Empty list default
	}
	return s.repo.CreateStage(ctx, stage)
}

// UpdateStage updates an existing stage
func (s *KanbanService) UpdateStage(ctx context.Context, accountID int, id uuid.UUID, updates map[string]interface{}) error {
	stage, err := s.repo.GetStageForAccount(ctx, id, accountID)
	if err != nil {
		return err
	}

	if name, ok := updates["name"].(string); ok {
		stage.Name = name
	}
	if color, ok := updates["color"].(string); ok {
		stage.Color = color
	}
	if sla, ok := updates["sla_hours"].(float64); ok { // JSON numbers are float64
		slaInt := int(sla)
		stage.SLAHours = &slaInt
	}

	return s.repo.UpdateStage(ctx, stage)
}

// ReorderStages updates the positions of a list of stages
func (s *KanbanService) ReorderStages(ctx context.Context, accountID int, boardID uuid.UUID, stageIDs []uuid.UUID) error {
	if _, err := s.repo.GetBoardForAccount(ctx, boardID, accountID); err != nil {
		return err
	}
	updates := make(map[uuid.UUID]int)
	for i, id := range stageIDs {
		updates[id] = i
	}
	return s.repo.UpdateStagePositions(ctx, updates)
}

// DeleteStage deletes a stage
func (s *KanbanService) DeleteStage(ctx context.Context, accountID int, id uuid.UUID) error {
	if _, err := s.repo.GetStageForAccount(ctx, id, accountID); err != nil {
		return err
	}
	return s.repo.DeleteStage(ctx, id)
}

// =========================================================================
// CARD SERVICES
// =========================================================================

// CreateCard creates a new card
func (s *KanbanService) CreateCard(ctx context.Context, accountID int, card *models.Card) error {
	if _, err := s.repo.GetStageForAccount(ctx, card.StageID, accountID); err != nil {
		return err
	}
	// Set defaults
	if card.Priority == "" {
		card.Priority = "medium"
	}
	return s.repo.CreateCard(ctx, card)
}

// GetCard returns a card by ID
func (s *KanbanService) GetCard(ctx context.Context, accountID int, id uuid.UUID) (*models.Card, error) {
	return s.repo.GetCardForAccount(ctx, id, accountID)
}

// MoveCard moves a card to a new stage or position
func (s *KanbanService) MoveCard(ctx context.Context, accountID int, cardID uuid.UUID, targetStageID uuid.UUID, position int, userID *int) error {
	card, err := s.repo.GetCardForAccount(ctx, cardID, accountID)
	if err != nil {
		return err
	}
	if _, err := s.repo.GetStageForAccount(ctx, targetStageID, accountID); err != nil {
		return err
	}

	originalStageID := card.StageID
	
	// Update card
	card.StageID = targetStageID
	card.Position = position

	if err := s.repo.UpdateCard(ctx, card); err != nil {
		return err
	}

	// Log history
	history := &models.CardHistory{
		CardID:      card.ID,
		UserID:      userID,
		Action:      "moved",
		FromStageID: &originalStageID,
		ToStageID:   &targetStageID,
		CreatedAt:   time.Now(),
	}
	
	return s.repo.LogCardHistory(ctx, history)
}

// UpdateCard updates a card details
func (s *KanbanService) UpdateCard(ctx context.Context, accountID int, id uuid.UUID, updates map[string]interface{}) error {
	card, err := s.repo.GetCardForAccount(ctx, id, accountID)
	if err != nil {
		return err
	}

	if title, ok := updates["title"].(string); ok {
		card.Title = title
	}
	if priority, ok := updates["priority"].(string); ok {
		card.Priority = priority
	}
	if value, ok := updates["value"].(float64); ok {
		card.Value = &value
	}
	if dueDateStr, ok := updates["due_date"].(string); ok {
		dueDate, err := time.Parse(time.RFC3339, dueDateStr)
		if err == nil {
			card.DueDate = &dueDate
		}
	}

	return s.repo.UpdateCard(ctx, card)
}

// DeleteCard deletes a card
func (s *KanbanService) DeleteCard(ctx context.Context, accountID int, id uuid.UUID) error {
	if _, err := s.repo.GetCardForAccount(ctx, id, accountID); err != nil {
		return err
	}
	return s.repo.DeleteCard(ctx, id)
}

// =========================================================================
// CHECKLIST & CONTEXT SERVICES
// =========================================================================

// GetCardDetails returns card with checklist and company
func (s *KanbanService) GetCardDetails(ctx context.Context, accountID int, id uuid.UUID) (*models.Card, error) {
	return s.repo.GetCardWithDetailsForAccount(ctx, id, accountID)
}

// ToggleChecklistItem toggles the completion status of an item
func (s *KanbanService) ToggleChecklistItem(ctx context.Context, itemID uuid.UUID, completed bool) error {
	return s.repo.UpdateChecklist(ctx, itemID, map[string]interface{}{
		"is_completed": completed,
	})
}

// SetCardContext sets the B2B company context for a card
func (s *KanbanService) SetCardContext(ctx context.Context, accountID int, cardID uuid.UUID, companyID uuid.UUID) error {
	// Fetch first to ensure we don't overwrite other fields (Repo uses Save)
	card, err := s.repo.GetCardForAccount(ctx, cardID, accountID)
	if err != nil {
		return err
	}
	card.SelectedCompanyID = &companyID
	return s.repo.UpdateCard(ctx, card)
}

// ListCardsByStage returns all cards for a stage
func (s *KanbanService) ListCardsByStage(ctx context.Context, accountID int, stageID uuid.UUID) ([]models.Card, error) {
	// Verify stage belongs to account
	if _, err := s.repo.GetStageForAccount(ctx, stageID, accountID); err != nil {
		return nil, err
	}
	return s.repo.ListCardsByStage(ctx, stageID)
}
