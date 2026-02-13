// Package services contains business logic for chat module
package services

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
	"whatpro-hub/pkg/chatwoot"
)

// ChatService handles chat business logic
type ChatService struct {
	chatRepo   *repositories.ChatRepository
	auditRepo  *repositories.AuditRepository
	userRepo   repositories.UserRepository
	chatwootClient *chatwoot.Client
}

// NewChatService creates a new chat service
func NewChatService(chatRepo *repositories.ChatRepository, auditRepo *repositories.AuditRepository, userRepo repositories.UserRepository, chatwootClient *chatwoot.Client) *ChatService {
	return &ChatService{
		chatRepo:  chatRepo,
		auditRepo: auditRepo,
		userRepo: userRepo,
		chatwootClient: chatwootClient,
	}
}

// ============================================================================
// ROOMS
// ============================================================================

// CreateRoomRequest represents room creation request
type CreateRoomRequest struct {
	Type      string `json:"type" validate:"required,oneof=dm room"`
	Name      string `json:"name" validate:"required_if=Type room,max=100"`
	MemberIDs []int  `json:"member_ids" validate:"required,min=1"`
}

// GetMyRooms returns all rooms for the current user
func (s *ChatService) GetMyRooms(ctx context.Context, accountID, userID int) ([]models.InternalChatRoom, error) {
	rooms, err := s.chatRepo.GetRoomsByUserID(ctx, accountID, userID)
	if err != nil {
		return nil, err
	}

	for i := range rooms {
		lastMessage, err := s.chatRepo.GetLastMessageByRoomID(ctx, rooms[i].ID)
		if err == nil && lastMessage != nil {
			rooms[i].LastMessage = lastMessage.Content
			rooms[i].LastMessageAt = &lastMessage.CreatedAt
		}

		member, err := s.chatRepo.GetMember(ctx, rooms[i].ID, userID)
		if err == nil {
			unread, err := s.chatRepo.GetUnreadCount(ctx, rooms[i].ID, userID, member.LastReadAt)
			if err == nil {
				rooms[i].UnreadCount = unread
			}
		}
	}

	return rooms, nil
}

// GetRoom returns a room by ID with access check
func (s *ChatService) GetRoom(ctx context.Context, accountID, userID int, roomID uuid.UUID) (*models.InternalChatRoom, error) {
	room, err := s.chatRepo.GetRoomByID(ctx, accountID, roomID)
	if err != nil {
		return nil, err
	}
	if room == nil {
		return nil, errors.New("room not found")
	}

	// Check membership
	isMember, err := s.chatRepo.IsMember(ctx, roomID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("access denied: not a member")
	}

	return room, nil
}

// CreateRoom creates a new room
func (s *ChatService) CreateRoom(ctx context.Context, accountID, userID int, req CreateRoomRequest) (*models.InternalChatRoom, error) {
	// For DM, check if room already exists
	if req.Type == models.ChatRoomTypeDM {
		if len(req.MemberIDs) != 1 {
			return nil, errors.New("DM must have exactly one other member")
		}
		otherUserID := req.MemberIDs[0]
		existingRoom, err := s.chatRepo.FindDMRoom(ctx, accountID, userID, otherUserID)
		if err != nil {
			return nil, err
		}
		if existingRoom != nil {
			// Return existing DM room
			return s.chatRepo.GetRoomByID(ctx, accountID, existingRoom.ID)
		}
	}

	// Create new room
	room := &models.InternalChatRoom{
		AccountID: accountID,
		Type:      req.Type,
		Name:      req.Name,
		CreatedBy: userID,
	}

	// Determine creator role
	creatorRole := models.ChatMemberRoleOwner
	if req.Type == models.ChatRoomTypeDM {
		creatorRole = models.ChatMemberRoleMember // Both are equal in DM
	}

	// Create room with members
	if err := s.chatRepo.CreateRoom(ctx, room, req.MemberIDs, creatorRole); err != nil {
		return nil, err
	}

	// Audit log
	s.logAudit(ctx, accountID, userID, models.ChatAuditActionRoomCreated, room.ID.String(), models.JSON{
		"type": req.Type,
		"name": req.Name,
	})

	return s.chatRepo.GetRoomByID(ctx, accountID, room.ID)
}

// ============================================================================
// MEMBERS
// ============================================================================

// AddMember adds a user to a room (requires owner/moderator)
func (s *ChatService) AddMember(ctx context.Context, accountID, actorID int, roomID uuid.UUID, targetUserID int) error {
	// Check room exists and actor is member
	room, err := s.chatRepo.GetRoomByID(ctx, accountID, roomID)
	if err != nil || room == nil {
		return errors.New("room not found")
	}

	// Can't add to DM
	if room.Type == models.ChatRoomTypeDM {
		return errors.New("cannot add members to DM")
	}

	// Check actor has permission
	if err := s.requireModeratorRole(ctx, roomID, actorID); err != nil {
		return err
	}

	// Check target not already member
	isMember, _ := s.chatRepo.IsMember(ctx, roomID, targetUserID)
	if isMember {
		return errors.New("user already a member")
	}

	// Add member
	member := &models.InternalChatMember{
		RoomID: roomID,
		UserID: targetUserID,
		Role:   models.ChatMemberRoleMember,
	}
	if err := s.chatRepo.AddMember(ctx, member); err != nil {
		return err
	}

	// Audit log
	s.logAudit(ctx, accountID, actorID, models.ChatAuditActionMemberAdded, roomID.String(), models.JSON{
		"target_user_id": targetUserID,
	})

	return nil
}

