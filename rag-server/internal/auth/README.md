# RAG Server Authentication Middleware

rag-server 认证中间件实现，用于验证访问者身份。所有认证请求都委托给 accounts-service 处理。

## 特性

- ✅ 远程验证：调用 accounts-service 验证 token
- ✅ 缓存机制：缓存验证结果 60s，减少远程调用
- ✅ 零持有：不持有 accessSecret/refreshSecret
- ✅ Gin 集成：与 Gin Web 框架无缝集成
- ✅ 角色验证：支持角色检查
- ✅ 健康检查：内置健康检查端点

## 架构

```
┌─────────────┐         HTTP GET /verify         ┌──────────────────┐
│             │─────────────────────────────────→│                  │
│  rag-server │                                  │ accounts-service │
│             │←─────────────────────────────────│                  │
└─────────────┘    Token Verify Response         └──────────────────┘
        ▲
        │
        │ HTTP Request
        │
┌─────────────┐
│   Client    │
└─────────────┘
```

## 配置

### 1. server.yaml 配置

```yaml
auth:
  enable: true              # 启用认证
  authUrl: "https://accounts.svc.plus"  # accounts-service 地址
  apiBaseUrl: "https://api.svc.plus"    # API 基础地址
  publicToken: "xcontrol-public-token-2025"  # 公钥（仅此密钥）
```

### 2. main.go 启用中间件

```go
package main

import (
    "xcontrol/rag-server/internal/auth"
)

func main() {
    // ... 加载配置

    // 创建认证客户端
    authConfig := auth.DefaultConfig()
    authConfig.AuthURL = cfg.Auth.AuthURL
    authConfig.PublicToken = cfg.Auth.PublicToken

    authClient := auth.NewAuthClient(authConfig)

    // 创建中间件配置
    middlewareConfig := auth.DefaultMiddlewareConfig(authClient)

    // 应用全局中间件
    r.Use(auth.VerifyTokenMiddleware(middlewareConfig))

    // 添加健康检查
    r.GET("/healthz", auth.HealthCheckHandler(authClient))
}
```

## 使用方法

### 1. 基本认证

所有带有 `Authorization: Bearer <token>` 的请求都会被自动验证：

```go
r := gin.Default()
r.Use(auth.VerifyTokenMiddleware(middlewareConfig))

// 需要认证的路由
r.GET("/api/data", func(c *gin.Context) {
    userID := auth.GetUserID(c)
    email := auth.GetEmail(c)
    roles := auth.GetRoles(c)

    c.JSON(http.StatusOK, gin.H{
        "user_id": userID,
        "email":   email,
        "roles":   roles,
    })
})
```

客户端请求：

```bash
curl -H "Authorization: Bearer <access_token>" \
     https://api.svc.plus/api/data
```

### 2. 角色验证

#### 单一角色检查

```go
r.GET("/admin", auth.RequireRole("admin"), func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "message": "Admin access granted",
    })
})
```

#### 多个角色检查（任一匹配）

```go
r.GET("/moderator", auth.RequireAnyRole("admin", "moderator"), func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "message": "Moderator access granted",
    })
})
```

### 3. 跳过认证

#### 全局跳过路径

在中间件配置中设置 `SkipPaths`：

```go
middlewareConfig := &auth.MiddlewareConfig{
    AuthClient: client,
    Cache:      auth.NewTokenCache(nil),
    SkipPaths: []string{
        "/healthz",
        "/ping",
        "/api/auth/",
    },
}
```

#### 分组跳过

```go
publicGroup := r.Group("/api/public")
publicGroup.Use(auth.VerifyTokenMiddleware(middlewareConfig))
// 这个分组中的所有路由都会跳过认证
```

### 4. 缓存配置

```go
cacheConfig := &auth.CacheConfig{
    TTL:         60 * time.Second,  // 默认 60s
    GCInterval:  5 * time.Minute,   // 垃圾回收间隔
    InitialSize: 100,               // 初始容量
}

cache := auth.NewTokenCache(cacheConfig)

middlewareConfig := &auth.MiddlewareConfig{
    AuthClient: client,
    Cache:      cache,
}
```

## API 参考

### 中间件函数

#### VerifyTokenMiddleware(config)

创建认证中间件。

**参数：**
- `config`: `*MiddlewareConfig` - 中间件配置

