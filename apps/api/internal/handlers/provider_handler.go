package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// ListProvidersRequest defines parameters for listing providers
type ListProvidersRequest struct {
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
	Status string `query:"status"`
	Type   string `query:"type"`
}

// CreateProviderRequest defines parameters for creating a provider
type CreateProviderRequest struct {
	Name           string      `json:"name" validate:"required"`
	Type           string      `json:"type" validate:"required"`
	BaseURL        string      `json:"base_url" validate:"required,url"`
	APIKey         string      `json:"api_key" validate:"required"`
	InstanceName   string      `json:"instance_name"`
	HealthCheckURL string      `json:"health_check_url" validate:"omitempty,url"`
	Metadata       models.JSON `json:"metadata"`
}

// UpdateProviderRequest defines parameters for updating a provider
type UpdateProviderRequest struct {
	Name           *string      `json:"name"`
	Type           *string      `json:"type"`
	BaseURL        *string      `json:"base_url" validate:"omitempty,url"`
	APIKey         *string      `json:"api_key"`
	InstanceName   *string      `json:"instance_name"`
	HealthCheckURL *string      `json:"health_check_url" validate:"omitempty,url"`
	Metadata       *models.JSON `json:"metadata"`
}

// ListProviders handles listing providers for an account
// @Summary List providers
// @Description Get a list of WhatsApp providers for a specific account
// @Tags Providers
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param status query string false "Filter by status"
// @Param type query string false "Filter by type"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /accounts/{accountId}/providers [get]
func (h *Handler) ListProviders(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	var req ListProvidersRequest
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
	filters := map[string]interface{}{
		"account_id": accountID,
	}
	if req.Status != "" {
		filters["status"] = req.Status
	}
	if req.Type != "" {
		filters["type"] = req.Type
	}

	providers, err := h.ProviderService.ListProviders(c.Context(), filters)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch providers")
	}

	return h.Success(c, fiber.Map{
		"providers": providers,
		"page":      req.Page,
		"limit":     req.Limit,
		"total":     len(providers),
	})
}

// GetProvider handles fetching a single provider
// @Summary Get provider details
// @Description Get details of a specific provider
// @Tags Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID (UUID)"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /providers/{id} [get]
func (h *Handler) GetProvider(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	providerID := c.Params("id")
	id, err := uuid.Parse(providerID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid provider ID")
	}

	provider, err := h.ProviderService.GetProvider(c.Context(), accountID, id)
	if err != nil {
		if err == repositories.ErrProviderNotFound {
			return h.Error(c, fiber.StatusNotFound, "Provider not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch provider")
	}

	return h.Success(c, fiber.Map{
		"provider": provider,
	})
}

// CreateProvider handles creating a new provider
// @Summary Create provider
// @Description Create a new WhatsApp provider integration
// @Tags Providers
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param provider body CreateProviderRequest true "Provider Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{} "Quota Exceeded"
// @Router /accounts/{accountId}/providers [post]
func (h *Handler) CreateProvider(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	var req CreateProviderRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := h.Validate(c, &req); err != nil {
		return err
	}

	// CHECK ENTITLEMENTS (Quota)
	if err := h.EntitlementsService.CanCreateResource(accountID, "provider"); err != nil {
		return h.Error(c, fiber.StatusForbidden, err.Error())
	}

	// Validate provider type
	validTypes := map[string]bool{
		"evolution":  true,
		"uazapi":     true,
		"baileys":    true,
		"cloud_api":  true,
	}
	if !validTypes[req.Type] {
		return h.Error(c, fiber.StatusBadRequest, "Invalid provider type. Must be: evolution, uazapi, baileys, or cloud_api")
	}

	provider := &models.Provider{
		AccountID:      accountID,
		Name:           req.Name,
		Type:           req.Type,
		BaseURL:        req.BaseURL,
		InstanceName:   req.InstanceName,
		HealthCheckURL: req.HealthCheckURL,
		Metadata:       req.Metadata,
	}

	if err := h.ProviderService.CreateProvider(c.Context(), provider, req.APIKey); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create provider")
	}

	// Remove encrypted key from response
	provider.APIKeyEncrypted = "[ENCRYPTED]"

	// Audit log
	h.AuditCreate(c, "provider", fmt.Sprintf("%s", provider.ID), provider)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":  true,
		"provider": provider,
	})
}

// UpdateProvider handles updating a provider
// @Summary Update provider
// @Description Update provider details
// @Tags Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID (UUID)"
// @Param provider body UpdateProviderRequest true "Update Data"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /providers/{id} [put]
func (h *Handler) UpdateProvider(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	providerID := c.Params("id")
	id, err := uuid.Parse(providerID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid provider ID")
	}

	var req UpdateProviderRequest
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
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.BaseURL != nil {
		updates["base_url"] = *req.BaseURL
	}
	if req.APIKey != nil {
		updates["api_key"] = *req.APIKey
	}
	if req.InstanceName != nil {
		updates["instance_name"] = *req.InstanceName
	}
	if req.HealthCheckURL != nil {
		updates["health_check_url"] = *req.HealthCheckURL
	}
	if req.Metadata != nil {
		updates["metadata"] = *req.Metadata
	}

	if err := h.ProviderService.UpdateProvider(c.Context(), accountID, id, updates); err != nil {
		if err == repositories.ErrProviderNotFound {
			return h.Error(c, fiber.StatusNotFound, "Provider not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update provider")
	}

	// Fetch updated provider
	provider, _ := h.ProviderService.GetProvider(c.Context(), accountID, id)

	// Audit log
	h.AuditUpdate(c, "provider", fmt.Sprintf("%s", id), nil, updates)

	return h.Success(c, fiber.Map{
		"provider": provider,
	})
}

// DeleteProvider handles deleting a provider
// @Summary Delete provider
// @Description Remove a provider from the account
// @Tags Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID (UUID)"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /providers/{id} [delete]
func (h *Handler) DeleteProvider(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	providerID := c.Params("id")
	id, err := uuid.Parse(providerID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid provider ID")
	}

	if err := h.ProviderService.DeleteProvider(c.Context(), accountID, id); err != nil {
		if err == repositories.ErrProviderNotFound {
			return h.Error(c, fiber.StatusNotFound, "Provider not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete provider")
	}

	// Audit log
	h.AuditDelete(c, "provider", fmt.Sprintf("%s", id), nil)

	return h.Success(c, fiber.Map{
		"message": "Provider deleted successfully",
	})
}

// CheckProviderHealth defines a handler to check provider health
// @Summary Check provider health
// @Description Check if the provider is reachable and active
// @Tags Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID (UUID)"
// @Success 200 {object} map[string]interface{}
// @Router /providers/{id}/health [get]
func (h *Handler) CheckProviderHealth(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	providerID := c.Params("id")
	id, err := uuid.Parse(providerID)
	if err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid provider ID")
	}

	isHealthy, err := h.ProviderService.CheckProviderHealth(c.Context(), accountID, id)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Health check failed")
	}

	status := "disconnected"
	if isHealthy {
		status = "connected"
	}

	return h.Success(c, fiber.Map{
		"provider_id": id,
		"status":      status,
		"healthy":     isHealthy,
		"checked_at":  time.Now().Format(time.RFC3339),
	})
}
