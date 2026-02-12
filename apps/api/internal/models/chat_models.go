// Package models contains the database models for internal chat
package models

import (
	"time"

	"github.com/google/uuid"
)

// InternalChatRoom represents a chat room (DM or group)
type InternalChatRoom struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID int       `gorm:"index;not null" json:"account_id"`
	Type      string    `gorm:"size:20;not null;default:'room'" json:"type"` // "dm" or "room"
	Name      string    `gorm:"size:100" json:"name"`                        // Optional for DMs
	CreatedBy int       `gorm:"not null" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	LastMessage   string     `gorm:"-" json:"last_message,omitempty"`
	LastMessageAt *time.Time `gorm:"-" json:"last_message_at,omitempty"`
	UnreadCount   int64      `gorm:"-" json:"unread_count,omitempty"`

	// Relations
	Members  []InternalChatMember  `gorm:"foreignKey:RoomID" json:"members,omitempty"`
	Messages []InternalChatMessage `gorm:"foreignKey:RoomID" json:"messages,omitempty"`
}

// TableName specifies the table name
func (InternalChatRoom) TableName() string {
	return "internal_chat_rooms"
}

// InternalChatMember represents room membership
type InternalChatMember struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RoomID     uuid.UUID  `gorm:"type:uuid;index;not null" json:"room_id"`
	UserID     int        `gorm:"index;not null" json:"user_id"`
	Role       string     `gorm:"size:20;not null;default:'member'" json:"role"` // "owner", "moderator", "member"
	LastReadAt *time.Time `json:"last_read_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	// Relations
	Room *InternalChatRoom `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	User *User             `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

// TableName specifies the table name
func (InternalChatMember) TableName() string {
	return "internal_chat_members"
}

// InternalChatMessage represents a chat message
type InternalChatMessage struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RoomID      uuid.UUID  `gorm:"type:uuid;index;not null" json:"room_id"`
	AccountID   int        `gorm:"index;not null" json:"account_id"`
	SenderID    int        `gorm:"index;not null" json:"sender_id"`
	Content     string     `gorm:"type:text;not null" json:"content"`
	MessageType string     `gorm:"size:20;not null;default:'text'" json:"message_type"` // "text", "system", "mention"
	CreatedAt   time.Time  `gorm:"index" json:"created_at"`
	EditedAt    *time.Time `json:"edited_at,omitempty"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"` // Soft delete

	// Relations
	Room   *InternalChatRoom `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Sender *User             `gorm:"foreignKey:SenderID;references:ID" json:"sender,omitempty"`
	Quote  *InternalChatQuote `gorm:"-" json:"quote,omitempty"`
}

// TableName specifies the table name
func (InternalChatMessage) TableName() string {
	return "internal_chat_messages"
}

// InternalChatAudit tracks critical actions in chat
type InternalChatAudit struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID int       `gorm:"index;not null" json:"account_id"`
	ActorID   int       `gorm:"index;not null" json:"actor_id"`
	Action    string    `gorm:"size:50;not null" json:"action"` // "room_created", "member_added", "member_removed", "message_deleted"
	TargetID  string    `gorm:"size:50" json:"target_id"`       // Room ID or Message ID
	Metadata  JSON      `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

// TableName specifies the table name
func (InternalChatAudit) TableName() string {
	return "internal_chat_audit"
}

// InternalChatMention represents a mention in a message
type InternalChatMention struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID       int        `gorm:"index;not null" json:"account_id"`
	RoomID          uuid.UUID  `gorm:"type:uuid;index;not null" json:"room_id"`
	MessageID       uuid.UUID  `gorm:"type:uuid;index;not null" json:"message_id"`
	MentionedUserID int        `gorm:"index;not null" json:"mentioned_user_id"`
	CreatedAt       time.Time  `json:"created_at"`
	ReadAt          *time.Time `json:"read_at,omitempty"`
}

func (InternalChatMention) TableName() string {
	return "internal_chat_mentions"
}

// InternalChatQuote represents a linked customer conversation snapshot
type InternalChatQuote struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AccountID         int       `gorm:"index;not null" json:"account_id"`
	MessageID         uuid.UUID `gorm:"type:uuid;index;not null" json:"message_id"`
	ChatwootAccountID int       `gorm:"index" json:"chatwoot_account_id"`
	ConversationID    int       `gorm:"index" json:"conversation_id"`
	ChatwootMessageID int       `gorm:"index" json:"chatwoot_message_id"`
	Snapshot          JSON      `gorm:"type:jsonb;default:'{}'" json:"snapshot"`
	CreatedAt         time.Time `json:"created_at"`
}

func (InternalChatQuote) TableName() string {
	return "internal_chat_quotes"
}

// ChatRoomType constants
const (
	ChatRoomTypeDM   = "dm"
	ChatRoomTypeRoom = "room"
)

// ChatMemberRole constants
const (
	ChatMemberRoleOwner     = "owner"
	ChatMemberRoleModerator = "moderator"
	ChatMemberRoleMember    = "member"
)

// ChatMessageType constants
const (
	ChatMessageTypeText    = "text"
	ChatMessageTypeSystem  = "system"
	ChatMessageTypeMention = "mention"
)

// ChatAuditAction constants
const (
	ChatAuditActionRoomCreated    = "room_created"
	ChatAuditActionMemberAdded    = "member_added"
	ChatAuditActionMemberRemoved  = "member_removed"
	ChatAuditActionMessageDeleted = "message_deleted"
)
