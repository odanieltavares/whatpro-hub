package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

var (
	ErrBoardNotFound = errors.New("board not found")
	ErrStageNotFound = errors.New("stage not found")
	ErrCardNotFound  = errors.New("card not found")
)

// KanbanRepository handles kanban database operations
type KanbanRepository struct {
	db *gorm.DB
}

// NewKanbanRepository creates a new kanban repository
func NewKanbanRepository(db *gorm.DB) *KanbanRepository {
	return &KanbanRepository{db: db}
}

// =========================================================================
// BOARD OPERATIONS
// =========================================================================

// CreateBoard creates a new board
func (r *KanbanRepository) CreateBoard(ctx context.Context, board *models.Board) error {
	return r.db.WithContext(ctx).Create(board).Error
}

// GetBoard returns a board by ID with its stages
func (r *KanbanRepository) GetBoard(ctx context.Context, id uuid.UUID) (*models.Board, error) {
	var board models.Board
	if err := r.db.WithContext(ctx).Preload("Stages", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&board, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBoardNotFound
		}
		return nil, err
	}
	return &board, nil
}

// GetBoardForAccount returns a board by ID scoped to an account
func (r *KanbanRepository) GetBoardForAccount(ctx context.Context, id uuid.UUID, accountID int) (*models.Board, error) {
	var board models.Board
	if err := r.db.WithContext(ctx).Preload("Stages", func(db *gorm.DB) *gorm.DB {
		return db.Order("position ASC")
	}).First(&board, "id = ? AND account_id = ?", id, accountID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBoardNotFound
		}
		return nil, err
	}
	return &board, nil
}

// ListBoards returns all boards for an account
func (r *KanbanRepository) ListBoards(ctx context.Context, accountID int) ([]models.Board, error) {
	var boards []models.Board
	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).
		Order("created_at DESC").Find(&boards).Error; err != nil {
		return nil, err
	}
	return boards, nil
}

// UpdateBoard updates an existing board
func (r *KanbanRepository) UpdateBoard(ctx context.Context, board *models.Board) error {
	board.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(board).Error; err != nil {
		return err
	}
	return nil
}

// DeleteBoard deletes a board
func (r *KanbanRepository) DeleteBoard(ctx context.Context, id uuid.UUID) error {
	result := r.db.WithContext(ctx).Delete(&models.Board{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrBoardNotFound
	}
	return nil
}

// =========================================================================
// STAGE OPERATIONS
// =========================================================================

// CreateStage creates a new stage
func (r *KanbanRepository) CreateStage(ctx context.Context, stage *models.Stage) error {
	return r.db.WithContext(ctx).Create(stage).Error
}

// GetStage returns a stage by ID
func (r *KanbanRepository) GetStage(ctx context.Context, id uuid.UUID) (*models.Stage, error) {
	var stage models.Stage
	if err := r.db.WithContext(ctx).First(&stage, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStageNotFound
		}
		return nil, err
	}
	return &stage, nil
}

// GetStageForAccount returns a stage by ID scoped to an account
func (r *KanbanRepository) GetStageForAccount(ctx context.Context, id uuid.UUID, accountID int) (*models.Stage, error) {
	var stage models.Stage
	if err := r.db.WithContext(ctx).
		Table("stages").
		Joins("JOIN boards ON boards.id = stages.board_id").
		Where("stages.id = ? AND boards.account_id = ?", id, accountID).
		First(&stage).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStageNotFound
		}
		return nil, err
	}
	return &stage, nil
}

// UpdateStage updates an existing stage
func (r *KanbanRepository) UpdateStage(ctx context.Context, stage *models.Stage) error {
	stage.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(stage).Error; err != nil {
		return err
	}
	return nil
}

