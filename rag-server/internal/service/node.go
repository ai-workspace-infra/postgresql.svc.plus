package service

import (
	"context"

	"rag-server/internal/model"
)

func ListNodes(ctx context.Context) ([]model.Node, error) {
	var nodes []model.Node
	if err := db.WithContext(ctx).Find(&nodes).Error; err != nil {
		return nil, err
	}
	return nodes, nil
}
