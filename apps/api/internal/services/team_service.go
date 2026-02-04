package services

import (
	"context"
	
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

type TeamService struct {
	repo *repositories.TeamRepository
}

func NewTeamService(repo *repositories.TeamRepository) *TeamService {
	return &TeamService{repo: repo}
}

func (s *TeamService) ListTeams(ctx context.Context, filters map[string]interface{}) ([]models.Team, error) {
	return s.repo.FindAll(ctx, filters)
}

func (s *TeamService) GetTeam(ctx context.Context, id uint) (*models.Team, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TeamService) CreateTeam(ctx context.Context, team *models.Team) error {
	// Add business logic here if needed (e.g., duplicate name check in account)
	return s.repo.Create(ctx, team)
}

func (s *TeamService) UpdateTeam(ctx context.Context, id uint, updates map[string]interface{}) error {
	team, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if name, ok := updates["name"].(string); ok {
		team.Name = name
	}
	if description, ok := updates["description"].(string); ok {
		team.Description = description
	}
	if allowAutoAssign, ok := updates["allow_auto_assign"].(bool); ok {
		team.AllowAutoAssign = allowAutoAssign
	}

	return s.repo.Update(ctx, team)
}

func (s *TeamService) DeleteTeam(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func (s *TeamService) AddTeamMember(ctx context.Context, teamID, userID uint) error {
	// Potentially check if user exists or is already in team (repo might handle unique constraint)
	return s.repo.AddMember(ctx, teamID, userID)
}

func (s *TeamService) RemoveTeamMember(ctx context.Context, teamID, userID uint) error {
	return s.repo.RemoveMember(ctx, teamID, userID)
}

func (s *TeamService) GetTeamMembers(ctx context.Context, teamID uint) ([]models.User, error) {
	return s.repo.GetMembers(ctx, teamID)
}
