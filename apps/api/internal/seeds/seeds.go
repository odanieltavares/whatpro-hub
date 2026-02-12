package seeds

import (
	"log"
	"time"

	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
	
	"whatpro-hub/internal/models"
)

// SeedDemoData populates the database with demo data if it doesn't exist
func SeedDemoData(db *gorm.DB) {
	log.Println("🌱 Checking for Demo Data...")

	// 1. Create Demo Account
	var account models.Account
	if err := db.First(&account, "chatwoot_id = ?", 9999).Error; err != nil {
		account = models.Account{
			ChatwootID:   9999,
			Name:         "Demo Company",
			Locale:       "pt_BR",
			Domain:       "demo.whatpro.com",
			SupportEmail: "demo@whatpro.com",
			Status:       "active",
			CreatedAt:    time.Now(),
		}
		if err := db.Create(&account).Error; err != nil {
			log.Printf("❌ Failed to seed Account: %v", err)
			return
		}
		log.Println("✅ Seeded Account: Demo Company")
	}

	// 2. Create Demo User
	var user models.User
	if err := db.First(&user, "email = ?", "demo@whatpro.com").Error; err != nil {
		user = models.User{
			ChatwootID:   8888,
			AccountID:    int(account.ChatwootID), // Using ChatwootID as AccountID link for simplicity in demo
			Email:        "demo@whatpro.com",
			Name:         "Demo User",
			AvatarURL:    "https://ui-avatars.com/api/?name=Demo+User",
			ChatwootRole: "administrator",
			WhatproRole:  "super_admin",
			CreatedAt:    time.Now(),
		}
		if err := db.Create(&user).Error; err != nil {
			log.Printf("❌ Failed to seed User: %v", err)
			return
		}
		log.Println("✅ Seeded User: demo@whatpro.com")
	}

	// 3. Create Entitlements
	var entitlements models.AccountEntitlements
	if err := db.First(&entitlements, "account_id = ?", account.ChatwootID).Error; err != nil {
		entitlements = models.AccountEntitlements{
			AccountID:          int(account.ChatwootID),
			MaxInboxes:         10,
			MaxAgents:          50,
			MaxTeams:           99,
			MaxIntegrations:    10,
			MaxMonthlyMessages: 100000,
			KanbanEnabled:      true,
			AnalyticsEnabled:   true,
			CreatedAt:          time.Now(),
		}
		if err := db.Create(&entitlements).Error; err != nil {
			log.Printf("❌ Failed to seed Entitlements: %v", err)
		} else {
			log.Println("✅ Seeded Entitlements")
		}
	}

	// 4. Create Demo Team
	var team models.Team
	if err := db.First(&team, "account_id = ? AND name = ?", account.ChatwootID, "Sales Team").Error; err != nil {
		team = models.Team{
			AccountID:       int(account.ChatwootID),
			ChatwootID:      7777,
			Name:            "Sales Team",
			Description:     "High performance sales",
			AllowAutoAssign: true,
			CreatedAt:       time.Now(),
		}
		if err := db.Create(&team).Error; err != nil {
			log.Printf("❌ Failed to seed Team: %v", err)
		} else {
			log.Println("✅ Seeded Team: Sales Team")
		}
	}

	// 5. Create Demo Provider (Mock)
	var provider models.Provider
	if err := db.First(&provider, "account_id = ? AND type = ?", account.ChatwootID, "evolution").Error; err != nil {
		provider = models.Provider{
			AccountID:       int(account.ChatwootID),
			Name:            "Evolution Demo",
			Type:            "evolution",
			BaseURL:         "https://api.evolution.demo",
			InstanceName:    "demo_instance",
			Status:          "connected",
			APIKeyEncrypted: hashAPIKey("demo-key"),
			CreatedAt:       time.Now(),
		}
		if err := db.Create(&provider).Error; err != nil {
			log.Printf("❌ Failed to seed Provider: %v", err)
		} else {
			log.Println("✅ Seeded Provider: Evolution Demo")
		}
	}

	// 6. Create Active Subscription
	var plan models.Plan
	if err := db.First(&plan, "name = ?", "Pro Plan").Error; err != nil {
		plan = models.Plan{
			Name:        "Pro Plan",
			Description: "Best for business",
			Price:       99.90,
			Currency:    "BRL",
			// Interval:    "month", // Field removed or not in model
			AsaasID:     "plan_demo_123",
			IsActive:    true,
			Features:    models.JSON{"kanban": true, "reports": true},
			CreatedAt:   time.Now(),
		}
		if err := db.Create(&plan).Error; err != nil {
			log.Printf("❌ Failed to seed Plan: %v", err)
		} else {
			log.Println("✅ Seeded Plan: Pro Plan")
		}
	}

	var sub models.Subscription
	if err := db.First(&sub, "account_id = ?", account.ChatwootID).Error; err != nil {
		sub = models.Subscription{
			AccountID:          int(account.ChatwootID),
			PlanID:             plan.ID,
			Provider:           "asaas",
			ProviderSubID:      "sub_demo_123",
			Status:             "active",
			CurrentPeriodStart: time.Now(),
			CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0), // Expires in 1 month
			CreatedAt:          time.Now(),
		}
		if err := db.Create(&sub).Error; err != nil {
			log.Printf("❌ Failed to seed Subscription: %v", err)
		} else {
			log.Println("✅ Seeded Subscription: Active (Expires in 30 days)")
		}
	}
}

func hashAPIKey(key string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(key), 14)
	return string(bytes)
}
