package middleware

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
)

// TestStruct represents a struct for testing validation rules
type TestStruct struct {
	ID           string `validate:"required,uuid"`
	Provider     string `validate:"required,provider_type"`
	Role         string `validate:"omitempty,whatpro_role"`
	ChatwootRole string `validate:"omitempty,chatwoot_role"`
	Phone        string `validate:"omitempty,phone"`
}

func TestValidator(t *testing.T) {
	v := GetValidator()

	tests := []struct {
		name    string
		input   TestStruct
		wantErr bool
		errTag  string // expected failure tag
	}{
		{
			name: "Valid Input",
			input: TestStruct{
				ID:       "550e8400-e29b-41d4-a716-446655440000",
				Provider: "evolution",
				Role:     "admin",
				Phone:    "+5511999999999",
			},
			wantErr: false,
		},
		{
			name: "Invalid UUID",
			input: TestStruct{
				ID:       "invalid-uuid",
				Provider: "evolution",
			},
			wantErr: true,
			errTag:  "uuid",
		},
		{
			name: "Invalid Provider Type",
			input: TestStruct{
				ID:       "550e8400-e29b-41d4-a716-446655440000",
				Provider: "fake_provider",
			},
			wantErr: true,
			errTag:  "provider_type",
		},
		{
			name: "Invalid Role",
			input: TestStruct{
				ID:       "550e8400-e29b-41d4-a716-446655440000",
				Provider: "evolution",
				Role:     "hacker",
			},
			wantErr: true,
			errTag:  "whatpro_role",
		},
		{
			name: "Valid Phone E.164",
			input: TestStruct{
				ID:       "550e8400-e29b-41d4-a716-446655440000",
				Provider: "evolution",
				Phone:    "+14155552671",
			},
			wantErr: false,
		},
		{
			name: "Invalid Phone Format",
			input: TestStruct{
				ID:       "550e8400-e29b-41d4-a716-446655440000",
				Provider: "evolution",
				Phone:    "12345", // Missing + and too short
			},
			wantErr: true,
			errTag:  "phone",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.Struct(tt.input)
			if tt.wantErr {
				assert.Error(t, err)
				validationErrors, ok := err.(validator.ValidationErrors)
				assert.True(t, ok, "Error should be of type ValidationErrors")
				if ok && len(validationErrors) > 0 {
					assert.Equal(t, tt.errTag, validationErrors[0].Tag())
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
