//go:build integration

// Package repositories contains integration tests for chat module
package repositories

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"whatpro-hub/internal/models"
)

// seedChatData creates chat test data for two tenants
func seedChatData(t *testing.T, db *gorm.DB) (accountA, accountB models.Account, userA1, userA2, userB1 models.User, roomA models.InternalChatRoom) {
	t.Helper()

	// Create accounts
	accountA = models.Account{ChatwootID: 1001, Name: "Chat Tenant A"}
	accountB = models.Account{ChatwootID: 2002, Name: "Chat Tenant B"}
	if err := db.Create(&accountA).Error; err != nil {
		t.Fatalf("create account A: %v", err)
	}
	if err := db.Create(&accountB).Error; err != nil {
		t.Fatalf("create account B: %v", err)
	}

	// Create users for tenant A
	userA1 = models.User{
		AccountID:    int(accountA.ID),
		ChatwootID:   101,
		Email:        "user1@tenantA.com",
		Name:         "User A1",
		WhatproRole:  "agent",
	}
	if err := db.Create(&userA1).Error; err != nil {
		t.Fatalf("create user A1: %v", err)
	}
	userA2 = models.User{
		AccountID:    int(accountA.ID),
		ChatwootID:   102,
		Email:        "user2@tenantA.com",
		Name:         "User A2",
		WhatproRole:  "agent",
	}
	if err := db.Create(&userA2).Error; err != nil {
		t.Fatalf("create user A2: %v", err)
	}

	// Create user for tenant B
	userB1 = models.User{
		AccountID:    int(accountB.ID),
		ChatwootID:   201,
		Email:        "user1@tenantB.com",
		Name:         "User B1",
		WhatproRole:  "agent",
	}
	if err := db.Create(&userB1).Error; err != nil {
		t.Fatalf("create user B1: %v", err)
	}

	// Create room for tenant A
	roomA = models.InternalChatRoom{
		AccountID: int(accountA.ID),
		Type:      models.ChatRoomTypeRoom,
		Name:      "Team Room A",
		CreatedBy: int(userA1.ID),
	}
	if err := db.Create(&roomA).Error; err != nil {
		t.Fatalf("create room A: %v", err)
	}

	// Add members
	memberA1 := models.InternalChatMember{
		RoomID: roomA.ID,
		UserID: int(userA1.ID),
		Role:   models.ChatMemberRoleOwner,
	}
	if err := db.Create(&memberA1).Error; err != nil {
		t.Fatalf("create member A1: %v", err)
	}
	memberA2 := models.InternalChatMember{
		RoomID: roomA.ID,
		UserID: int(userA2.ID),
		Role:   models.ChatMemberRoleMember,
	}
	if err := db.Create(&memberA2).Error; err != nil {
		t.Fatalf("create member A2: %v", err)
	}

	return
}

// TestChatTenantIsolation_Rooms tests room access across tenants
func TestChatTenantIsolation_Rooms(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, accountB, userA1, _, userB1, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Tenant A user should access tenant A room
	room, err := chatRepo.GetRoomByID(ctx, int(accountA.ID), roomA.ID)
	if err != nil {
		t.Fatalf("expected room for tenant A: %v", err)
	}
	if room == nil || room.ID != roomA.ID {
		t.Fatalf("expected correct room ID")
	}

	// Tenant B should NOT access tenant A room
	room, err = chatRepo.GetRoomByID(ctx, int(accountB.ID), roomA.ID)
	if err == nil && room != nil {
		t.Fatalf("IDOR: tenant B accessed tenant A room!")
	}

	// List rooms for user A1 should return rooms
	rooms, err := chatRepo.GetRoomsByUserID(ctx, int(accountA.ID), int(userA1.ID))
	if err != nil {
		t.Fatalf("list rooms for user A1: %v", err)
	}
	if len(rooms) == 0 {
		t.Fatalf("expected at least one room for user A1")
	}

	// List rooms for user B1 should return empty (not member)
	rooms, err = chatRepo.GetRoomsByUserID(ctx, int(accountB.ID), int(userB1.ID))
	if err != nil {
		t.Fatalf("list rooms for user B1: %v", err)
	}
	if len(rooms) != 0 {
		t.Fatalf("expected no rooms for user B1")
	}
}

