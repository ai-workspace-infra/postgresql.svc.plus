package auth

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// ContextKey 上下文键名
type ContextKey string

const (
	UserIDKey ContextKey = "user_id"
	EmailKey  ContextKey = "email"
	RolesKey  ContextKey = "roles"
)

// UserContext 用户上下文信息
type UserContext struct {
	UserID string   `json:"user_id"`
	Email  string   `json:"email"`
	Roles  []string `json:"roles"`
}

// MiddlewareConfig 中间件配置
type MiddlewareConfig struct {
	AuthClient  *AuthClient
	Cache       *TokenCache
	SkipPaths   []string // 跳过验证的路径
	CacheTTL    time.Duration
}

// DefaultMiddlewareConfig 返回默认中间件配置
func DefaultMiddlewareConfig(authClient *AuthClient) *MiddlewareConfig {
	return &MiddlewareConfig{
		AuthClient: authClient,
		Cache:      NewTokenCache(nil),
		SkipPaths: []string{
			"/healthz",
			"/ping",
			"/api/auth/",
		},
		CacheTTL: 60 * time.Second,
	}
}

// VerifyTokenMiddleware 创建认证中间件
func VerifyTokenMiddleware(cfg *MiddlewareConfig) gin.HandlerFunc {
	// 检查配置
	if cfg == nil || cfg.AuthClient == nil {
		panic("VerifyTokenMiddleware requires a valid AuthClient")
	}

	return func(c *gin.Context) {
		// 检查是否跳过路径
		for _, skipPath := range cfg.SkipPaths {
			if strings.HasPrefix(c.Request.URL.Path, skipPath) {
				c.Next()
				return
			}
		}

		// 获取 Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "missing authorization header",
			})
			c.Abort()
			return
		}

		// 验证 Bearer token 格式
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		token = strings.TrimSpace(token)

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "empty token",
			})
			c.Abort()
			return
		}

		// 尝试从缓存获取验证结果
		var userCtx *UserContext
		cacheKey := token

		if cfg.Cache != nil {
			if cached, found := cfg.Cache.Get(cacheKey); found {
				if cached != nil && cached.Valid {
					userCtx = &UserContext{
						UserID: cached.UserID,
						Email:  cached.Email,
						Roles:  []string{cached.Roles}, // 从字符串转换为字符串数组
					}
				}
			}
		}

		// 如果缓存未命中，调用远程验证
		if userCtx == nil {
			verifyResp, err := cfg.AuthClient.VerifyToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":   "unauthorized",
					"message": "token verification failed",
					"detail":  err.Error(),
				})
				c.Abort()
				return
			}

			// 验证失败
			if !verifyResp.Valid {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":   "unauthorized",
					"message": "invalid or expired token",
				})
				c.Abort()
				return
			}

			// 构建用户上下文
			userCtx = &UserContext{
				UserID: verifyResp.UserID,
				Email:  verifyResp.Email,
				Roles:  parseRoles(verifyResp.Roles),
			}

			// 写入缓存
			if cfg.Cache != nil {
				cfg.Cache.Set(cacheKey, verifyResp)
			}
		}

		// 将用户信息存储到 Gin 上下文
		c.Set(string(UserIDKey), userCtx.UserID)
		c.Set(string(EmailKey), userCtx.Email)
		c.Set(string(RolesKey), userCtx.Roles)

		// 继续处理请求
		c.Next()
	}
}

// parseRoles 解析角色字符串为字符串数组
func parseRoles(rolesStr string) []string {
	if rolesStr == "" {
		return []string{"user"}
	}

	// 支持逗号分隔的角色列表
	roles := strings.Split(rolesStr, ",")
	var result []string
	for _, role := range roles {
		role = strings.TrimSpace(role)
		if role != "" {
			result = append(result, role)
		}
	}

	if len(result) == 0 {
		return []string{"user"}
	}

	return result
}

// GetUserID 从 Gin 上下文获取用户 ID
func GetUserID(c *gin.Context) string {
	if value, exists := c.Get(string(UserIDKey)); exists {
		if userID, ok := value.(string); ok {
			return userID
		}
	}
	return ""
}

// GetEmail 从 Gin 上下文获取邮箱
func GetEmail(c *gin.Context) string {
	if value, exists := c.Get(string(EmailKey)); exists {
		if email, ok := value.(string); ok {
			return email
		}
	}
	return ""
}

// GetRoles 从 Gin 上下文获取角色列表
func GetRoles(c *gin.Context) []string {
	if value, exists := c.Get(string(RolesKey)); exists {
		if roles, ok := value.([]string); ok {
			return roles
		}
	}
	return nil
}

// RequireRole 检查用户角色
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := GetRoles(c)
		if len(roles) == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "forbidden",
				"message": "no roles found",
			})
			c.Abort()
			return
		}

		// 检查是否包含所需角色
		for _, role := range roles {
			if role == requiredRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":        "forbidden",
			"message":      "insufficient permissions",
			"required_role": requiredRole,
		})
		c.Abort()
	}
}

// RequireAnyRole 检查用户是否具有任一角色
func RequireAnyRole(allowedRoles ...string) gin.HandlerFunc {
	if len(allowedRoles) == 0 {
		panic("RequireAnyRole requires at least one role")
	}

	return func(c *gin.Context) {
		roles := GetRoles(c)
		if len(roles) == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "forbidden",
				"message": "no roles found",
			})
			c.Abort()
			return
		}

		// 检查是否包含任一允许的角色
		for _, role := range roles {
			for _, allowed := range allowedRoles {
				if role == allowed {
					c.Next()
					return
				}
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":           "forbidden",
			"message":         "insufficient permissions",
			"required_roles":  allowedRoles,
		})
		c.Abort()
	}
}

// HealthCheckHandler 健康检查处理器
func HealthCheckHandler(authClient *AuthClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if authClient == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":  "degraded",
				"message": "auth client not configured",
			})
			return
		}

		if err := authClient.HealthCheck(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":  "degraded",
				"message": "auth service unavailable",
				"detail":  err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "auth service healthy",
		})
	}
}
