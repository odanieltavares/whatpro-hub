// Package chatwoot provides a client for the Chatwoot API
package chatwoot

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is the Chatwoot API client
type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

// New creates a new Chatwoot client
func New(baseURL, apiKey string) *Client {
	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// User represents a Chatwoot user
type User struct {
	ID                 int    `json:"id"`
	AccountID          int    `json:"account_id"`
	Email              string `json:"email"`
	Name               string `json:"name"`
	AvatarURL          string `json:"avatar_url"`
	Role               string `json:"role"`
	AvailabilityStatus string `json:"availability_status"`
}

// Account represents a Chatwoot account
type Account struct {
	ID           int               `json:"id"`
	Name         string            `json:"name"`
	Locale       string            `json:"locale"`
	Domain       string            `json:"domain"`
	SupportEmail string            `json:"support_email"`
	Status       string            `json:"status"`
	Features     map[string]bool   `json:"features"`
}

// Team represents a Chatwoot team
type Team struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	AllowAutoAssign bool   `json:"allow_auto_assign"`
	AccountID       int    `json:"account_id"`
}

// Inbox represents a Chatwoot inbox
type Inbox struct {
	ID               int    `json:"id"`
	Name             string `json:"name"`
	ChannelType      string `json:"channel_type"`
	WebsiteURL       string `json:"website_url"`
	WelcomeTitle     string `json:"welcome_title"`
	EnableAutoAssign bool   `json:"enable_auto_assign"`
}

// Label represents a Chatwoot label
type Label struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Color       string `json:"color"`
	ShowOnSidebar bool `json:"show_on_sidebar"`
}

// ValidateToken validates the API token and returns user info
func (c *Client) ValidateToken() (*User, error) {
	resp, err := c.doRequest("GET", "/api/v1/profile", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token: status %d", resp.StatusCode)
	}

	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &user, nil
}

// ListAccounts returns all accounts the user has access to
func (c *Client) ListAccounts() ([]Account, error) {
	resp, err := c.doRequest("GET", "/api/v1/accounts", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var accounts []Account
	if err := json.NewDecoder(resp.Body).Decode(&accounts); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return accounts, nil
}

// GetAccount returns a specific account
func (c *Client) GetAccount(accountID int) (*Account, error) {
	endpoint := fmt.Sprintf("/api/v1/accounts/%d", accountID)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var account Account
	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &account, nil
}

// ListTeams returns all teams for an account
func (c *Client) ListTeams(accountID int) ([]Team, error) {
	endpoint := fmt.Sprintf("/api/v1/accounts/%d/teams", accountID)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var teams []Team
	if err := json.NewDecoder(resp.Body).Decode(&teams); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return teams, nil
}

// ListAgents returns all agents for an account
func (c *Client) ListAgents(accountID int) ([]User, error) {
	endpoint := fmt.Sprintf("/api/v1/accounts/%d/agents", accountID)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var agents []User
	if err := json.NewDecoder(resp.Body).Decode(&agents); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return agents, nil
}

// ListInboxes returns all inboxes for an account
func (c *Client) ListInboxes(accountID int) ([]Inbox, error) {
	endpoint := fmt.Sprintf("/api/v1/accounts/%d/inboxes", accountID)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var response struct {
		Payload []Inbox `json:"payload"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Payload, nil
}

// ListLabels returns all labels for an account
func (c *Client) ListLabels(accountID int) ([]Label, error) {
	endpoint := fmt.Sprintf("/api/v1/accounts/%d/labels", accountID)
	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var response struct {
		Payload []Label `json:"payload"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Payload, nil
}

// doRequest performs an HTTP request
func (c *Client) doRequest(method, endpoint string, body io.Reader) (*http.Response, error) {
	url := c.BaseURL + endpoint

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("api_access_token", c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	return c.HTTPClient.Do(req)
}
