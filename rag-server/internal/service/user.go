package service

import (
	"context"

	"gorm.io/gorm"
	"rag-server/internal/model"
)

var db *gorm.DB

func SetDB(d *gorm.DB) { db = d }

func ListUsers(ctx context.Context) ([]model.User, error) {
	var users []model.User
	if err := db.WithContext(ctx).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
