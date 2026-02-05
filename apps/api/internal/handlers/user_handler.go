package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// ListUsers handles listing users for an account
func (h *Handler) ListUsers(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	filters := map[string]interface{}{
		"account_id": accountID,
	}

	// Optional filters
	if role := c.Query("role"); role != "" {
		filters["role"] = role
	}

	users, err := h.UserService.ListUsers(c.Context(), filters)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch users")
	}

	return h.Success(c, fiber.Map{
		"users": users,
		"total": len(users),
	})
}

// GetUser handles fetching a single user
func (h *Handler) GetUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	user, err := h.UserService.GetUser(c.Context(), uint(id))
	if err != nil {
		if err == repositories.ErrUserNotFound {
			return h.Error(c, fiber.StatusNotFound, "User not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch user")
	}

	return h.Success(c, fiber.Map{
		"user": user,
	})
}

// CreateUser handles creating a new user
func (h *Handler) CreateUser(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	var req struct {
		Name        string `json:"name" validate:"required"`
		Email       string `json:"email" validate:"required,email"`
		Password    string `json:"password" validate:"required,min=8"` // Note: Auth logic might be separate
		WhatproRole string `json:"whatpro_role" validate:"required,oneof=agent admin super_admin"`
	}

	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	// CHECK ENTITLEMENTS (Quota)
	if err := h.EntitlementsService.CanCreateResource(accountID, "agent"); err != nil {
		return h.Error(c, fiber.StatusForbidden, err.Error())
	}

	user := &models.User{
		AccountID:   accountID,
		Name:        req.Name,
		Email:       req.Email,
		WhatproRole: req.WhatproRole,
		// Note: Password handling should be added if not using SSO only
	}

	if err := h.UserService.CreateUser(c.Context(), user); err != nil {
		if err == repositories.ErrUserAlreadyExists {
			return h.Error(c, fiber.StatusConflict, "User with this email already exists")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create user")
	}

	h.AuditCreate(c, "user", fmt.Sprintf("%d", user.ID), user)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"user":    user,
	})
}

// UpdateUser handles updating a user
func (h *Handler) UpdateUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	var req struct {
		Name               *string `json:"name"`
		Email              *string `json:"email" validate:"omitempty,email"`
		WhatproRole        *string `json:"whatpro_role" validate:"omitempty,oneof=agent admin super_admin"`
		AvailabilityStatus *string `json:"availability_status" validate:"omitempty,oneof=online offline busy"`
	}

	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.WhatproRole != nil {
		updates["whatpro_role"] = *req.WhatproRole
	}
	if req.AvailabilityStatus != nil {
		updates["availability_status"] = *req.AvailabilityStatus
	}

	if err := h.UserService.UpdateUser(c.Context(), uint(id), updates); err != nil {
		if err == repositories.ErrUserNotFound {
			return h.Error(c, fiber.StatusNotFound, "User not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update user")
	}

	// Fetch updated user
	user, _ := h.UserService.GetUser(c.Context(), uint(id))

	h.AuditUpdate(c, "user", fmt.Sprintf("%d", id), nil, updates)

	return h.Success(c, fiber.Map{
		"user": user,
	})
}

// DeleteUser handles deleting a user
func (h *Handler) DeleteUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	if err := h.UserService.DeleteUser(c.Context(), uint(id)); err != nil {
		if err == repositories.ErrUserNotFound {
			return h.Error(c, fiber.StatusNotFound, "User not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete user")
	}

	h.AuditDelete(c, "user", fmt.Sprintf("%d", id), nil)

	return h.Success(c, fiber.Map{
		"message": "User deleted successfully",
	})
}
