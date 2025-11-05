package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Context keys for storing user information
type contextKey string

const (
	userIDKey   contextKey = "user_id"
	emailKey    contextKey = "email"
	rolesKey    contextKey = "roles"
	serviceKey  contextKey = "service"
	bearerPrefix = "Bearer "
)

// AuthMiddleware is a middleware that validates JWT access tokens
func (s *TokenService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			c.Abort()
			return
		}

		if !strings.HasPrefix(authHeader, bearerPrefix) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, bearerPrefix)

		claims, err := s.ValidateAccessToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
				"detail": err.Error(),
			})
			c.Abort()
			return
		}

		// Verify service claim
		if claims.Service != "rag-server" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "invalid token for this service",
			})
			c.Abort()
			return
		}

		// Store claims in context
		ctx := context.WithValue(c.Request.Context(), userIDKey, claims.UserID)
		ctx = context.WithValue(ctx, emailKey, claims.Email)
		ctx = context.WithValue(ctx, rolesKey, claims.Roles)
		ctx = context.WithValue(ctx, serviceKey, claims.Service)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// RequireRole is a middleware that requires a specific role
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := c.Request.Context().Value(rolesKey)
		if roles == nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "no roles found in token",
			})
			c.Abort()
			return
		}

		roleSlice, ok := roles.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "invalid roles format in token",
			})
			c.Abort()
			return
		}

		for _, r := range roleSlice {
			if r == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "insufficient permissions",
			"required_role": role,
		})
		c.Abort()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) string {
	userID := c.Request.Context().Value(userIDKey)
	if userID == nil {
		return ""
	}
	return userID.(string)
}

// GetEmail extracts email from context
func GetEmail(c *gin.Context) string {
	email := c.Request.Context().Value(emailKey)
	if email == nil {
		return ""
	}
	return email.(string)
}

// GetRoles extracts roles from context
func GetRoles(c *gin.Context) []string {
	roles := c.Request.Context().Value(rolesKey)
	if roles == nil {
		return nil
	}
	return roles.([]string)
}
