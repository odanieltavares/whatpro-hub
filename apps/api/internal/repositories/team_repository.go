package repositories

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

var (
	ErrTeamNotFound = errors.New("team not found")
)

type TeamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

func (r *TeamRepository) FindAll(ctx context.Context, filters map[string]interface{}) ([]models.Team, error) {
	var teams []models.Team
	query := r.db.WithContext(ctx)

	if accountID, ok := filters["account_id"]; ok {
		query = query.Where("account_id = ?", accountID)
	}

	err := query.Find(&teams).Error
	return teams, err
}

func (r *TeamRepository) FindByID(ctx context.Context, id uint) (*models.Team, error) {
	var team models.Team
	err := r.db.WithContext(ctx).First(&team, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeamNotFound
		}
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) FindByIDForAccount(ctx context.Context, id uint, accountID int) (*models.Team, error) {
	var team models.Team
	err := r.db.WithContext(ctx).
		Where("id = ? AND account_id = ?", id, accountID).
		First(&team).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeamNotFound
		}
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) Create(ctx context.Context, team *models.Team) error {
	return r.db.WithContext(ctx).Create(team).Error
}

func (r *TeamRepository) Update(ctx context.Context, team *models.Team) error {
	return r.db.WithContext(ctx).Save(team).Error
}

func (r *TeamRepository) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.Team{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	return nil
}

func (r *TeamRepository) DeleteForAccount(ctx context.Context, id uint, accountID int) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND account_id = ?", id, accountID).
		Delete(&models.Team{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	return nil
}

// Membership methods

func (r *TeamRepository) AddMember(ctx context.Context, teamID, userID uint) error {
	member := models.TeamMember{
		TeamID: teamID,
		UserID: userID,
	}
	return r.db.WithContext(ctx).Create(&member).Error
}

func (r *TeamRepository) RemoveMember(ctx context.Context, teamID, userID uint) error {
	return r.db.WithContext(ctx).Where("team_id = ? AND user_id = ?", teamID, userID).Delete(&models.TeamMember{}).Error
}

func (r *TeamRepository) GetMembers(ctx context.Context, teamID uint) ([]models.User, error) {
	var users []models.User
	// Join team_members to get users
	err := r.db.WithContext(ctx).
		Table("users").
		Joins("JOIN team_members ON team_members.user_id = users.id").
		Where("team_members.team_id = ?", teamID).
		Find(&users).Error
	return users, err
}

func (r *TeamRepository) GetMembersForAccount(ctx context.Context, teamID uint, accountID int) ([]models.User, error) {
	var users []models.User
	err := r.db.WithContext(ctx).
		Table("users").
		Joins("JOIN team_members ON team_members.user_id = users.id").
		Joins("JOIN teams ON teams.id = team_members.team_id").
		Where("team_members.team_id = ? AND teams.account_id = ?", teamID, accountID).
		Find(&users).Error
	return users, err
}
