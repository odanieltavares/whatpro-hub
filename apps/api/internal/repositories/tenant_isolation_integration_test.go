//go:build integration

package repositories

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"whatpro-hub/internal/migrations"
	"whatpro-hub/internal/models"
)

func openTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST not set; skipping integration tests")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open DB: %v", err)
	}
	if err := migrations.RunMigrations(db); err != nil {
		t.Fatalf("failed to run migrations: %v", err)
	}
	return db
}

func seedTenantData(t *testing.T, db *gorm.DB) (accountA, accountB models.Account, boardA models.Board, stageA models.Stage, cardA models.Card, providerA models.Provider) {
	t.Helper()

	accountA = models.Account{ChatwootID: 1001, Name: "Tenant A"}
	accountB = models.Account{ChatwootID: 2002, Name: "Tenant B"}
	if err := db.Create(&accountA).Error; err != nil {
		t.Fatalf("create account A: %v", err)
	}
	if err := db.Create(&accountB).Error; err != nil {
		t.Fatalf("create account B: %v", err)
	}

	boardA = models.Board{
		AccountID: int(accountA.ID),
		Name:      "Board A",
		Type:      "pipeline",
	}
	if err := db.Create(&boardA).Error; err != nil {
		t.Fatalf("create board A: %v", err)
	}

	stageA = models.Stage{
		BoardID:  boardA.ID,
		Name:     "Stage A",
		Position: 0,
	}
	if err := db.Create(&stageA).Error; err != nil {
		t.Fatalf("create stage A: %v", err)
	}

	cardA = models.Card{
		StageID:                stageA.ID,
		ChatwootConversationID: 111,
		Title:                  "Card A",
		Priority:               "medium",
		Position:               0,
	}
	if err := db.Create(&cardA).Error; err != nil {
		t.Fatalf("create card A: %v", err)
	}

	providerA = models.Provider{
		AccountID:    int(accountA.ID),
		Name:         "Provider A",
		Type:         "evolution",
		BaseURL:      "http://example.com",
		InstanceName: "inst-a",
		Status:       "connected",
	}
	if err := db.Create(&providerA).Error; err != nil {
		t.Fatalf("create provider A: %v", err)
	}

	return
}

func TestTenantIsolation_Repositories(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, accountB, boardA, stageA, cardA, providerA := seedTenantData(t, db)

	kanbanRepo := NewKanbanRepository(db)
	providerRepo := NewProviderRepository(db)

	// Board scoped access
	if _, err := kanbanRepo.GetBoardForAccount(ctx, boardA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected board for account A: %v", err)
	}
	if _, err := kanbanRepo.GetBoardForAccount(ctx, boardA.ID, int(accountB.ID)); err == nil {
		t.Fatalf("expected not found for board cross-tenant")
	}

	// Stage scoped access
	if _, err := kanbanRepo.GetStageForAccount(ctx, stageA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected stage for account A: %v", err)
	}
	if _, err := kanbanRepo.GetStageForAccount(ctx, stageA.ID, int(accountB.ID)); err == nil {
		t.Fatalf("expected not found for stage cross-tenant")
	}

	// Card scoped access
	if _, err := kanbanRepo.GetCardForAccount(ctx, cardA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected card for account A: %v", err)
	}
	if _, err := kanbanRepo.GetCardForAccount(ctx, cardA.ID, int(accountB.ID)); err == nil {
		t.Fatalf("expected not found for card cross-tenant")
	}

	// Provider scoped access
	if _, err := providerRepo.FindByIDForAccount(ctx, providerA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected provider for account A: %v", err)
	}
	if _, err := providerRepo.FindByIDForAccount(ctx, providerA.ID, int(accountB.ID)); err == nil {
		t.Fatalf("expected not found for provider cross-tenant")
	}
}

func TestTenantIsolation_Updates(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, accountB, boardA, _, _, providerA := seedTenantData(t, db)

	kanbanRepo := NewKanbanRepository(db)
	providerRepo := NewProviderRepository(db)

	// Update board via repo: should work for owner
	boardA.Name = "Board A Updated"
	if err := kanbanRepo.UpdateBoard(ctx, &boardA); err != nil {
		t.Fatalf("update board: %v", err)
	}

	// Cross-tenant provider delete should fail
	if err := providerRepo.DeleteForAccount(ctx, providerA.ID, int(accountB.ID)); err == nil {
		t.Fatalf("expected provider delete to fail for wrong tenant")
	}

	// Delete for owner should succeed
	if err := providerRepo.DeleteForAccount(ctx, providerA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected provider delete for owner: %v", err)
	}
}

func TestTenantIsolation_CardHistory(t *testing.T) {
	db := openTestDB(t)
	ctx := context.Background()

	accountA, _, _, _, cardA, _ := seedTenantData(t, db)
	kanbanRepo := NewKanbanRepository(db)

	history := &models.CardHistory{
		ID:          uuid.New(),
		CardID:      cardA.ID,
		Action:      "moved",
		CreatedAt:   time.Now(),
	}

	if err := kanbanRepo.LogCardHistory(ctx, history); err != nil {
		t.Fatalf("log card history: %v", err)
	}

	// Ensure card still accessible for account A
	if _, err := kanbanRepo.GetCardForAccount(ctx, cardA.ID, int(accountA.ID)); err != nil {
		t.Fatalf("expected card after history: %v", err)
	}
}
