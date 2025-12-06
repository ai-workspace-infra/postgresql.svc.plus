package service

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"rag-server/internal/model"
)

// ErrServiceDBNotInitialized indicates the service database has not been configured.
var ErrServiceDBNotInitialized = errors.New("service db not initialized")

// ErrAdminSettingsVersionConflict is returned when the provided version does not match the stored version.
var ErrAdminSettingsVersionConflict = errors.New("admin settings version conflict")

// AdminSettings holds the permission matrix alongside its version.
type AdminSettings struct {
	Version uint
	Matrix  map[string]map[string]bool
}

// GetAdminSettings returns the persisted permission matrix and its current version.
func GetAdminSettings(ctx context.Context) (AdminSettings, error) {
	if db == nil {
		return AdminSettings{}, ErrServiceDBNotInitialized
	}
	var rows []model.AdminSetting
	if err := db.WithContext(ctx).Order("module_key ASC, role ASC").Find(&rows).Error; err != nil {
		return AdminSettings{}, err
	}
	matrix := make(map[string]map[string]bool)
	var version uint
	for _, row := range rows {
		module := row.ModuleKey
		role := row.Role
		if _, ok := matrix[module]; !ok {
			matrix[module] = make(map[string]bool)
		}
		matrix[module][role] = row.Enabled
		if row.Version > version {
			version = row.Version
		}
	}
	return AdminSettings{Version: version, Matrix: matrix}, nil
}

// SaveAdminSettings replaces the permission matrix if the provided version matches the stored version.
func SaveAdminSettings(ctx context.Context, payload AdminSettings) (AdminSettings, error) {
	if db == nil {
		return AdminSettings{}, ErrServiceDBNotInitialized
	}

	sanitized := cloneMatrix(payload.Matrix)
	result := AdminSettings{Matrix: sanitized}

	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var currentVersion uint
		if err := tx.Model(&model.AdminSetting{}).Select("COALESCE(MAX(version), 0)").Scan(&currentVersion).Error; err != nil {
			return err
		}
		if currentVersion != payload.Version {
			result.Version = currentVersion
			return ErrAdminSettingsVersionConflict
		}
		nextVersion := currentVersion + 1

		if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&model.AdminSetting{}).Error; err != nil {
			return err
		}

		if len(sanitized) > 0 {
			rows := make([]model.AdminSetting, 0)
			for module, roles := range sanitized {
				module = strings.TrimSpace(module)
				for role, enabled := range roles {
					rows = append(rows, model.AdminSetting{
						ModuleKey: module,
						Role:      role,
						Enabled:   enabled,
						Version:   nextVersion,
					})
				}
			}
			if len(rows) > 0 {
				if err := tx.Create(&rows).Error; err != nil {
					return err
				}
			}
		}

		result.Version = nextVersion
		return nil
	})
	if err != nil {
		if errors.Is(err, ErrAdminSettingsVersionConflict) {
			current, getErr := GetAdminSettings(ctx)
			if getErr == nil {
				return current, err
			}
			result.Version = 0
		}
		return result, err
	}
	return result, nil
}

func cloneMatrix(in map[string]map[string]bool) map[string]map[string]bool {
	if len(in) == 0 {
		return make(map[string]map[string]bool)
	}
	out := make(map[string]map[string]bool, len(in))
	for module, roles := range in {
		if roles == nil {
			out[module] = make(map[string]bool)
			continue
		}
		inner := make(map[string]bool, len(roles))
		for role, enabled := range roles {
			inner[role] = enabled
		}
		out[module] = inner
	}
	return out
}