// DeleteStage deletes a stage
func (r *KanbanRepository) DeleteStage(ctx context.Context, id uuid.UUID) error {
	result := r.db.WithContext(ctx).Delete(&models.Stage{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStageNotFound
	}
	return nil
}

// UpdateStagePositions updates the positions of multiple stages in a transaction
func (r *KanbanRepository) UpdateStagePositions(ctx context.Context, updates map[uuid.UUID]int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for id, pos := range updates {
			if err := tx.Model(&models.Stage{}).Where("id = ?", id).
				Update("position", pos).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// =========================================================================
// CARD OPERATIONS
// =========================================================================

// CreateCard creates a new card
func (r *KanbanRepository) CreateCard(ctx context.Context, card *models.Card) error {
	return r.db.WithContext(ctx).Create(card).Error
}

// GetCard returns a card by ID
func (r *KanbanRepository) GetCard(ctx context.Context, id uuid.UUID) (*models.Card, error) {
	var card models.Card
	if err := r.db.WithContext(ctx).First(&card, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCardNotFound
		}
		return nil, err
	}
	return &card, nil
}

// GetCardForAccount returns a card by ID scoped to an account
func (r *KanbanRepository) GetCardForAccount(ctx context.Context, id uuid.UUID, accountID int) (*models.Card, error) {
	var card models.Card
	if err := r.db.WithContext(ctx).
		Table("cards").
		Joins("JOIN stages ON stages.id = cards.stage_id").
		Joins("JOIN boards ON boards.id = stages.board_id").
		Where("cards.id = ? AND boards.account_id = ?", id, accountID).
		First(&card).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCardNotFound
		}
		return nil, err
	}
	return &card, nil
}

// ListCardsByStage returns all cards in a stage
func (r *KanbanRepository) ListCardsByStage(ctx context.Context, stageID uuid.UUID) ([]models.Card, error) {
	var cards []models.Card
	if err := r.db.WithContext(ctx).Where("stage_id = ?", stageID).
		Order("position ASC").Find(&cards).Error; err != nil {
		return nil, err
	}
	return cards, nil
}

// UpdateCard updates an existing card
func (r *KanbanRepository) UpdateCard(ctx context.Context, card *models.Card) error {
	card.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(card).Error; err != nil {
		return err
	}
	return nil
}

// DeleteCard deletes a card
func (r *KanbanRepository) DeleteCard(ctx context.Context, id uuid.UUID) error {
	result := r.db.WithContext(ctx).Delete(&models.Card{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCardNotFound
	}
	return nil
}

// FindCardByConversationID finds a card linked to a Chatwoot conversation
func (r *KanbanRepository) FindCardByConversationID(ctx context.Context, conversationID int) (*models.Card, error) {
	var card models.Card
	if err := r.db.WithContext(ctx).Where("chatwoot_conversation_id = ?", conversationID).
		First(&card).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCardNotFound
		}
		return nil, err
	}
	return &card, nil
}

// LogCardHistory creates a history entry for a card
func (r *KanbanRepository) LogCardHistory(ctx context.Context, history *models.CardHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

// =========================================================================
// CHECKLIST & CONTEXT OPERATIONS
// =========================================================================

// GetCardWithDetails fetches a card with all relations (Company, Checklist)
func (r *KanbanRepository) GetCardWithDetails(ctx context.Context, id uuid.UUID) (*models.Card, error) {
	var card models.Card
	if err := r.db.WithContext(ctx).
		Preload("SelectedCompany").
		Preload("Checklist", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Where("id = ?", id).
		First(&card).Error; err != nil {
		return nil, err
	}
	return &card, nil
}

// GetCardWithDetailsForAccount fetches a card with relations scoped to an account
func (r *KanbanRepository) GetCardWithDetailsForAccount(ctx context.Context, id uuid.UUID, accountID int) (*models.Card, error) {
	var card models.Card
	if err := r.db.WithContext(ctx).
		Preload("SelectedCompany").
		Preload("Checklist", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Table("cards").
		Joins("JOIN stages ON stages.id = cards.stage_id").
		Joins("JOIN boards ON boards.id = stages.board_id").
		Where("cards.id = ? AND boards.account_id = ?", id, accountID).
		First(&card).Error; err != nil {
		return nil, err
	}
	return &card, nil
}

// UpdateChecklist updates a checklist item
func (r *KanbanRepository) UpdateChecklist(ctx context.Context, itemID uuid.UUID, updates map[string]interface{}) error {
	return r.db.WithContext(ctx).Model(&models.ChecklistItem{}).Where("id = ?", itemID).Updates(updates).Error
}

// AddChecklistItem adds a new item
func (r *KanbanRepository) AddChecklistItem(ctx context.Context, item *models.ChecklistItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

// ListCompanies return all companies for an account
func (r *KanbanRepository) ListCompanies(ctx context.Context, accountID int) ([]models.Company, error) {
	var companies []models.Company
	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}
