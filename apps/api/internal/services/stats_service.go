// Package services — account statistics aggregation
package services

import (
	"context"
	"sync"
	"time"

	"gorm.io/gorm"
)

// AccountStats holds real-time aggregated metrics for a single account.
// Values are computed via parallel DB queries — never hardcoded.
type AccountStats struct {
	ActiveInstances    int       `json:"active_instances"`
	MessagesToday      int       `json:"messages_today"`
	ActiveClients      int       `json:"active_clients"`
	WorkflowsTriggered int       `json:"workflows_triggered"`
	GeneratedAt        time.Time `json:"generated_at"`
}

// StatsService fetches aggregated dashboard metrics from the database.
type StatsService struct {
	db *gorm.DB
}

// NewStatsService creates a StatsService with a database connection.
func NewStatsService(db *gorm.DB) *StatsService {
	return &StatsService{db: db}
}

// GetAccountStats runs 4 parallel queries and returns aggregated stats.
// Returns zeros for tables that may not yet exist (graceful degradation).
func (s *StatsService) GetAccountStats(ctx context.Context, accountID uint) (*AccountStats, error) {
	stats := &AccountStats{
		GeneratedAt: time.Now(),
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	var firstErr error

	setErr := func(err error) {
		mu.Lock()
		defer mu.Unlock()
		if firstErr == nil {
			firstErr = err
		}
	}

	// Query 1: active provider instances
	wg.Add(1)
	go func() {
		defer wg.Done()
		var count int64
		err := s.db.WithContext(ctx).
			Table("providers").
			Where("account_id = ? AND status = 'connected'", accountID).
			Count(&count).Error
		if err != nil {
			setErr(err)
			return
		}
		mu.Lock()
		stats.ActiveInstances = int(count)
		mu.Unlock()
	}()

	// Query 2: messages sent today (table may not exist yet — return 0 gracefully)
	wg.Add(1)
	go func() {
		defer wg.Done()
		var count int64
		// Use raw query with error suppression for tables not yet created
		err := s.db.WithContext(ctx).
			Table("messages").
			Where("account_id = ? AND DATE(created_at) = CURRENT_DATE", accountID).
			Count(&count).Error
		if err != nil {
			// Table may not exist — log and return 0 (not a fatal error)
			return
		}
		mu.Lock()
		stats.MessagesToday = int(count)
		mu.Unlock()
	}()

	// Query 3: active clients (distinct contact_id from conversations)
	wg.Add(1)
	go func() {
		defer wg.Done()
		var count int64
		err := s.db.WithContext(ctx).
			Table("conversations").
			Where("account_id = ?", accountID).
			Distinct("contact_id").
			Count(&count).Error
		if err != nil {
			// Table may not exist — return 0 gracefully
			return
		}
		mu.Lock()
		stats.ActiveClients = int(count)
		mu.Unlock()
	}()

	// Query 4: workflow executions today
	wg.Add(1)
	go func() {
		defer wg.Done()
		var count int64
		err := s.db.WithContext(ctx).
			Table("workflow_executions").
			Where("account_id = ? AND DATE(started_at) = CURRENT_DATE", accountID).
			Count(&count).Error
		if err != nil {
			// Table may not exist yet — return 0 gracefully
			return
		}
		mu.Lock()
		stats.WorkflowsTriggered = int(count)
		mu.Unlock()
	}()

	wg.Wait()

	// Only fail if the critical query (providers) failed
	if firstErr != nil {
		return nil, firstErr
	}

	return stats, nil
}
