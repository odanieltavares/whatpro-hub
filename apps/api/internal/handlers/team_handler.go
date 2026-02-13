package handlers

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

// CreateTeamRequest defines parameters for creating a team
type CreateTeamRequest struct {
	Name            string `json:"name" validate:"required"`
	Description     string `json:"description"`
	AllowAutoAssign *bool  `json:"allow_auto_assign"`
}

// UpdateTeamRequest defines parameters for updating a team
type UpdateTeamRequest struct {
	Name            *string `json:"name"`
	Description     *string `json:"description"`
	AllowAutoAssign *bool   `json:"allow_auto_assign"`
}

// AddTeamMemberRequest defines parameters for adding a team member
type AddTeamMemberRequest struct {
	UserID uint `json:"user_id" validate:"required"`
}

// ListTeams handles listing teams for an account
// @Summary List teams
// @Description Get a list of teams for a specific account
// @Tags Teams
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /accounts/{accountId}/teams [get]
func (h *Handler) ListTeams(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	filters := map[string]interface{}{
		"account_id": accountID,
	}

	teams, err := h.TeamService.ListTeams(c.Context(), filters)
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch teams")
	}

	return h.Success(c, fiber.Map{
		"teams": teams,
		"total": len(teams),
	})
}

// GetTeam handles fetching a single team
// @Summary Get team details
// @Description Get details of a specific team
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /teams/{id} [get]
func (h *Handler) GetTeam(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	team, err := h.TeamService.GetTeam(c.Context(), accountID, uint(id))
	if err != nil {
		if err == repositories.ErrTeamNotFound {
			return h.Error(c, fiber.StatusNotFound, "Team not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch team")
	}

	return h.Success(c, fiber.Map{
		"team": team,
	})
}

// CreateTeam handles creating a new team
// @Summary Create team
// @Description Create a new team in the account
// @Tags Teams
// @Accept json
// @Produce json
// @Param accountId path int true "Account ID"
// @Param team body CreateTeamRequest true "Team Data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{} "Quota Exceeded"
// @Router /accounts/{accountId}/teams [post]
func (h *Handler) CreateTeam(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	var req CreateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.Validate(c, &req); err != nil {
		return err
	}

	// CHECK ENTITLEMENTS (Quota)
	if err := h.EntitlementsService.CanCreateResource(accountID, "team"); err != nil {
		return h.Error(c, fiber.StatusForbidden, err.Error())
	}

	team := &models.Team{
		AccountID:   accountID,
		Name:        req.Name,
		Description: req.Description,
	}
	if req.AllowAutoAssign != nil {
		team.AllowAutoAssign = *req.AllowAutoAssign
	} else {
		team.AllowAutoAssign = true // Default
	}

	if err := h.TeamService.CreateTeam(c.Context(), team); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to create team")
	}

	h.AuditCreate(c, "team", fmt.Sprintf("%d", team.ID), team)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"team":    team,
	})
}

// UpdateTeam handles updating a team
// @Summary Update team
// @Description Update team details
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Param team body UpdateTeamRequest true "Update Data"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /teams/{id} [put]
func (h *Handler) UpdateTeam(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	var req UpdateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.AllowAutoAssign != nil {
		updates["allow_auto_assign"] = *req.AllowAutoAssign
	}

	if err := h.TeamService.UpdateTeam(c.Context(), accountID, uint(id), updates); err != nil {
		if err == repositories.ErrTeamNotFound {
			return h.Error(c, fiber.StatusNotFound, "Team not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to update team")
	}

	// Fetch updated team for response
	team, _ := h.TeamService.GetTeam(c.Context(), accountID, uint(id))

	h.AuditUpdate(c, "team", fmt.Sprintf("%d", id), nil, updates)

	return h.Success(c, fiber.Map{
		"team": team,
	})
}

// DeleteTeam handles deleting a team
// @Summary Delete team
// @Description Remove a team from the account
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /teams/{id} [delete]
func (h *Handler) DeleteTeam(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	if err := h.TeamService.DeleteTeam(c.Context(), accountID, uint(id)); err != nil {
		if err == repositories.ErrTeamNotFound {
			return h.Error(c, fiber.StatusNotFound, "Team not found")
		}
		return h.Error(c, fiber.StatusInternalServerError, "Failed to delete team")
	}

	h.AuditDelete(c, "team", fmt.Sprintf("%d", id), nil)

	return h.Success(c, fiber.Map{
		"message": "Team deleted successfully",
	})
}

// ListTeamMembers lists users in a team
// @Summary List team members
// @Description Get users assigned to a team
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Success 200 {object} map[string]interface{}
// @Router /teams/{id}/members [get]
func (h *Handler) ListTeamMembers(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	id, err := c.ParamsInt("id")
	if err != nil || id < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	members, err := h.TeamService.GetTeamMembers(c.Context(), accountID, uint(id))
	if err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to fetch team members")
	}

	return h.Success(c, fiber.Map{
		"members": members,
		"total":   len(members),
	})
}

// AddTeamMember adds a user to a team
// @Summary Add team member
// @Description Assign a user to a team
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Param member body AddTeamMemberRequest true "Member Data"
// @Success 200 {object} map[string]interface{}
// @Router /teams/{id}/members [post]
func (h *Handler) AddTeamMember(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	teamID, err := c.ParamsInt("id")
	if err != nil || teamID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	var req AddTeamMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return h.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.TeamService.AddTeamMember(c.Context(), accountID, uint(teamID), req.UserID); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to add team member")
	}

	h.AuditCreate(c, "team_member", fmt.Sprintf("%d:%d", teamID, req.UserID), nil)

	return h.Success(c, fiber.Map{
		"message": "Member added successfully",
	})
}

// RemoveTeamMember removes a user from a team
// @Summary Remove team member
// @Description Unassign a user from a team
// @Tags Teams
// @Accept json
// @Produce json
// @Param id path int true "Team ID"
// @Param userId path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Router /teams/{id}/members/{userId} [delete]
func (h *Handler) RemoveTeamMember(c *fiber.Ctx) error {
	accountID, err := c.ParamsInt("accountId")
	if err != nil || accountID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid account ID")
	}

	teamID, err := c.ParamsInt("id")
	if err != nil || teamID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid team ID")
	}

	userIDStr := c.Params("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil || userID < 1 {
		return h.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	if err := h.TeamService.RemoveTeamMember(c.Context(), accountID, uint(teamID), uint(userID)); err != nil {
		return h.Error(c, fiber.StatusInternalServerError, "Failed to remove team member")
	}

	h.AuditDelete(c, "team_member", fmt.Sprintf("%d:%d", teamID, userID), nil)

	return h.Success(c, fiber.Map{
		"message": "Member removed successfully",
	})
}
