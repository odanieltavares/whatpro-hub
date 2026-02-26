package errors

import (
	"errors"
	"fmt"
	"net/http"
)

// ErrorCode represents standardized error codes for API responses
type ErrorCode string

const (
	// Authentication errors
	ErrAuthInvalid      ErrorCode = "ERR_AUTH_INVALID"
	ErrAuthExpired      ErrorCode = "ERR_AUTH_EXPIRED"
	ErrAuthMissing      ErrorCode = "ERR_AUTH_MISSING"
	ErrAuthRevoked      ErrorCode = "ERR_AUTH_REVOKED"
	ErrAuthInsufficient ErrorCode = "ERR_AUTH_INSUFFICIENT"

	// Validation errors
	ErrValidation      ErrorCode = "ERR_VALIDATION"
	ErrInvalidInput    ErrorCode = "ERR_INVALID_INPUT"
	ErrMissingRequired ErrorCode = "ERR_MISSING_REQUIRED"

	// Business logic errors
	ErrNotFound          ErrorCode = "ERR_NOT_FOUND"
	ErrConflict          ErrorCode = "ERR_CONFLICT"
	ErrForbidden         ErrorCode = "ERR_FORBIDDEN"
	ErrRateLimitExceeded ErrorCode = "ERR_RATE_LIMIT_EXCEEDED"

	// System errors (do NOT leak details to clients)
	ErrDatabase        ErrorCode = "ERR_INTERNAL"
	ErrInternal        ErrorCode = "ERR_INTERNAL"
	ErrExternalService ErrorCode = "ERR_EXTERNAL_SERVICE"
)

// AppError represents a structured application error
type AppError struct {
	Code       ErrorCode         `json:"code"`
	Message    string            `json:"message"`
	HTTPStatus int               `json:"-"`
	Fields     map[string]string `json:"fields,omitempty"`
	Internal   error             `json:"-"` // Never exposed externally
}

func (e *AppError) Error() string {
	if e.Internal != nil {
		return fmt.Sprintf("%s: %s (internal: %v)", e.Code, e.Message, e.Internal)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// ToJSON returns a safe JSON representation (no internal error leakage)
func (e *AppError) ToJSON() map[string]interface{} {
	response := map[string]interface{}{
		"error":   e.Code,
		"message": e.Message,
	}
	if e.Fields != nil && len(e.Fields) > 0 {
		response["fields"] = e.Fields
	}
	return response
}

// New creates a new AppError
func New(code ErrorCode, message string, status int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: status,
	}
}

// Wrap wraps an internal error (safely hidden from clients)
func Wrap(code ErrorCode, message string, status int, internal error) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: status,
		Internal:   internal,
	}
}

// WithFields adds field-specific errors (for validation)
func (e *AppError) WithFields(fields map[string]string) *AppError {
	e.Fields = fields
	return e
}

// Predefined common errors

func ValidationError(message string, fields map[string]string) *AppError {
	return &AppError{
		Code:       ErrValidation,
		Message:    message,
		HTTPStatus: http.StatusBadRequest,
		Fields:     fields,
	}
}

func NotFoundError(resource string) *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    fmt.Sprintf("%s not found", resource),
		HTTPStatus: http.StatusNotFound,
	}
}

func UnauthorizedError(message string) *AppError {
	return &AppError{
		Code:       ErrAuthInvalid,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

func ForbiddenError(message string) *AppError {
	return &AppError{
		Code:       ErrForbidden,
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

func ConflictError(message string) *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

func InternalError(internal error) *AppError {
	return &AppError{
		Code:       ErrInternal,
		Message:    "An internal error occurred. Please try again later.",
		HTTPStatus: http.StatusInternalServerError,
		Internal:   internal, // Logged internally, never exposed
	}
}

func DatabaseError(internal error) *AppError {
	return &AppError{
		Code:       ErrDatabase,
		Message:    "A database error occurred. Please contact support if this persists.",
		HTTPStatus: http.StatusInternalServerError,
		Internal:   internal,
	}
}

// GetAppError attempts to extract AppError from a generic error
func GetAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}
