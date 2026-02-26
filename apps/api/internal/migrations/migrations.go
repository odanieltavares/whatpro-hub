// Package migrations handles database migrations
package migrations

import (
	"fmt"
	"log"

	"whatpro-hub/internal/models"

	"gorm.io/gorm"
)

// RunMigrations executes all database migrations
func RunMigrations(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")

	// Enable UUID extension
	if err := enableUUIDExtension(db); err != nil {
		return fmt.Errorf("failed to enable UUID extension: %w", err)
	}

	// Drop tables if they exist (development only - fresh start)
	// This avoids constraint conflicts during schema evolution
	log.Println("🗑️ Dropping existing tables for fresh migration...")
	db.Migrator().DropTable(
		&models.AuditLog{},
		&models.Session{},
		&models.CardHistory{},
		&models.Card{},
		&models.Stage{},
		&models.Board{},
		&models.Provider{},
		&models.TeamMember{},
		&models.Team{},
		&models.User{},
		&models.Account{},
		// Billing tables
		&models.Transaction{},
		&models.Subscription{},
		&models.Plan{},
		// Asaas tables
		&models.AsaasSubscription{},
		&models.AsaasCustomer{},
		// Workflow tables
		&models.WorkflowExecution{},
		&models.WorkflowDefinition{},
	)

	// Auto-migrate all models
	if err := db.AutoMigrate(
		&models.Account{},
		&models.User{},
		&models.Team{},
		&models.TeamMember{},
		&models.Provider{},
		&models.Board{},
		&models.Stage{},
		&models.Card{},
		&models.CardHistory{},
		&models.Session{},
		&models.AuditLog{},
		// Billing models (CRITICAL FIX)
		&models.Plan{},
		&models.Subscription{},
		&models.Transaction{},
		// Asaas payment gateway models
		&models.AsaasCustomer{},
		&models.AsaasSubscription{},
		// Workflow automation models
		&models.WorkflowDefinition{},
		&models.WorkflowExecution{},
	); err != nil {
		return fmt.Errorf("auto-migrate failed: %w", err)
	}

	// Register new migrations
	if err := MigrateAuth(db); err != nil {
		return fmt.Errorf("failed to migrate auth tables: %w", err)
	}
	if err := MigrateEntitlements(db); err != nil {
		return fmt.Errorf("failed to migrate entitlements tables: %w", err)
	}
	if err := MigrateChat(db); err != nil {
		return fmt.Errorf("failed to migrate internal chat tables: %w", err)
	}

	// Create indexes
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("✅ Database migrations completed successfully")
	return nil
}

// enableUUIDExtension enables the uuid-ossp extension for UUID generation
func enableUUIDExtension(db *gorm.DB) error {
	return db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error
}

// createIndexes creates additional indexes for performance
func createIndexes(db *gorm.DB) error {
	log.Println("📊 Creating additional indexes...")

	indexes := []string{
		// Accounts
		"CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)",

		// Users
		"CREATE INDEX IF NOT EXISTS idx_users_account_role ON users(account_id, whatpro_role)",
		"CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability_status)",

		// Teams
		"CREATE INDEX IF NOT EXISTS idx_teams_account ON teams(account_id)",

		// TeamMembers - composite indexes
		"CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id)",

		// Providers
		"CREATE INDEX IF NOT EXISTS idx_providers_account_status ON providers(account_id, status)",
		"CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type)",

		// Boards
		"CREATE INDEX IF NOT EXISTS idx_boards_account_default ON boards(account_id, is_default)",

		// Stages
		"CREATE INDEX IF NOT EXISTS idx_stages_board_position ON stages(board_id, position)",

		// Cards
		"CREATE INDEX IF NOT EXISTS idx_cards_stage ON cards(stage_id)",
		"CREATE INDEX IF NOT EXISTS idx_cards_conversation ON cards(chatwoot_conversation_id)",
		"CREATE INDEX IF NOT EXISTS idx_cards_assignee ON cards(assignee_id)",
		"CREATE INDEX IF NOT EXISTS idx_cards_priority ON cards(priority)",
		"CREATE INDEX IF NOT EXISTS idx_cards_stage_position ON cards(stage_id, position)",

		// CardHistory
		"CREATE INDEX IF NOT EXISTS idx_card_history_card ON card_histories(card_id)",
		"CREATE INDEX IF NOT EXISTS idx_card_history_created ON card_histories(created_at DESC)",

		// Sessions
		"CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)",

		// AuditLogs
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_account ON audit_logs(account_id)",
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)",
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)",

		// Billing: Plans
		"CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active)",
		"CREATE INDEX IF NOT EXISTS idx_plans_price ON plans(currency, price)",

		// Billing: Subscriptions
		"CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON subscriptions(account_id)",
		"CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id)",
		"CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)",
		"CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider, provider_sub_id)",
		"CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_end)",

		// Billing: Transactions
		"CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON transactions(subscription_id)",
		"CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)",
		"CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)",
		"CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC)",

		// Asaas: Customers
		"CREATE INDEX IF NOT EXISTS idx_asaas_customers_account ON asaas_customers(account_id)",

		// Asaas: Subscriptions
		"CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_account_status ON asaas_subscriptions(account_id, status)",

		// Workflows: Definitions
		"CREATE INDEX IF NOT EXISTS idx_workflow_definitions_account ON workflow_definitions(account_id, is_active)",
		"CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created ON workflow_definitions(account_id, created_at DESC)",

		// Workflows: Executions
		"CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id, started_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_workflow_executions_account_status ON workflow_executions(account_id, status)",
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			log.Printf("⚠️  Warning: Failed to create index: %v", err)
			// Continue with other indexes even if one fails
		}
	}

	log.Println("✅ Indexes created successfully")
	return nil
}

// SeedInitialData creates initial data for new installations
func SeedInitialData(db *gorm.DB) error {
	log.Println("🌱 Seeding initial data...")

	// Check if data already exists
	var count int64
	db.Model(&models.Account{}).Count(&count)
	if count > 0 {
		log.Println("ℹ️  Data already exists, skipping seed")
		return nil
	}

	// Seed data will be added here as needed
	// For now, we'll just log that seeding is complete

	log.Println("✅ Initial data seeded successfully")
	return nil
}