// RemoveMember removes a user from a room
func (s *ChatService) RemoveMember(ctx context.Context, accountID, actorID int, roomID uuid.UUID, targetUserID int) error {
	// Check room exists
	room, err := s.chatRepo.GetRoomByID(ctx, accountID, roomID)
	if err != nil || room == nil {
		return errors.New("room not found")
	}

	// Can't remove from DM
	if room.Type == models.ChatRoomTypeDM {
		return errors.New("cannot remove members from DM")
	}

	// Self-removal is always allowed, otherwise need moderator role
	if actorID != targetUserID {
		if err := s.requireModeratorRole(ctx, roomID, actorID); err != nil {
			return err
		}
	}

	// Check target is a member
	isMember, _ := s.chatRepo.IsMember(ctx, roomID, targetUserID)
	if !isMember {
		return errors.New("user is not a member")
	}

	// Remove member
	if err := s.chatRepo.RemoveMember(ctx, roomID, targetUserID); err != nil {
		return err
	}

	// Audit log
	s.logAudit(ctx, accountID, actorID, models.ChatAuditActionMemberRemoved, roomID.String(), models.JSON{
		"target_user_id": targetUserID,
	})

	return nil
}

// ============================================================================
// MESSAGES
// ============================================================================

// SendMessageRequest represents message send request
type SendMessageRequest struct {
	Content     string `json:"content" validate:"required,max=4000"`
	MessageType string `json:"message_type" validate:"omitempty,oneof=text system mention"`
	Quote       *QuoteRequest `json:"quote,omitempty"`
}

// QuoteRequest represents a customer conversation quote
type QuoteRequest struct {
	ChatwootAccountID int `json:"chatwoot_account_id"`
	ConversationID    int `json:"conversation_id" validate:"required"`
	ChatwootMessageID int `json:"chatwoot_message_id" validate:"required"`
}

