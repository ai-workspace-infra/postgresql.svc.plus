package auth

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

// 示例：在业务路由中使用认证中间件
func ExampleRequireRole() {
	// 创建认证客户端
	authConfig := DefaultConfig()
	authConfig.AuthURL = "https://accounts.svc.plus"
	authConfig.PublicToken = "xcontrol-public-token-2025"

	client := NewAuthClient(authConfig)

	// 创建中间件配置
	middlewareConfig := DefaultMiddlewareConfig(client)

	// 创建 Gin 路由器
	r := gin.Default()

	// 需要认证的路由
	authorized := r.Group("/api/v1")
	authorized.Use(VerifyTokenMiddleware(middlewareConfig))

	// 示例 1：获取当前用户信息
	authorized.GET("/me", func(c *gin.Context) {
		userID := GetUserID(c)
		email := GetEmail(c)
		roles := GetRoles(c)

		c.JSON(http.StatusOK, gin.H{
			"user_id": userID,
			"email":   email,
			"roles":   roles,
		})
	})

	// 示例 2：需要特定角色的路由
	authorized.GET("/admin", RequireRole("admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Admin access granted",
		})
	})

	// 示例 3：需要任一角色的路由
	authorized.GET("/moderator", RequireAnyRole("admin", "moderator"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Moderator access granted",
		})
	})

	// 示例 4：不需要认证的路由（使用 SkipPaths）
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// 示例 5：自定义跳过认证的路由
	publicGroup := r.Group("/api/v1/public")
	publicGroup.Use(VerifyTokenMiddleware(&MiddlewareConfig{
		AuthClient: client,
		Cache:      NewTokenCache(nil),
		SkipPaths: []string{
			"/api/v1/public/info",
		},
	}))
	publicGroup.GET("/info", func(c *gin.Context) {
		// 这个路由会跳过认证
		c.JSON(http.StatusOK, gin.H{
			"message": "Public info",
		})
	})
}

// 示例：健康检查
func ExampleHealthCheck() {
	authConfig := DefaultConfig()
	authConfig.AuthURL = "https://accounts.svc.plus"
	authConfig.PublicToken = "xcontrol-public-token-2025"

	client := NewAuthClient(authConfig)

	r := gin.Default()

	// 健康检查路由
	r.GET("/healthz", HealthCheckHandler(client))

	// 运行测试
	_ = r
}

// Benchmark 示例
func BenchmarkVerifyTokenMiddleware(b *testing.B) {
	authConfig := DefaultConfig()
	authConfig.AuthURL = "https://accounts.svc.plus"
	authConfig.PublicToken = "xcontrol-public-token-2025"

	client := NewAuthClient(authConfig)
	middlewareConfig := DefaultMiddlewareConfig(client)

	// 设置测试路由
	r := gin.New()
	r.Use(VerifyTokenMiddleware(middlewareConfig))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 模拟请求（注意：这里没有真实的 token，实际使用时需要有效的 token）
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// 执行基准测试
		_ = r
	}
}
