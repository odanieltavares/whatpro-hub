// Package migrations handles database migrations for chat module
package migrations

import (
	"log"

	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

// MigrateChat runs chat-related migrations
func MigrateChat(db *gorm.DB) error {
	log.Println("Running internal chat migrations...")

	// Auto-migrate chat models
	err := db.AutoMigrate(
		&models.InternalChatRoom{},
		&models.InternalChatMember{},
		&models.InternalChatMessage{},
		&models.InternalChatAudit{},
		&models.InternalChatMention{},
		&models.InternalChatQuote{},
	)
	if err != nil {
		return err
	}

	// Create additional indexes
	indexes := []string{
		// Rooms: account + type for filtering
		"CREATE INDEX IF NOT EXISTS idx_chat_rooms_account_type ON internal_chat_rooms(account_id, type)",
		// Members: unique constraint per room/user
		"CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_members_room_user ON internal_chat_members(room_id, user_id)",
		// Members: find rooms for user
		"CREATE INDEX IF NOT EXISTS idx_chat_members_user_read ON internal_chat_members(user_id, last_read_at)",
		// Messages: pagination by room
		"CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON internal_chat_messages(room_id, created_at DESC)",
		// Messages: tenant + time for admin queries
		"CREATE INDEX IF NOT EXISTS idx_chat_messages_account_created ON internal_chat_messages(account_id, created_at DESC)",
		// Audit: tenant + time for audit log
		"CREATE INDEX IF NOT EXISTS idx_chat_audit_account_created ON internal_chat_audit(account_id, created_at DESC)",
		// Audit: actor for investigations
		"CREATE INDEX IF NOT EXISTS idx_chat_audit_actor ON internal_chat_audit(actor_id)",
		// Mentions: user + unread
		"CREATE INDEX IF NOT EXISTS idx_chat_mentions_user_unread ON internal_chat_mentions(mentioned_user_id, read_at)",
		// Mentions: by message
		"CREATE INDEX IF NOT EXISTS idx_chat_mentions_message ON internal_chat_mentions(message_id)",
		// Quotes: by message
		"CREATE INDEX IF NOT EXISTS idx_chat_quotes_message ON internal_chat_quotes(message_id)",
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			log.Printf("Warning: index creation failed: %v", err)
		}
	}

	log.Println("Internal chat migrations completed")
	return nil
}
