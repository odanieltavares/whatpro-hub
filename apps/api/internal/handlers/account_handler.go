package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// ListAccountsRequest defines parameters for listing accounts
type ListAccountsRequest struct {
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
	Status string `query:"status"`
}

// CreateAccountRequest defines parameters for creating an account
type CreateAccountRequest struct {
	ChatwootID   int    `json:"chatwoot_id" validate:"required"`
	Name         string `json:"name" validate:"required"`
	Locale       string `json:"locale"`
	Domain       string `json:"domain"`
	SupportEmail string `json:"support_email" validate:"omitempty,email"`
}

// UpdateAccountRequest defines parameters for updating an account
type UpdateAccountRequest struct {
	Name         *string      `json:"name"`
	Locale       *string      `json:"locale"`
	Domain       *string      `json:"domain"`
	SupportEmail *string      `json:"support_email" validate:"omitempty,email"`
	Status       *string      `json:"status"`
	Features     *models.JSON `json:"features"`
	Settings     *models.JSON `json:"settings"`
}

// ListAccounts handles listing all accounts (super admin)
// @Summary List all accounts
// @Description Get a paginated list of all accounts (Super Admin only)
// @Tags Accounts
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param status query string false "Filter by status"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /accounts [get]
func (h *Handler) ListAccounts(c *fiber.Ctx) error {
	var req ListAccountsRequest
	if err := c.QueryParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid query parameters")
	}

	// Set defaults
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 || req.Limit > 100 {
		req.Limit = 20
	}

	// Build filters
	filters := make(map[string]interface{})
	if req.Status != "" {
		filters["status"] = req.Status
	}

	accounts, err := h.AccountService.ListAccounts(c.Context(), filters)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch accounts")
	}

	// Simple pagination (TODO: implement proper offset/limit in repository)
	start := (req.Page - 1) * req.Limit
	end := start + req.Limit
	
	if start > len(accounts) {
		accounts = []models.Account{}
	} else {
		if end > len(accounts) {
			end = len(accounts)
		}
		accounts = accounts[start:end]
	}

	return h.Success(c, fiber.Map{
		"accounts": accounts,
		"page":     req.Page,
		"limit":    req.Limit,
		"total":    len(accounts),
	})
}

// GetAccount handles fetching a single account
// @Summary Get account details
// @Description Get details of a specific account
// @Tags Accounts
// @Accept json
// @Produce json
// @Param id path int true "Account ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /accounts/{id} [get]
func (h *Handler) GetAccount(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	account, err := h.AccountService.GetAccount(c.Context(), uint(id))
	if err != nil {
		if err == repositories.ErrAccountNotFound {
			return h.Error(c, fiber.StatusNotFound, "Account not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch account")
	}

	// Get account stats
	stats, err := h.AccountService.GetAccountStats(c.Context(), uint(id))
	if err != nil {
		// Log error but continue
		h.Logger.Printf("Failed to get account stats: %v", err)
		stats = nil
	}

	return h.Success(c, fiber.Map{
		"account": account,
		"stats":   stats,
	})
}

// CreateAccount handles creating a new account manually
// @Summary Create account
// @Description Create a new account manually (Super Admin)
// @Tags Accounts
// @Accept json
// @Produce json
// @Param account body CreateAccountRequest true "Account Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Router /accounts [post]
func (h *Handler) CreateAccount(c *fiber.Ctx) error {
	var req CreateAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := h.Validate(c, &req); err != nil {
		return err
	}

	account := &models.Account{
		ChatwootID:   req.ChatwootID,
		Name:         req.Name,
		Locale:       req.Locale,
		Domain:       req.Domain,
		SupportEmail: req.SupportEmail,
	}

	if err := h.AccountService.CreateAccount(c.Context(), account); err != nil {
		if err == repositories.ErrAccountAlreadyExists {
			return h.Error(c, fiber.StatusConflict, "Account already exists")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create account")
	}

	// Audit log
	h.AuditCreate(c, "account", fmt.Sprintf("%d", account.ID), account)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"account": account,
	})
}

// UpdateAccount handles updating an account
// @Summary Update account
// @Description Update account details (Admin/Super Admin)
// @Tags Accounts
// @Accept json
// @Produce json
// @Param id path int true "Account ID"
// @Param account body UpdateAccountRequest true "Update Data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /accounts/{id} [put]
func (h *Handler) UpdateAccount(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	var req UpdateAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := h.Validate(c, &req); err != nil {
		return err
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Locale != nil {
		updates["locale"] = *req.Locale
	}
	if req.Domain != nil {
		updates["domain"] = *req.Domain
	}
	if req.SupportEmail != nil {
		updates["support_email"] = *req.SupportEmail
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Features != nil {
		updates["features"] = *req.Features
	}
	if req.Settings != nil {
		updates["settings"] = *req.Settings
	}

	if err := h.AccountService.UpdateAccount(c.Context(), uint(id), updates); err != nil {
		if err == repositories.ErrAccountNotFound {
			return h.Error(c, fiber.StatusNotFound, "Account not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update account")
	}

	// Fetch updated account
	account, _ := h.AccountService.GetAccount(c.Context(), uint(id))

	// Audit log
	h.AuditUpdate(c, "account", fmt.Sprintf("%d", id), nil, updates)

	return h.Success(c, fiber.Map{
		"account": account,
	})
}

// GetAccountStats godoc
// @Summary      Get account dashboard statistics
// @Description  Returns real-time aggregated metrics: active instances, messages today, active clients, workflows triggered
// @Tags         Accounts
// @Produce      json
// @Param        id   path      int  true  "Account ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]interface{}
// @Failure      403  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]interface{}
// @Router       /accounts/{id}/stats [get]
// @Security     BearerAuth
func (h *Handler) GetAccountStats(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id <= 0 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	stats, err := h.StatsService.GetAccountStats(c.Context(), uint(id))
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch account statistics")
	}

	return h.Success(c, stats)
}
