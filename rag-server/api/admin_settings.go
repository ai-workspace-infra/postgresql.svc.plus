package api

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"rag-server/internal/service"
)

var allowedRoles = map[string]struct{}{
	"admin":    {},
	"operator": {},
	"user":     {},
}

func registerAdminSettingRoutes(r *gin.RouterGroup) {
	admin := r.Group("/admin")
	admin.GET("/settings", getAdminSettings)
	admin.POST("/settings", updateAdminSettings)
}

func getAdminSettings(c *gin.Context) {
	if !requireAdminOrOperator(c) {
		return
	}
	settings, err := service.GetAdminSettings(c.Request.Context())
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrServiceDBNotInitialized) {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"version": settings.Version,
		"matrix":  settings.Matrix,
	})
}

func updateAdminSettings(c *gin.Context) {
	if !requireAdminOrOperator(c) {
		return
	}
	var req struct {
		Version uint                       `json:"version"`
		Matrix  map[string]map[string]bool `json:"matrix"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	normalized, err := normalizeMatrix(req.Matrix)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := service.SaveAdminSettings(c.Request.Context(), service.AdminSettings{
		Version: req.Version,
		Matrix:  normalized,
	})
	if err != nil {
		if errors.Is(err, service.ErrAdminSettingsVersionConflict) {
			c.JSON(http.StatusConflict, gin.H{
				"error":   err.Error(),
				"version": updated.Version,
				"matrix":  updated.Matrix,
			})
			return
		}
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrServiceDBNotInitialized) {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"version": updated.Version,
		"matrix":  updated.Matrix,
	})
}

func normalizeMatrix(in map[string]map[string]bool) (map[string]map[string]bool, error) {
	if in == nil {
		return make(map[string]map[string]bool), nil
	}
	out := make(map[string]map[string]bool, len(in))
	for module, roles := range in {
		moduleKey := strings.TrimSpace(module)
		if moduleKey == "" {
			return nil, errors.New("module key cannot be empty")
		}
		if roles == nil {
			out[moduleKey] = make(map[string]bool)
			continue
		}
		normalizedRoles := make(map[string]bool, len(roles))
		for role, enabled := range roles {
			key := strings.ToLower(strings.TrimSpace(role))
			if key == "" {
				return nil, errors.New("role cannot be empty")
			}
			if _, ok := allowedRoles[key]; !ok {
				return nil, errors.New("unsupported role: " + role)
			}
			normalizedRoles[key] = enabled
		}
		out[moduleKey] = normalizedRoles
	}
	return out, nil
}

func requireAdminOrOperator(c *gin.Context) bool {
	role := strings.ToLower(strings.TrimSpace(c.GetHeader("X-User-Role")))
	if role == "" {
		role = strings.ToLower(strings.TrimSpace(c.GetHeader("X-Role")))
	}
	if role == "admin" || role == "operator" {
		return true
	}
	c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	return false
}
