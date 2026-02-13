// Package main is the entry point for the WhatPro Hub Worker
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/hibiken/asynq"

	"whatpro-hub/internal/config"
	"whatpro-hub/internal/workers"
)

func main() {
	log.Println("🔧 WhatPro Hub Worker starting...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	rdb, err := config.InitRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Create worker instance
	worker, err := workers.NewWorker(db, rdb, cfg)
	if err != nil {
		log.Fatalf("Failed to create worker: %v", err)
	}

	// Parse Redis URL for Asynq
	redisAddr := "localhost:6379"
	if cfg.RedisURL != "" {
		// Extract host:port from redis://host:port URL
		// For production, use a proper URL parser
		redisAddr = cfg.RedisURL[8:] // Remove "redis://" prefix
	}

	// Create Asynq server
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisAddr},
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 6, // High priority (account sync)
				"default":  3, // Normal priority (health checks)
				"webhooks": 1, // Low priority (can be delayed)
			},
			LogLevel:       asynq.InfoLevel,
			RetryDelayFunc: asynq.DefaultRetryDelayFunc,
		},
	)

	// Register task handlers
	mux := asynq.NewServeMux()
	worker.RegisterHandlers(mux)

	// Create and start scheduler
	scheduler := workers.NewScheduler(redisAddr)
	if err := scheduler.Start(); err != nil {
		log.Fatalf("Failed to start scheduler: %v", err)
	}
	defer scheduler.Stop()

	// Start server in goroutine
	go func() {
		log.Println("✅ Worker server started")
		if err := srv.Run(mux); err != nil {
			log.Fatalf("Worker server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down worker server...")
	srv.Shutdown()

	log.Println("Worker exited properly")
}
