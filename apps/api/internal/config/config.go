// Package config handles application configuration
package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Config holds all application configuration
type Config struct {
	// App
	Env  string
	Port string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// Chatwoot
	ChatwootURL    string
	ChatwootAPIKey string

	// JWT
	JWTSecret        string
	JWTExpireMinutes int

	// CORS
	CORSOrigins string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists (for development)
	godotenv.Load()

	cfg := &Config{
		Env:              getEnv("APP_ENV", "development"),
		Port:             getEnv("APP_PORT", "3000"),
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379"),
		ChatwootURL:      getEnv("CHATWOOT_URL", "http://localhost:8080"),
		ChatwootAPIKey:   getEnv("CHATWOOT_API_KEY", ""),
		JWTSecret:        getEnv("JWT_SECRET", ""),
		JWTExpireMinutes: 60 * 24, // 24 hours
		CORSOrigins:      getEnv("CORS_ORIGINS", "*"),
	}

	// Validate required fields
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

// InitDatabase creates a database connection
func InitDatabase(cfg *Config) (*gorm.DB, error) {
	logLevel := logger.Warn
	if cfg.Env == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

// InitRedis creates a Redis connection
func InitRedis(cfg *Config) (*redis.Client, error) {
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	rdb := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return rdb, nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
