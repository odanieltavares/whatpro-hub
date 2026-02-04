// Package webhooks provides webhook processing utilities
package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrInvalidSignature = errors.New("invalid webhook signature")
	ErrInvalidPayload   = errors.New("invalid webhook payload")
)

// ChatwootWebhook represents a webhook event from Chatwoot
type ChatwootWebhook struct {
	Event     string                 `json:"event"`
	ID        int                    `json:"id"`
	AccountID int                    `json:"account_id"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// ConversationCreatedPayload represents conversation_created event
type ConversationCreatedPayload struct {
	ID             int                    `json:"id"`
	AccountID      int                    `json:"account_id"`
	InboxID        int                    `json:"inbox_id"`
	ContactID      int                    `json:"contact_id"`
	Status         string                 `json:"status"`
	AssigneeID     int                    `json:"assignee_id"`
	AdditionalAttr map[string]interface{} `json:"additional_attributes"`
	Contact        ContactInfo            `json:"contact"`
	Messages       []MessageInfo          `json:"messages"`
}

// MessageCreatedPayload represents message_created event
type MessageCreatedPayload struct {
	ID             int                    `json:"id"`
	Content        string                 `json:"content"`
	AccountID      int                    `json:"account_id"`
	InboxID        int                    `json:"inbox_id"`
	ConversationID int                    `json:"conversation_id"`
	MessageType    int                    `json:"message_type"`
	CreatedAt      time.Time              `json:"created_at"`
	Private        bool                   `json:"private"`
	Sender         SenderInfo             `json:"sender"`
	Contact        ContactInfo            `json:"contact"`
}

// ContactInfo represents contact information
type ContactInfo struct {
	ID            int                    `json:"id"`
	Name          string                 `json:"name"`
	Email         string                 `json:"email"`
	PhoneNumber   string                 `json:"phone_number"`
	Avatar        string                 `json:"avatar"`
	CustomAttr    map[string]interface{} `json:"custom_attributes"`
}

// MessageInfo represents message information
type MessageInfo struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// SenderInfo represents sender information
type SenderInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// ValidateSignature validates the HMAC signature of a webhook
func ValidateSignature(payload []byte, signature string, secret string) error {
	if secret == "" {
		// If no secret is configured, skip validation
		// WARNING: Not recommended for production!
		return nil
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return ErrInvalidSignature
	}

	return nil
}

// ParseWebhook parses a webhook payload
func ParseWebhook(payload []byte) (*ChatwootWebhook, error) {
	var webhook ChatwootWebhook
	if err := json.Unmarshal(payload, &webhook); err != nil {
		return nil, ErrInvalidPayload
	}

	return &webhook, nil
}

// ParseConversationCreated parses a conversation_created event
func ParseConversationCreated(data map[string]interface{}) (*ConversationCreatedPayload, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var payload ConversationCreatedPayload
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

// ParseMessageCreated parses a message_created event
func ParseMessageCreated(data map[string]interface{}) (*MessageCreatedPayload, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var payload MessageCreatedPayload
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}
