// Package repositories contains database access for chat module
package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

// ChatRepository handles chat database operations
type ChatRepository struct {
	db *gorm.DB
}

// NewChatRepository creates a new chat repository
func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// ============================================================================
// ROOMS
// ============================================================================

// GetRoomsByUserID returns all rooms where user is a member (tenant-scoped)
func (r *ChatRepository) GetRoomsByUserID(ctx context.Context, accountID, userID int) ([]models.InternalChatRoom, error) {
	var rooms []models.InternalChatRoom
	err := r.db.WithContext(ctx).
		Joins("JOIN internal_chat_members ON internal_chat_members.room_id = internal_chat_rooms.id").
		Where("internal_chat_rooms.account_id = ? AND internal_chat_members.user_id = ?", accountID, userID).
		Preload("Members").
		Preload("Members.User").
		Find(&rooms).Error
	return rooms, err
}

// GetRoomByID returns a room by ID (tenant-scoped)
func (r *ChatRepository) GetRoomByID(ctx context.Context, accountID int, roomID uuid.UUID) (*models.InternalChatRoom, error) {
	var room models.InternalChatRoom
	err := r.db.WithContext(ctx).
		Where("account_id = ? AND id = ?", accountID, roomID).
		Preload("Members").
		Preload("Members.User").
		First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// FindDMRoom finds existing DM between two users
func (r *ChatRepository) FindDMRoom(ctx context.Context, accountID, userID1, userID2 int) (*models.InternalChatRoom, error) {
	var room models.InternalChatRoom
	// Find DM rooms where both users are members
	subQuery := r.db.Table("internal_chat_members").
		Select("room_id").
		Where("user_id IN (?, ?)", userID1, userID2).
		Group("room_id").
		Having("COUNT(DISTINCT user_id) = 2")

	err := r.db.WithContext(ctx).
		Where("account_id = ? AND type = ? AND id IN (?)", accountID, models.ChatRoomTypeDM, subQuery).
		First(&room).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &room, err
}

// CreateRoom creates a new chat room with members
func (r *ChatRepository) CreateRoom(ctx context.Context, room *models.InternalChatRoom, memberIDs []int, creatorRole string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create room
		if err := tx.Create(room).Error; err != nil {
			return err
		}

		// Add creator as owner
		ownerMember := models.InternalChatMember{
			RoomID: room.ID,
			UserID: room.CreatedBy,
			Role:   creatorRole,
		}
		if err := tx.Create(&ownerMember).Error; err != nil {
			return err
		}

		// Add other members
		for _, memberID := range memberIDs {
			if memberID == room.CreatedBy {
				continue // Already added as owner
			}
			member := models.InternalChatMember{
				RoomID: room.ID,
				UserID: memberID,
				Role:   models.ChatMemberRoleMember,
			}
			if err := tx.Create(&member).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// ============================================================================
// MEMBERS
// ============================================================================

// IsMember checks if user is member of room
func (r *ChatRepository) IsMember(ctx context.Context, roomID uuid.UUID, userID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.InternalChatMember{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Count(&count).Error
	return count > 0, err
}

// GetMember returns member info
func (r *ChatRepository) GetMember(ctx context.Context, roomID uuid.UUID, userID int) (*models.InternalChatMember, error) {
	var member models.InternalChatMember
	err := r.db.WithContext(ctx).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		First(&member).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &member, err
}

// AddMember adds a user to a room
func (r *ChatRepository) AddMember(ctx context.Context, member *models.InternalChatMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

// RemoveMember removes a user from a room
func (r *ChatRepository) RemoveMember(ctx context.Context, roomID uuid.UUID, userID int) error {
	return r.db.WithContext(ctx).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Delete(&models.InternalChatMember{}).Error
}

// UpdateLastRead updates the last read timestamp
func (r *ChatRepository) UpdateLastRead(ctx context.Context, roomID uuid.UUID, userID int) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.InternalChatMember{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Update("last_read_at", now).Error
}

// ============================================================================
// MESSAGES
// ============================================================================

// GetMessages returns paginated messages for a room
func (r *ChatRepository) GetMessages(ctx context.Context, roomID uuid.UUID, limit int, cursor *time.Time) ([]models.InternalChatMessage, error) {
	var messages []models.InternalChatMessage
	query := r.db.WithContext(ctx).
		Where("room_id = ? AND deleted_at IS NULL", roomID).
		Preload("Sender").
		Order("created_at DESC").
		Limit(limit)

	if cursor != nil {
		query = query.Where("created_at < ?", cursor)
	}

	err := query.Find(&messages).Error
	return messages, err
}

// GetLastMessageByRoomID returns latest message for room
func (r *ChatRepository) GetLastMessageByRoomID(ctx context.Context, roomID uuid.UUID) (*models.InternalChatMessage, error) {
	var message models.InternalChatMessage
	err := r.db.WithContext(ctx).
		Where("room_id = ? AND deleted_at IS NULL", roomID).
		Order("created_at DESC").
		Limit(1).
		First(&message).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &message, err
}

// GetQuotesByMessageIDs returns quotes for a set of messages
func (r *ChatRepository) GetQuotesByMessageIDs(ctx context.Context, messageIDs []uuid.UUID) (map[uuid.UUID]models.InternalChatQuote, error) {
	if len(messageIDs) == 0 {
		return map[uuid.UUID]models.InternalChatQuote{}, nil
	}
	var quotes []models.InternalChatQuote
	err := r.db.WithContext(ctx).
		Where("message_id IN ?", messageIDs).
		Find(&quotes).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID]models.InternalChatQuote, len(quotes))
	for _, quote := range quotes {
		result[quote.MessageID] = quote
	}
	return result, nil
}

// CreateMessage creates a new message
func (r *ChatRepository) CreateMessage(ctx context.Context, message *models.InternalChatMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

// GetMessageByID returns a message by ID (tenant-scoped)
func (r *ChatRepository) GetMessageByID(ctx context.Context, accountID int, messageID uuid.UUID) (*models.InternalChatMessage, error) {
	var message models.InternalChatMessage
	err := r.db.WithContext(ctx).
		Where("account_id = ? AND id = ?", accountID, messageID).
		First(&message).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &message, err
}

// SoftDeleteMessage marks a message as deleted
func (r *ChatRepository) SoftDeleteMessage(ctx context.Context, messageID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.InternalChatMessage{}).
		Where("id = ?", messageID).
		Update("deleted_at", now).Error
}

// ============================================================================
// MENTIONS
// ============================================================================

// CreateMention inserts a mention record
func (r *ChatRepository) CreateMention(ctx context.Context, mention *models.InternalChatMention) error {
	return r.db.WithContext(ctx).Create(mention).Error
}

// ListMentionsByUser returns mentions for a user
func (r *ChatRepository) ListMentionsByUser(ctx context.Context, accountID, userID int, unreadOnly bool) ([]models.InternalChatMention, error) {
	var mentions []models.InternalChatMention
	query := r.db.WithContext(ctx).
		Where("account_id = ? AND mentioned_user_id = ?", accountID, userID).
		Order("created_at DESC")
	if unreadOnly {
		query = query.Where("read_at IS NULL")
	}
	err := query.Find(&mentions).Error
	return mentions, err
}

// MarkMentionRead marks a mention as read
func (r *ChatRepository) MarkMentionRead(ctx context.Context, mentionID uuid.UUID, userID int) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&models.InternalChatMention{}).
		Where("id = ? AND mentioned_user_id = ?", mentionID, userID).
		Update("read_at", now).Error
}

// ============================================================================
// QUOTES
// ============================================================================

// CreateQuote inserts a quote record
func (r *ChatRepository) CreateQuote(ctx context.Context, quote *models.InternalChatQuote) error {
	return r.db.WithContext(ctx).Create(quote).Error
}

// GetQuoteByMessageID returns quote by message
func (r *ChatRepository) GetQuoteByMessageID(ctx context.Context, messageID uuid.UUID) (*models.InternalChatQuote, error) {
	var quote models.InternalChatQuote
	err := r.db.WithContext(ctx).
		Where("message_id = ?", messageID).
		First(&quote).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &quote, err
}

// ============================================================================
// AUDIT
// ============================================================================

// CreateAuditLog creates an audit entry
func (r *ChatRepository) CreateAuditLog(ctx context.Context, audit *models.InternalChatAudit) error {
	return r.db.WithContext(ctx).Create(audit).Error
}

// GetAuditLogs returns audit logs for an account
func (r *ChatRepository) GetAuditLogs(ctx context.Context, accountID int, limit int, offset int) ([]models.InternalChatAudit, error) {
	var logs []models.InternalChatAudit
	err := r.db.WithContext(ctx).
		Where("account_id = ?", accountID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&logs).Error
	return logs, err
}

// ============================================================================
// UNREAD COUNT
// ============================================================================

// GetUnreadCount returns number of unread messages for user in room
func (r *ChatRepository) GetUnreadCount(ctx context.Context, roomID uuid.UUID, userID int, lastReadAt *time.Time) (int64, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&models.InternalChatMessage{}).
		Where("room_id = ? AND deleted_at IS NULL AND sender_id != ?", roomID, userID)

	if lastReadAt != nil {
		query = query.Where("created_at > ?", lastReadAt)
	}

	err := query.Count(&count).Error
	return count, err
}
