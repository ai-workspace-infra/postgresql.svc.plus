package api

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"account/internal/service"
	"account/internal/store"
)

func (h *handler) adminUsersMetrics(c *gin.Context) {
	if h.metricsProvider == nil {
		respondError(c, http.StatusServiceUnavailable, "metrics_unavailable", "user metrics provider is not configured")
		return
	}

	if _, ok := h.requireAdminOrOperator(c); !ok {
		return
	}

	metrics, err := h.metricsProvider.Compute(c.Request.Context())
	if err != nil {
		status := http.StatusInternalServerError
		message := "failed to compute user metrics"
		if errors.Is(err, service.ErrUserRepositoryNotConfigured) || errors.Is(err, service.ErrSubscriptionProviderNotConfigured) {
			status = http.StatusServiceUnavailable
			message = "user metrics dependency is not available"
		}
		respondError(c, status, "metrics_unavailable", message)
		return
	}

	c.JSON(http.StatusOK, metrics)
}

func (h *handler) requireAdminOrOperator(c *gin.Context) (*store.User, bool) {
	token := h.resolveSessionToken(c)
	if token == "" {
		respondError(c, http.StatusUnauthorized, "session_token_required", "session token is required")
		return nil, false
	}

	sess, ok := h.lookupSession(token)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_session", "session not found or expired")
		return nil, false
	}

	user, err := h.store.GetUserByID(c.Request.Context(), sess.userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "session_user_lookup_failed", "failed to load session user")
		return nil, false
	}

	role := strings.ToLower(strings.TrimSpace(user.Role))
	if role != store.RoleAdmin && role != store.RoleOperator {
		respondError(c, http.StatusForbidden, "forbidden", "insufficient permissions")
		return nil, false
	}

	return user, true
}

func (h *handler) resolveSessionToken(c *gin.Context) string {
	token := extractToken(c.GetHeader("Authorization"))
	if token == "" {
		if value := c.Query("token"); value != "" {
			token = value
		}
	}
	if token == "" {
		if cookie, err := c.Cookie(sessionCookieName); err == nil {
			cookie = strings.TrimSpace(cookie)
			if cookie != "" {
				token = cookie
			}
		}
	}
	return strings.TrimSpace(token)
}

func registerAdminRoutes(group *gin.RouterGroup, h *handler) {
	admin := group.Group("/admin")
	admin.GET("/users/metrics", h.adminUsersMetrics)
	admin.GET("/agents/status", h.adminAgentStatus)
}