**示例：**
```go
middleware := auth.VerifyTokenMiddleware(config)
r.Use(middleware)
```

#### RequireRole(role)

检查用户是否具有特定角色。

**参数：**
- `role`: `string` - 所需角色

**示例：**
```go
r.GET("/admin", auth.RequireRole("admin"), handler)
```

#### RequireAnyRole(roles...)

检查用户是否具有任一指定角色。

**参数：**
- `roles`: `...string` - 允许的角色列表

**示例：**
```go
r.GET("/moderate", auth.RequireAnyRole("admin", "moderator"), handler)
```

### 辅助函数

#### GetUserID(c)

从 Gin 上下文获取用户 ID。

**示例：**
```go
userID := auth.GetUserID(c)
```

#### GetEmail(c)

从 Gin 上下文获取用户邮箱。

**示例：**
```go
email := auth.GetEmail(c)
```

#### GetRoles(c)

从 Gin 上下文获取用户角色列表。

**示例：**
```go
roles := auth.GetRoles(c)
```

### 健康检查

#### HealthCheckHandler(client)

创建健康检查处理器。

**示例：**
```go
r.GET("/healthz", auth.HealthCheckHandler(authClient))
```

响应示例：
```json
{
  "status": "ok",
  "message": "auth service healthy"
}
```

## 错误处理

中间件返回标准化的错误响应：

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "missing authorization header"
}
```

### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "insufficient permissions",
  "required_role": "admin"
}
```

### 503 Service Unavailable

```json
{
  "status": "degraded",
  "message": "auth service unavailable",
  "detail": "connection timeout"
}
```

## 最佳实践

1. **使用健康检查**
   ```go
   r.GET("/healthz", auth.HealthCheckHandler(client))
   ```

2. **合理设置缓存 TTL**
   ```go
   // 60s 缓存适合大多数场景
   cacheConfig := &auth.CacheConfig{
       TTL: 60 * time.Second,
   }
   ```

3. **跳过公共路径**
   ```go
   middlewareConfig := auth.DefaultMiddlewareConfig(client)
   middlewareConfig.SkipPaths = []string{
       "/healthz",
       "/ping",
       "/metrics",
   }
   ```

4. **错误日志记录**
   ```go
   r.Use(gin.Logger())
   r.Use(gin.Recovery())
   ```

## 测试

### 单元测试

```go
func TestVerifyTokenMiddleware(t *testing.T) {
    // 设置测试环境
    r := gin.Default()
    middleware := auth.VerifyTokenMiddleware(config)
    r.Use(middleware)

    // 模拟请求
    req, _ := http.NewRequest("GET", "/test", nil)
    req.Header.Set("Authorization", "Bearer test_token")

    // 执行测试
    r.ServeHTTP(w, req)
    assert.Equal(t, http.StatusOK, w.Code)
}
```

### 集成测试

```go
func TestAuthFlow(t *testing.T) {
    // 1. 创建认证客户端
    authClient := auth.NewAuthClient(config)

    // 2. 验证 token
    resp, err := authClient.VerifyToken("valid_token")
    assert.NoError(t, err)
    assert.True(t, resp.Valid)

    // 3. 刷新 token
    refreshResp, err := authClient.RefreshToken("refresh_token")
    assert.NoError(t, err)
    assert.NotEmpty(t, refreshResp.AccessToken)
}
```

## 性能优化

1. **缓存热点**：高频访问的 token 会自动缓存
2. **后台 GC**：自动清理过期缓存条目
3. **连接复用**：HTTP 客户端复用连接
4. **超时控制**：可配置请求超时时间

## 故障排除

### 问题 1：认证失败

**症状：** 所有请求返回 401

**排查：**
1. 检查 token 是否有效
2. 检查 Authorization header 格式
3. 检查 accounts-service 是否可访问

### 问题 2：角色检查失败

**症状：** 返回 403 Forbidden

**排查：**
1. 检查 token 中的角色信息
2. 检查角色检查函数
3. 检查角色字符串格式（逗号分隔）

### 问题 3：缓存不生效

**症状：** 性能差，频繁远程调用

**排查：**
1. 检查缓存配置
2. 检查缓存是否初始化
3. 检查 GC 间隔设置

## 依赖

- Go ≥ 1.24
- Gin v2
- golang-jwt/jwt/v5

## 许可证

MIT