// GetMessages returns paginated messages
func (s *ChatService) GetMessages(ctx context.Context, accountID, userID int, roomID uuid.UUID, limit int, cursor *time.Time) ([]models.InternalChatMessage, error) {
	// Check membership
	isMember, err := s.chatRepo.IsMember(ctx, roomID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("access denied: not a member")
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	messages, err := s.chatRepo.GetMessages(ctx, roomID, limit, cursor)
	if err != nil {
		return nil, err
	}

	ids := make([]uuid.UUID, 0, len(messages))
	for _, msg := range messages {
		ids = append(ids, msg.ID)
	}
	quotes, err := s.chatRepo.GetQuotesByMessageIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range messages {
		if quote, ok := quotes[messages[i].ID]; ok {
			messages[i].Quote = &quote
		}
	}

	return messages, nil
}

// SendMessage creates a new message
func (s *ChatService) SendMessage(ctx context.Context, accountID, userID int, roomID uuid.UUID, req SendMessageRequest) (*models.InternalChatMessage, error) {
	// Check membership
	isMember, err := s.chatRepo.IsMember(ctx, roomID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("access denied: not a member")
	}

	msgType := req.MessageType
	if msgType == "" {
		msgType = models.ChatMessageTypeText
	}

	message := &models.InternalChatMessage{
		RoomID:      roomID,
		AccountID:   accountID,
		SenderID:    userID,
		Content:     req.Content,
		MessageType: msgType,
	}

	if err := s.chatRepo.CreateMessage(ctx, message); err != nil {
		return nil, err
	}

	if err := s.handleMentions(ctx, accountID, roomID, message, userID); err != nil {
		return nil, err
	}

	if req.Quote != nil {
		quote, err := s.createQuoteFromChatwoot(ctx, accountID, message.ID, req.Quote)
		if err != nil {
			return nil, err
		}
		message.Quote = quote
	}

	return message, nil
}

// ListMentions returns mentions for a user
func (s *ChatService) ListMentions(ctx context.Context, accountID, userID int, unreadOnly bool) ([]models.InternalChatMention, error) {
	return s.chatRepo.ListMentionsByUser(ctx, accountID, userID, unreadOnly)
}

// MarkMentionRead marks a mention as read
func (s *ChatService) MarkMentionRead(ctx context.Context, mentionID uuid.UUID, userID int) error {
	return s.chatRepo.MarkMentionRead(ctx, mentionID, userID)
}

// CreateQuote creates a quote record manually
func (s *ChatService) CreateQuote(ctx context.Context, accountID int, messageID uuid.UUID, req QuoteRequest) (*models.InternalChatQuote, error) {
	return s.createQuoteFromChatwoot(ctx, accountID, messageID, &req)
}

// DeleteMessage soft-deletes a message (owner or moderator only)
func (s *ChatService) DeleteMessage(ctx context.Context, accountID, actorID int, messageID uuid.UUID) error {
	message, err := s.chatRepo.GetMessageByID(ctx, accountID, messageID)
	if err != nil {
		return err
	}
	if message == nil {
		return errors.New("message not found")
	}

	// Owner can delete, or moderator of room
	if message.SenderID != actorID {
		if err := s.requireModeratorRole(ctx, message.RoomID, actorID); err != nil {
			return errors.New("permission denied: only sender or moderator can delete")
		}
	}

	if err := s.chatRepo.SoftDeleteMessage(ctx, messageID); err != nil {
		return err
	}

	// Audit log
	s.logAudit(ctx, accountID, actorID, models.ChatAuditActionMessageDeleted, messageID.String(), models.JSON{
		"room_id": message.RoomID.String(),
	})

	return nil
}

// =============================================================================
// MENTIONS + QUOTES HELPERS
// =============================================================================

var mentionRegex = regexp.MustCompile(`@[\w.\-]+`)

func (s *ChatService) handleMentions(ctx context.Context, accountID int, roomID uuid.UUID, message *models.InternalChatMessage, senderID int) error {
	if s.userRepo == nil {
		return nil
	}
	tokens := mentionRegex.FindAllString(message.Content, -1)
	if len(tokens) == 0 {
		return nil
	}

	users, err := s.userRepo.FindAll(ctx, map[string]interface{}{"account_id": accountID})
	if err != nil {
		return err
	}

	tokenMap := map[string]int{}
	for _, user := range users {
		name := strings.ToLower(strings.ReplaceAll(user.Name, " ", ""))
		email := strings.ToLower(user.Email)
		emailPrefix := strings.Split(email, "@")[0]
		if name != "" {
			tokenMap[name] = int(user.ID)
		}
		if emailPrefix != "" {
			tokenMap[emailPrefix] = int(user.ID)
		}
	}

	seen := map[int]bool{}
	for _, raw := range tokens {
		token := strings.ToLower(strings.TrimPrefix(raw, "@"))
		token = strings.ReplaceAll(token, " ", "")
		if userID, ok := tokenMap[token]; ok && userID != senderID {
			if seen[userID] {
				continue
			}
			seen[userID] = true
			mention := &models.InternalChatMention{
				AccountID:       accountID,
				RoomID:          roomID,
				MessageID:       message.ID,
				MentionedUserID: userID,
			}
			if err := s.chatRepo.CreateMention(ctx, mention); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *ChatService) createQuoteFromChatwoot(ctx context.Context, accountID int, messageID uuid.UUID, req *QuoteRequest) (*models.InternalChatQuote, error) {
	if s.chatwootClient == nil || req == nil {
		return nil, errors.New("chatwoot client not configured")
	}

	conversation, err := s.chatwootClient.GetConversation(req.ChatwootAccountID, req.ConversationID)
	if err != nil {
		return nil, err
	}
	messagesPayload, err := s.chatwootClient.GetConversationMessages(req.ChatwootAccountID, req.ConversationID)
	if err != nil {
		return nil, err
	}

	snapshot := models.JSON{
		"conversation": conversation,
		"messages":     messagesPayload,
		"target_message_id": req.ChatwootMessageID,
	}

	quote := &models.InternalChatQuote{
		AccountID:         accountID,
		MessageID:         messageID,
		ChatwootAccountID: req.ChatwootAccountID,
		ConversationID:    req.ConversationID,
		ChatwootMessageID: req.ChatwootMessageID,
		Snapshot:          snapshot,
	}

	if err := s.chatRepo.CreateQuote(ctx, quote); err != nil {
		return nil, err
	}

	return quote, nil
}

// ============================================================================
// READ STATUS
// ============================================================================

// MarkRoomAsRead marks all messages in room as read for user
func (s *ChatService) MarkRoomAsRead(ctx context.Context, accountID, userID int, roomID uuid.UUID) error {
	// Check membership
	isMember, err := s.chatRepo.IsMember(ctx, roomID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("access denied: not a member")
	}

	return s.chatRepo.UpdateLastRead(ctx, roomID, userID)
}

// ============================================================================
// HELPERS
// ============================================================================

func (s *ChatService) requireModeratorRole(ctx context.Context, roomID uuid.UUID, userID int) error {
	member, err := s.chatRepo.GetMember(ctx, roomID, userID)
	if err != nil || member == nil {
		return errors.New("not a member")
	}
	if member.Role != models.ChatMemberRoleOwner && member.Role != models.ChatMemberRoleModerator {
		return errors.New("permission denied: requires owner or moderator role")
	}
	return nil
}

func (s *ChatService) logAudit(ctx context.Context, accountID, actorID int, action, targetID string, metadata models.JSON) {
	audit := &models.InternalChatAudit{
		AccountID: accountID,
		ActorID:   actorID,
		Action:    action,
		TargetID:  targetID,
		Metadata:  metadata,
	}
	_ = s.chatRepo.CreateAuditLog(ctx, audit) // Fire and forget
}
