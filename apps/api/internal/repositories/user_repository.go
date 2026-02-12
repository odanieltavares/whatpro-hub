package repositories

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"whatpro-hub/internal/models"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user email already exists")
)

// UserRepository interface for user database operations
type UserRepository interface {
	FindAll(ctx context.Context, filters map[string]interface{}) ([]models.User, error)
	FindByID(ctx context.Context, id uint) (*models.User, error)
	FindByIDForAccount(ctx context.Context, id uint, accountID int) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	Create(ctx context.Context, user *models.User) error
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uint) error
	DeleteForAccount(ctx context.Context, id uint, accountID int) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindAll(ctx context.Context, filters map[string]interface{}) ([]models.User, error) {
	var users []models.User
	query := r.db.WithContext(ctx)

	if accountID, ok := filters["account_id"]; ok {
		query = query.Where("account_id = ?", accountID)
	}
	if role, ok := filters["role"]; ok {
		query = query.Where("whatpro_role = ?", role)
	}

	err := query.Find(&users).Error
	return users, err
}

func (r *userRepository) FindByID(ctx context.Context, id uint) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByIDForAccount(ctx context.Context, id uint, accountID int) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("id = ? AND account_id = ?", id, accountID).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	result := r.db.WithContext(ctx).Create(user)
	if result.Error != nil {
		// Check for unique constraint violation (Postgres error code 23505)
		if result.Error.Error() == "ERROR: duplicate key value violates unique constraint \"users_email_key\" (SQLSTATE 23505)" {
			return ErrUserAlreadyExists
		}
		return result.Error
	}
	return nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.User{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *userRepository) DeleteForAccount(ctx context.Context, id uint, accountID int) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND account_id = ?", id, accountID).
		Delete(&models.User{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}
