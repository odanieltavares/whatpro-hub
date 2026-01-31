// Package handlers provides HTTP handlers for the API
package handlers

import (
	"context"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Version   string            `json:"version"`
	Checks    map[string]string `json:"checks,omitempty"`
}

// HealthLive handles GET /health/live
// Liveness probe - always returns 200 if the service is running
func (h *Handler) HealthLive(c *fiber.Ctx) error {
	return c.JSON(HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
	})
}

// HealthReady handles GET /health/ready
// Readiness probe - checks if dependencies are ready
func (h *Handler) HealthReady(c *fiber.Ctx) error {
	checks := make(map[string]string)
	allHealthy := true

	// Check database
	sqlDB, err := h.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		checks["database"] = "unhealthy"
		allHealthy = false
	} else {
		checks["database"] = "healthy"
	}

	// Check Redis
	if h.Redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := h.Redis.Ping(ctx).Err(); err != nil {
			checks["redis"] = "unhealthy"
			allHealthy = false
		} else {
			checks["redis"] = "healthy"
		}
	} else {
		checks["redis"] = "not_configured"
	}

	status := "ok"
	statusCode := fiber.StatusOK
	if !allHealthy {
		status = "degraded"
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "1.0.0",
		Checks:    checks,
	})
}

// HealthDeep handles GET /health/deep
// Deep health check - includes all dependencies and Chatwoot
func (h *Handler) HealthDeep(c *fiber.Ctx) error {
	checks := make(map[string]string)
	allHealthy := true

	// Check database
	sqlDB, err := h.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		checks["database"] = "unhealthy"
		allHealthy = false
	} else {
		// Check if we can query
		var result int
		if err := h.DB.Raw("SELECT 1").Scan(&result).Error; err != nil {
			checks["database"] = "unhealthy"
			allHealthy = false
		} else {
			checks["database"] = "healthy"
		}
	}

	// Check Redis
	if h.Redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := h.Redis.Ping(ctx).Err(); err != nil {
			checks["redis"] = "unhealthy"
			allHealthy = false
		} else {
			checks["redis"] = "healthy"
		}
	} else {
		checks["redis"] = "not_configured"
	}

	// TODO: Check Chatwoot connectivity
	checks["chatwoot"] = "not_checked"

	status := "ok"
	statusCode := fiber.StatusOK
	if !allHealthy {
		status = "degraded"
		statusCode = fiber.StatusServiceUnavailable
	}

	return c.Status(statusCode).JSON(fiber.Map{
		"status":    status,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"version":   "1.0.0",
		"checks":    checks,
		"system": fiber.Map{
			"goroutines": runtime.NumGoroutine(),
			"memory":     getMemStats(),
		},
	})
}

// Metrics handles GET /metrics
// Returns Prometheus-compatible metrics
func (h *Handler) Metrics(c *fiber.Ctx) error {
	// Simple metrics for now
	// In production, use prometheus/client_golang

	c.Set("Content-Type", "text/plain; charset=utf-8")

	metrics := `# HELP whatpro_hub_up Is WhatPro Hub API running
# TYPE whatpro_hub_up gauge
whatpro_hub_up 1

# HELP whatpro_hub_goroutines Number of goroutines
# TYPE whatpro_hub_goroutines gauge
whatpro_hub_goroutines ` + string(rune(runtime.NumGoroutine())) + `
`

	return c.SendString(metrics)
}

// getMemStats returns memory statistics
func getMemStats() fiber.Map {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return fiber.Map{
		"alloc_mb":       m.Alloc / 1024 / 1024,
		"total_alloc_mb": m.TotalAlloc / 1024 / 1024,
		"sys_mb":         m.Sys / 1024 / 1024,
		"num_gc":         m.NumGC,
	}
}