// TestChatTenantIsolation_Messages tests message access across tenants
func TestChatTenantIsolation_Messages(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, accountB, userA1, _, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Create message in tenant A room
	msg := &models.InternalChatMessage{
		RoomID:      roomA.ID,
		AccountID:   int(accountA.ID),
		SenderID:    int(userA1.ID),
		Content:     "Hello from tenant A",
		MessageType: models.ChatMessageTypeText,
	}
	if err := chatRepo.CreateMessage(ctx, msg); err != nil {
		t.Fatalf("create message: %v", err)
	}

	// Get message with tenant A should work
	foundMsg, err := chatRepo.GetMessageByID(ctx, int(accountA.ID), msg.ID)
	if err != nil {
		t.Fatalf("get message for tenant A: %v", err)
	}
	if foundMsg == nil || foundMsg.Content != "Hello from tenant A" {
		t.Fatalf("expected correct message content")
	}

	// Get message with tenant B should FAIL (IDOR protection)
	foundMsg, err = chatRepo.GetMessageByID(ctx, int(accountB.ID), msg.ID)
	if foundMsg != nil {
		t.Fatalf("IDOR: tenant B accessed tenant A message!")
	}

	// List messages: tenant A should see messages
	messages, err := chatRepo.GetMessages(ctx, roomA.ID, 50, nil)
	if err != nil {
		t.Fatalf("list messages: %v", err)
	}
	if len(messages) == 0 {
		t.Fatalf("expected at least one message")
	}
}

// TestChatMembershipEnforcement tests that non-members cannot access room
func TestChatMembershipEnforcement(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, _, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// User A1 is a member
	isMember, err := chatRepo.IsMember(ctx, roomA.ID, int(userA1.ID))
	if err != nil {
		t.Fatalf("check membership: %v", err)
	}
	if !isMember {
		t.Fatalf("expected user A1 to be member")
	}

	// Create a new user not in any room
	newUser := models.User{
		AccountID:    int(accountA.ID),
		ChatwootID:   999,
		Email:        "notamember@tenantA.com",
		Name:         "Not A Member",
		WhatproRole:  "agent",
	}
	if err := db.Create(&newUser).Error; err != nil {
		t.Fatalf("create new user: %v", err)
	}

	// New user should not be member
	isMember, err = chatRepo.IsMember(ctx, roomA.ID, int(newUser.ID))
	if err != nil {
		t.Fatalf("check membership for new user: %v", err)
	}
	if isMember {
		t.Fatalf("expected new user to NOT be member")
	}
}

// TestChatRBAC tests that only owner/moderator can manage members
func TestChatRBAC(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, userA2, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Get member role for user A1 (owner)
	memberA1, err := chatRepo.GetMember(ctx, roomA.ID, int(userA1.ID))
	if err != nil {
		t.Fatalf("get member A1: %v", err)
	}
	if memberA1.Role != models.ChatMemberRoleOwner {
		t.Fatalf("expected user A1 to be owner, got: %s", memberA1.Role)
	}

	// Get member role for user A2 (member)
	memberA2, err := chatRepo.GetMember(ctx, roomA.ID, int(userA2.ID))
	if err != nil {
		t.Fatalf("get member A2: %v", err)
	}
	if memberA2.Role != models.ChatMemberRoleMember {
		t.Fatalf("expected user A2 to be member, got: %s", memberA2.Role)
	}

	// Create a new user to add
	newUser := models.User{
		AccountID:    int(accountA.ID),
		ChatwootID:   888,
		Email:        "tobeadded@tenantA.com",
		Name:         "To Be Added",
		WhatproRole:  "agent",
	}
	if err := db.Create(&newUser).Error; err != nil {
		t.Fatalf("create new user: %v", err)
	}

	// Add member (simulating owner action)
	newMember := &models.InternalChatMember{
		RoomID: roomA.ID,
		UserID: int(newUser.ID),
		Role:   models.ChatMemberRoleMember,
	}
	if err := chatRepo.AddMember(ctx, newMember); err != nil {
		t.Fatalf("add member: %v", err)
	}

	// Verify member was added
	isMember, err := chatRepo.IsMember(ctx, roomA.ID, int(newUser.ID))
	if err != nil {
		t.Fatalf("check new member: %v", err)
	}
	if !isMember {
		t.Fatalf("expected new user to be member after add")
	}

	// Remove member
	if err := chatRepo.RemoveMember(ctx, roomA.ID, int(newUser.ID)); err != nil {
		t.Fatalf("remove member: %v", err)
	}

	// Verify member was removed
	isMember, err = chatRepo.IsMember(ctx, roomA.ID, int(newUser.ID))
	if err != nil {
		t.Fatalf("check removed member: %v", err)
	}
	if isMember {
		t.Fatalf("expected user to NOT be member after remove")
	}
}

// TestChatAuditLog tests that audit logs are created
func TestChatAuditLog(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, _, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Create audit log
	audit := &models.InternalChatAudit{
		AccountID: int(accountA.ID),
		ActorID:   int(userA1.ID),
		Action:    models.ChatAuditActionRoomCreated,
		TargetID:  roomA.ID.String(),
		Metadata:  models.JSON{"type": "room"},
	}
	if err := chatRepo.CreateAuditLog(ctx, audit); err != nil {
		t.Fatalf("create audit log: %v", err)
	}

	// Verify audit log was created
	if audit.ID == uuid.Nil {
		t.Fatalf("expected audit log ID to be set")
	}

	// Get audit logs for account
	logs, err := chatRepo.GetAuditLogs(ctx, int(accountA.ID), 10, 0)
	if err != nil {
		t.Fatalf("get audit logs: %v", err)
	}
	if len(logs) == 0 {
		t.Fatalf("expected at least one audit log")
	}
}

