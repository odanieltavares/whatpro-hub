// Package models contains helper types for database models
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"github.com/lib/pq"
)

// JSON is a custom type for JSONB columns
type JSON map[string]interface{}

// Value implements driver.Valuer
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements sql.Scanner
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, j)
}

// StringArray is a custom type for text[] columns
type StringArray []string

// Value implements driver.Valuer
func (a StringArray) Value() (driver.Value, error) {
	return pq.Array(a).Value()
}

// Scan implements sql.Scanner
func (a *StringArray) Scan(value interface{}) error {
	return pq.Array(a).Scan(value)
}
