package middleware

import (
	"html"
	"reflect"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Dangerous patterns that should be sanitized
var (
	sqlInjectionPattern = regexp.MustCompile(`(?i)(union|select|insert|update|delete|drop|create|alter|exec|script|javascript:|onerror=|onload=)`)
	xssPattern          = regexp.MustCompile(`(?i)(<script|<iframe|<object|<embed|javascript:|on\w+\s*=)`)
)

// Sanitizer provides input sanitization middleware
type Sanitizer struct {
	SkipPaths []string // Paths to skip (e.g., /webhooks for external data)
}

// New creates a new input sanitizer
func NewSanitizer() *Sanitizer {
	return &Sanitizer{
		SkipPaths: []string{},
	}
}

// Middleware sanitizes request inputs
func (s *Sanitizer) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Skip whitelisted paths
		for _, skip := range s.SkipPaths {
			if strings.HasPrefix(c.Path(), skip) {
				return c.Next()
			}
		}

		// Sanitize query parameters
		c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
			sanitized := sanitizeString(string(value))
			c.Request().URI().QueryArgs().Set(string(key), sanitized)
		})

		// Note: Body sanitization should be done at the validation layer
		// using struct tags, not here (to preserve JSON structure)

		return c.Next()
	}
}

// sanitizeString removes potentially dangerous characters
func sanitizeString(input string) string {
	// HTML escape to prevent XSS
	sanitized := html.EscapeString(input)

	// Remove null bytes (path traversal prevention)
	sanitized = strings.ReplaceAll(sanitized, "\x00", "")

	// Trim to prevent whitespace attacks
	sanitized = strings.TrimSpace(sanitized)

	return sanitized
}

// SanitizeStruct recursively sanitizes all string fields in a struct using reflection.
// Use this in your validation layer for request bodies.
func SanitizeStruct(data interface{}) {
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		return
	}
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		if !field.CanSet() {
			continue
		}
		switch field.Kind() {
		case reflect.String:
			field.SetString(sanitizeString(field.String()))
		case reflect.Struct:
			SanitizeStruct(field.Addr().Interface())
		case reflect.Ptr:
			if !field.IsNil() {
				SanitizeStruct(field.Interface())
			}
		}
	}
}
