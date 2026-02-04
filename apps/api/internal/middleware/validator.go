// Package middleware provides HTTP middleware for the API
package middleware

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// Validator is the package-level validator instance
var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())

	// Register custom validators
	_ = validate.RegisterValidation("uuid", validateUUID)
	_ = validate.RegisterValidation("phone", validatePhone)
	_ = validate.RegisterValidation("whatpro_role", validateWhatproRole)
	_ = validate.RegisterValidation("chatwoot_role", validateChatwootRole)
	_ = validate.RegisterValidation("provider_type", validateProviderType)
}

// GetValidator returns the singleton validator instance
func GetValidator() *validator.Validate {
	return validate
}

// ValidationError represents a single field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(s interface{}) []ValidationError {
	var errors []ValidationError

	err := validate.Struct(s)
	if err != nil {
		for _, e := range err.(validator.ValidationErrors) {
			errors = append(errors, ValidationError{
				Field:   toSnakeCase(e.Field()),
				Message: formatValidationMessage(e),
			})
		}
	}

	return errors
}

// ============================================================================
// Custom Validators
// ============================================================================

// validateUUID validates that a string is a valid UUID v4
func validateUUID(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true // Let 'required' handle empty check
	}
	_, err := uuid.Parse(value)
	return err == nil
}

// validatePhone validates E.164 phone number format
// Example: +5511999999999
func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	if phone == "" {
		return true // Let 'required' handle empty check
	}
	// E.164: starts with +, followed by 1-15 digits
	match, _ := regexp.MatchString(`^\+[1-9]\d{1,14}$`, phone)
	return match
}

// validateWhatproRole validates WhatPro role values
func validateWhatproRole(fl validator.FieldLevel) bool {
	role := fl.Field().String()
	validRoles := []string{"super_admin", "admin", "supervisor", "agent"}
	for _, r := range validRoles {
		if role == r {
			return true
		}
	}
	return false
}

// validateChatwootRole validates Chatwoot role values
func validateChatwootRole(fl validator.FieldLevel) bool {
	role := fl.Field().String()
	validRoles := []string{"administrator", "agent"}
	for _, r := range validRoles {
		if role == r {
			return true
		}
	}
	return false
}

// validateProviderType validates WhatsApp provider types
func validateProviderType(fl validator.FieldLevel) bool {
	providerType := fl.Field().String()
	validTypes := []string{"evolution", "uazapi", "baileys", "wppconnect"}
	for _, t := range validTypes {
		if providerType == t {
			return true
		}
	}
	return false
}

// ============================================================================
// Helper Functions
// ============================================================================

// formatValidationMessage creates a human-readable error message
func formatValidationMessage(e validator.FieldError) string {
	field := toSnakeCase(e.Field())

	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return "Invalid email format"
	case "url":
		return "Must be a valid URL"
	case "min":
		return fmt.Sprintf("Must be at least %s characters", e.Param())
	case "max":
		return fmt.Sprintf("Must be at most %s characters", e.Param())
	case "len":
		return fmt.Sprintf("Must be exactly %s characters", e.Param())
	case "uuid":
		return "Must be a valid UUID"
	case "phone":
		return "Must be a valid phone number (E.164 format, e.g., +5511999999999)"
	case "whatpro_role":
		return "Must be one of: super_admin, admin, supervisor, agent"
	case "chatwoot_role":
		return "Must be one of: administrator, agent"
	case "provider_type":
		return "Must be one of: evolution, uazapi, baileys, wppconnect"
	case "oneof":
		return fmt.Sprintf("Must be one of: %s", e.Param())
	case "gte":
		return fmt.Sprintf("Must be greater than or equal to %s", e.Param())
	case "lte":
		return fmt.Sprintf("Must be less than or equal to %s", e.Param())
	case "gt":
		return fmt.Sprintf("Must be greater than %s", e.Param())
	case "lt":
		return fmt.Sprintf("Must be less than %s", e.Param())
	case "alphanum":
		return "Must contain only letters and numbers"
	case "numeric":
		return "Must be a number"
	default:
		return fmt.Sprintf("Invalid value for %s", field)
	}
}

// toSnakeCase converts CamelCase to snake_case
func toSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
