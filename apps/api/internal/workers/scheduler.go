// Package workers provides periodic task scheduling with Asynq
package workers

import (
	"log"

	"github.com/hibiken/asynq"
)

// Scheduler manages periodic tasks
type Scheduler struct {
	client    *asynq.Client
	scheduler *asynq.Scheduler
	logger    *log.Logger
}

// NewScheduler creates a new task scheduler
func NewScheduler(redisAddr string) *Scheduler {
	client := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	scheduler := asynq.NewScheduler(
		asynq.RedisClientOpt{Addr: redisAddr},
		&asynq.SchedulerOpts{
			LogLevel: asynq.InfoLevel,
		},
	)

	return &Scheduler{
		client:    client,
		scheduler: scheduler,
		logger:    log.Default(),
	}
}

// Start registers and starts all periodic tasks
func (s *Scheduler) Start() error {
	s.logger.Println("[Scheduler] Registering periodic tasks...")

	// Sync accounts every 5 minutes
	_, err := s.scheduler.Register(
		"*/5 * * * *", // Cron expression: every 5 minutes
		asynq.NewTask(TypeSyncAccounts, nil),
		asynq.Queue("critical"),
	)
	if err != nil {
		return err
	}
	s.logger.Println("[Scheduler] ✓ Registered: Account Sync (every 5 min)")

	// Provider health check every minute
	_, err = s.scheduler.Register(
		"* * * * *", // every minute
		asynq.NewTask(TypeProviderHealth, nil),
		asynq.Queue("default"),
	)
	if err != nil {
		return err
	}
	s.logger.Println("[Scheduler] ✓ Registered: Provider Health Check (every 1 min)")

	s.logger.Println("[Scheduler] Starting scheduler...")
	if err := s.scheduler.Start(); err != nil {
		return err
	}

	s.logger.Println("[Scheduler] All periodic tasks started successfully!")
	return nil
}

// Stop gracefully stops the scheduler
func (s *Scheduler) Stop() {
	s.logger.Println("[Scheduler] Shutting down...")
	s.scheduler.Shutdown()
	s.client.Close()
}

// EnqueueWebhook enqueues a webhook for async processing
func (s *Scheduler) EnqueueWebhook(event string, payload []byte) error {
	task := asynq.NewTask(TypeWebhookProcess, payload)
	_, err := s.client.Enqueue(task, asynq.Queue("webhooks"), asynq.MaxRetry(3))
	return err
}
