//go:build integration

package repositories

import (
	"context"
	"os"
	"strconv"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"whatpro-hub/internal/migrations"
	"whatpro-hub/internal/models"
)

func openTestDBForRLS(t *testing.T) *gorm.DB {
	t.Helper()
	if os.Getenv("RLS_TEST") != "1" {
		t.Skip("RLS_TEST not enabled; set RLS_TEST=1 to run RLS tests")
	}
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

func enableRLS(t *testing.T, db *gorm.DB) {
	t.Helper()

	stmts := []string{
		`ALTER TABLE accounts ENABLE ROW LEVEL SECURITY`,
		`ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
		`ALTER TABLE teams ENABLE ROW LEVEL SECURITY`,
		`ALTER TABLE providers ENABLE ROW LEVEL SECURITY`,
		`ALTER TABLE boards ENABLE ROW LEVEL SECURITY`,

		`DROP POLICY IF EXISTS tenant_accounts ON accounts`,
		`DROP POLICY IF EXISTS tenant_users ON users`,
		`DROP POLICY IF EXISTS tenant_teams ON teams`,
		`DROP POLICY IF EXISTS tenant_providers ON providers`,
		`DROP POLICY IF EXISTS tenant_boards ON boards`,

		`CREATE POLICY tenant_accounts ON accounts USING (id = current_setting('app.tenant_id')::int)`,
		`CREATE POLICY tenant_users ON users USING (account_id = current_setting('app.tenant_id')::int)`,
		`CREATE POLICY tenant_teams ON teams USING (account_id = current_setting('app.tenant_id')::int)`,
		`CREATE POLICY tenant_providers ON providers USING (account_id = current_setting('app.tenant_id')::int)`,
		`CREATE POLICY tenant_boards ON boards USING (account_id = current_setting('app.tenant_id')::int)`,
	}

	for _, stmt := range stmts {
		if err := db.Exec(stmt).Error; err != nil {
			t.Fatalf("failed RLS stmt: %s | err: %v", stmt, err)
		}
	}
}

func setTenant(t *testing.T, db *gorm.DB, accountID int) {
	t.Helper()
	stmt := "SET app.tenant_id = " + strconv.Itoa(accountID)
	if err := db.Exec(stmt).Error; err != nil {
		t.Fatalf("failed to set tenant: %v", err)
	}
}

func TestRLS_UsersIsolation(t *testing.T) {
	db := openTestDBForRLS(t)
	enableRLS(t, db)
	ctx := context.Background()

	// Seed accounts
	accountA := models.Account{ChatwootID: 3001, Name: "Tenant A"}
	accountB := models.Account{ChatwootID: 3002, Name: "Tenant B"}
	if err := db.Create(&accountA).Error; err != nil {
		t.Fatalf("create account A: %v", err)
	}
	if err := db.Create(&accountB).Error; err != nil {
		t.Fatalf("create account B: %v", err)
	}

	// Seed users
	userA := models.User{AccountID: int(accountA.ID), Email: "a@example.com", Name: "User A"}
	userB := models.User{AccountID: int(accountB.ID), Email: "b@example.com", Name: "User B"}
	if err := db.Create(&userA).Error; err != nil {
		t.Fatalf("create user A: %v", err)
	}
	if err := db.Create(&userB).Error; err != nil {
		t.Fatalf("create user B: %v", err)
	}

	userRepo := NewUserRepository(db)

	// Tenant A should only see A
	setTenant(t, db, int(accountA.ID))
	if _, err := userRepo.FindByID(ctx, userA.ID); err != nil {
		t.Fatalf("expected user A with RLS: %v", err)
	}
	if _, err := userRepo.FindByID(ctx, userB.ID); err == nil {
		t.Fatalf("expected RLS to block user B for tenant A")
	}

	// Tenant B should only see B
	setTenant(t, db, int(accountB.ID))
	if _, err := userRepo.FindByID(ctx, userB.ID); err != nil {
		t.Fatalf("expected user B with RLS: %v", err)
	}
	if _, err := userRepo.FindByID(ctx, userA.ID); err == nil {
		t.Fatalf("expected RLS to block user A for tenant B")
	}
}
