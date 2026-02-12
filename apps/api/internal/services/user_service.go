package services

import (
	"context"

	"whatpro-hub/internal/models"
	"whatpro-hub/internal/repositories"
)

type UserService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) ListUsers(ctx context.Context, filters map[string]interface{}) ([]models.User, error) {
	return s.repo.FindAll(ctx, filters)
}

func (s *UserService) GetUser(ctx context.Context, accountID int, id uint) (*models.User, error) {
	return s.repo.FindByIDForAccount(ctx, id, accountID)
}

func (s *UserService) CreateUser(ctx context.Context, user *models.User) error {
	// Add default values or validation if needed
	if user.AvailabilityStatus == "" {
		user.AvailabilityStatus = "online"
	}
	// TODO: Implement Chatwoot user sync logic here if creating local user implies Chatwoot user creation
	return s.repo.Create(ctx, user)
}

func (s *UserService) UpdateUser(ctx context.Context, accountID int, id uint, updates map[string]interface{}) error {
	user, err := s.repo.FindByIDForAccount(ctx, id, accountID)
	if err != nil {
		return err
	}

	if name, ok := updates["name"].(string); ok {
		user.Name = name
	}
	if email, ok := updates["email"].(string); ok {
		user.Email = email
	}
	if role, ok := updates["whatpro_role"].(string); ok {
		user.WhatproRole = role
	}
	if status, ok := updates["availability_status"].(string); ok {
		user.AvailabilityStatus = status
	}

	// TODO: Implement Chatwoot syncing for updates

	return s.repo.Update(ctx, user)
}

func (s *UserService) DeleteUser(ctx context.Context, accountID int, id uint) error {
	// TODO: Handle Chatwoot deletion logic
	return s.repo.DeleteForAccount(ctx, id, accountID)
}
