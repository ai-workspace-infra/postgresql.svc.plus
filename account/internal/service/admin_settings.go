package service

import (
	"context"
	"errors"
	"strings"
	"sync"

	"gorm.io/gorm"

	"account/internal/model"
)

// ErrServiceDBNotInitialized indicates the service database has not been configured.
var ErrServiceDBNotInitialized = errors.New("service db not initialized")

// ErrAdminSettingsVersionConflict is returned when the provided version does not match the stored version.
var ErrAdminSettingsVersionConflict = errors.New("admin settings version conflict")

// AdminSettings holds the permission matrix alongside its version.
type AdminSettings struct {
	Version uint64
	Matrix  map[string]map[string]bool
}

var (
	dbMu  sync.RWMutex
	db    *gorm.DB
	cache = &adminSettingsCache{}
)

// SetDB configures the backing database used by the admin settings service.
func SetDB(d *gorm.DB) {
	dbMu.Lock()
	defer dbMu.Unlock()
	db = d
	cache.invalidate()
}

// GetAdminSettings returns the persisted permission matrix and its current version.
func GetAdminSettings(ctx context.Context) (AdminSettings, error) {
	if cached, ok := cache.get(); ok {
		return cached, nil
	}

	database := currentDB()
	if database == nil {
		return AdminSettings{}, ErrServiceDBNotInitialized
	}

	var rows []model.AdminSetting
	if err := database.WithContext(ctx).Order("module_key ASC, role ASC").Find(&rows).Error; err != nil {
		return AdminSettings{}, err
	}

	matrix := make(map[string]map[string]bool)
	var version uint64
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

	result := AdminSettings{Version: version, Matrix: matrix}
	cache.set(result)
	return result, nil
}

// SaveAdminSettings replaces the permission matrix if the provided version matches the stored version.
func SaveAdminSettings(ctx context.Context, payload AdminSettings) (AdminSettings, error) {
	sanitized := cloneMatrix(payload.Matrix)
	result := AdminSettings{Matrix: sanitized}

	database := currentDB()
	if database == nil {
		return result, ErrServiceDBNotInitialized
	}

	err := database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var currentVersion uint64
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
						ModuleKey:  module,
						Role:       role,
						Enabled:    enabled,
						Version:    nextVersion,
						OriginNode: "local",
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
			cache.invalidate()
			current, getErr := GetAdminSettings(ctx)
			if getErr == nil {
				return current, err
			}
			result.Version = 0
		}
		return result, err
	}

	cache.set(result)
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

func currentDB() *gorm.DB {
	dbMu.RLock()
	defer dbMu.RUnlock()
	return db
}

type adminSettingsCache struct {
	mu      sync.RWMutex
	version uint64
	matrix  map[string]map[string]bool
	loaded  bool
}

func (c *adminSettingsCache) get() (AdminSettings, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if !c.loaded {
		return AdminSettings{}, false
	}
	return AdminSettings{Version: c.version, Matrix: cloneMatrix(c.matrix)}, true
}

func (c *adminSettingsCache) set(settings AdminSettings) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.version = settings.Version
	c.matrix = cloneMatrix(settings.Matrix)
	c.loaded = true
}

func (c *adminSettingsCache) invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.loaded = false
	c.version = 0
	c.matrix = nil
}
