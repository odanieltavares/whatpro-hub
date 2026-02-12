package services

import (
	"context"
	
	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

type TeamService struct {
	repo     *repositories.TeamRepository
	userRepo repositories.UserRepository
}

func NewTeamService(repo *repositories.TeamRepository, userRepo repositories.UserRepository) *TeamService {
	return &TeamService{repo: repo, userRepo: userRepo}
}

func (s *TeamService) ListTeams(ctx context.Context, filters map[string]interface{}) ([]models.Team, error) {
	return s.repo.FindAll(ctx, filters)
}

func (s *TeamService) GetTeam(ctx context.Context, accountID int, id uint) (*models.Team, error) {
	return s.repo.FindByIDForAccount(ctx, id, accountID)
}

func (s *TeamService) CreateTeam(ctx context.Context, team *models.Team) error {
	// Add business logic here if needed (e.g., duplicate name check in account)
	return s.repo.Create(ctx, team)
}

func (s *TeamService) UpdateTeam(ctx context.Context, accountID int, id uint, updates map[string]interface{}) error {
	team, err := s.repo.FindByIDForAccount(ctx, id, accountID)
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

func (s *TeamService) DeleteTeam(ctx context.Context, accountID int, id uint) error {
	return s.repo.DeleteForAccount(ctx, id, accountID)
}

func (s *TeamService) AddTeamMember(ctx context.Context, accountID int, teamID, userID uint) error {
	// Ensure team and user belong to account
	if _, err := s.repo.FindByIDForAccount(ctx, teamID, accountID); err != nil {
		return err
	}
	if _, err := s.userRepo.FindByIDForAccount(ctx, userID, accountID); err != nil {
		return err
	}
	return s.repo.AddMember(ctx, teamID, userID)
}

func (s *TeamService) RemoveTeamMember(ctx context.Context, accountID int, teamID, userID uint) error {
	if _, err := s.repo.FindByIDForAccount(ctx, teamID, accountID); err != nil {
		return err
	}
	if _, err := s.userRepo.FindByIDForAccount(ctx, userID, accountID); err != nil {
		return err
	}
	return s.repo.RemoveMember(ctx, teamID, userID)
}

func (s *TeamService) GetTeamMembers(ctx context.Context, accountID int, teamID uint) ([]models.User, error) {
	return s.repo.GetMembersForAccount(ctx, teamID, accountID)
}