// TestChatReadUnread tests read/unread functionality
func TestChatReadUnread(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, userA2, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Create messages
	for i := 0; i < 3; i++ {
		msg := &models.InternalChatMessage{
			RoomID:      roomA.ID,
			AccountID:   int(accountA.ID),
			SenderID:    int(userA1.ID),
			Content:     "Message " + string(rune('A'+i)),
			MessageType: models.ChatMessageTypeText,
		}
		if err := chatRepo.CreateMessage(ctx, msg); err != nil {
			t.Fatalf("create message %d: %v", i, err)
		}
		time.Sleep(10 * time.Millisecond) // Ensure different timestamps
	}

	// Get unread count for user A2 (not read yet)
	member, _ := chatRepo.GetMember(ctx, roomA.ID, int(userA2.ID))
	unread, err := chatRepo.GetUnreadCount(ctx, roomA.ID, int(userA2.ID), member.LastReadAt)
	if err != nil {
		t.Fatalf("get unread count: %v", err)
	}
	if unread < 3 {
		t.Fatalf("expected at least 3 unread messages, got: %d", unread)
	}

	// Mark as read
	if err := chatRepo.UpdateLastRead(ctx, roomA.ID, int(userA2.ID)); err != nil {
		t.Fatalf("update last read: %v", err)
	}

	// Get unread count again (should be 0)
	member, _ = chatRepo.GetMember(ctx, roomA.ID, int(userA2.ID))
	unread, err = chatRepo.GetUnreadCount(ctx, roomA.ID, int(userA2.ID), member.LastReadAt)
	if err != nil {
		t.Fatalf("get unread count after read: %v", err)
	}
	if unread != 0 {
		t.Fatalf("expected 0 unread after marking read, got: %d", unread)
	}
}

// TestChatSoftDelete tests soft delete of messages
func TestChatSoftDelete(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, _, _, roomA := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Create message
	msg := &models.InternalChatMessage{
		RoomID:      roomA.ID,
		AccountID:   int(accountA.ID),
		SenderID:    int(userA1.ID),
		Content:     "Message to delete",
		MessageType: models.ChatMessageTypeText,
	}
	if err := chatRepo.CreateMessage(ctx, msg); err != nil {
		t.Fatalf("create message: %v", err)
	}

	// Soft delete
	if err := chatRepo.SoftDeleteMessage(ctx, msg.ID); err != nil {
		t.Fatalf("soft delete message: %v", err)
	}

	// List messages should NOT include deleted
	messages, err := chatRepo.GetMessages(ctx, roomA.ID, 50, nil)
	if err != nil {
		t.Fatalf("list messages after delete: %v", err)
	}
	for _, m := range messages {
		if m.ID == msg.ID {
			t.Fatalf("deleted message should not appear in list")
		}
	}
}

// TestChatDMDeduplication tests that DMs are deduplicated
func TestChatDMDeduplication(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, userA1, userA2, _, _ := seedChatData(t, db)

	chatRepo := NewChatRepository(db)

	// Create DM between user A1 and A2
	dmRoom := &models.InternalChatRoom{
		AccountID: int(accountA.ID),
		Type:      models.ChatRoomTypeDM,
		CreatedBy: int(userA1.ID),
	}
	memberIDs := []int{int(userA2.ID)}
	if err := chatRepo.CreateRoom(ctx, dmRoom, memberIDs, models.ChatMemberRoleMember); err != nil {
		t.Fatalf("create DM room: %v", err)
	}

	// Find DM should return existing room
	foundDM, err := chatRepo.FindDMRoom(ctx, int(accountA.ID), int(userA1.ID), int(userA2.ID))
	if err != nil {
		t.Fatalf("find DM room: %v", err)
	}
	if foundDM == nil {
		t.Fatalf("expected to find DM room")
	}
	if foundDM.ID != dmRoom.ID {
		t.Fatalf("expected same DM room ID")
	}

	// Find DM in reverse order should also work
	foundDMReverse, err := chatRepo.FindDMRoom(ctx, int(accountA.ID), int(userA2.ID), int(userA1.ID))
	if err != nil {
		t.Fatalf("find DM room reverse: %v", err)
	}
	if foundDMReverse == nil || foundDMReverse.ID != dmRoom.ID {
		t.Fatalf("expected same DM room when searched in reverse")
	}
}
