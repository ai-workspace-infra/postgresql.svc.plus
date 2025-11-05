# Token Auth 实现指南

## 快速开始

本项目实现了 Public + Refresh + JWT access_token 双层签发认证机制。

### 目录结构

```
/Users/shenlan/workspaces/XControl/
├── dashboard-fresh/
│   ├── config/
│   │   └── runtime-service-config.base.yaml
│   └── lib/
│       └── auth/
│           ├── token_service.ts      # Deno 前端认证模块
│           └── use_auth.ts           # React Hook
│
├── account/
│   ├── config/
│   │   └── account.yaml
│   └── internal/
│       └── auth/
│           ├── token_service.go      # JWT 签发与验证
│           ├── mfa_service.go        # MFA 服务
│           └── middleware.go         # HTTP 中间件
│
├── rag-server/
│   ├── config/
│   │   └── server.yaml
│   └── internal/
│       └── auth/
│           ├── token_service.go      # JWT 签发与验证
│           └── middleware.go         # HTTP 中间件
│
├── scripts/
│   └── update_token_auth.sh          # 自动更新脚本
│
├── TOKEN_AUTH_MANUAL.md              # 完整维护手册
└── IMPLEMENTATION_GUIDE.md           # 本文件
```

## 安装依赖

### Go 服务

在 `account/` 和 `rag-server/` 目录下添加 `go.mod` 文件：

```bash
# account/go.mod
module account

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/pquerna/otp v1.4.0
)
```

```bash
# rag-server/go.mod
module rag-server

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
)
```

安装依赖：

```bash
cd account && go mod tidy
cd rag-server && go mod tidy
```

## 使用示例

### 1. Go 服务 (account)

```go
package main

import (
    "time"
    "github.com/gin-gonic/gin"
    "account/internal/auth"
)

func main() {
    // 初始化 Token 服务
    tokenService := auth.NewTokenService(auth.TokenConfig{
        PublicToken:    "xcontrol-public-token-2024",
        RefreshSecret:  "xcontrol-refresh-secret-2024",
        AccessSecret:   "xcontrol-access-secret-2024",
        AccessExpiry:   time.Hour,           // 1小时
        RefreshExpiry:  time.Hour * 24 * 7,  // 7天
    })

    r := gin.Default()

    // 登录接口 - 生成令牌
    r.POST("/api/auth/login", func(c *gin.Context) {
        // 验证用户凭据...

        // 生成令牌
        tokenPair, err := tokenService.GenerateTokenPair(
            "user123",
            "user@example.com",
            []string{"user"},
        )
        if err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }

        c.JSON(200, tokenPair)
    })

    // 刷新接口
    r.POST("/api/auth/refresh", func(c *gin.Context) {
        var req struct {
            RefreshToken string `json:"refresh_token"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }

        accessToken, err := tokenService.RefreshAccessToken(req.RefreshToken)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid refresh token"})
            return
        }

        c.JSON(200, gin.H{
            "access_token": accessToken,
            "expires_in":   int64(tokenService.GetAccessTokenExpiry().Seconds()),
        })
    })

    // 受保护的接口
    protected := r.Group("/api")
    protected.Use(tokenService.AuthMiddleware())
    {
        protected.GET("/user/profile", func(c *gin.Context) {
            userID := auth.GetUserID(c)
            c.JSON(200, gin.H{
                "user_id": userID,
            })
        })

        // 需要 MFA 的接口
        protected.GET("/admin/dashboard", auth.RequireMFA(), auth.RequireRole("admin"), func(c *gin.Context) {
            c.JSON(200, gin.H{"message": "Admin dashboard"})
        })
    }

    r.Run(":8080")
}
```

### 2. Go 服务 (rag-server)

```go
package main

import (
    "time"
    "github.com/gin-gonic/gin"
    "rag-server/internal/auth"
)

func main() {
    tokenService := auth.NewTokenService(auth.TokenConfig{
        PublicToken:    "xcontrol-public-token-2024",
        RefreshSecret:  "xcontrol-refresh-secret-2024",
        AccessSecret:   "xcontrol-access-secret-2024",
        AccessExpiry:   time.Hour,
        RefreshExpiry:  time.Hour * 24 * 7,
    })

    r := gin.Default()

    // 保护 RAG API
    r.Use(tokenService.AuthMiddleware())

    r.POST("/api/rag/query", func(c *gin.Context) {
        userID := auth.GetUserID(c)
        email := auth.GetEmail(c)

        c.JSON(200, gin.H{
            "user_id": userID,
            "email":   email,
            "result":  "RAG query processed",
        })
    })

    r.Run(":8090")
}
```

### 3. 前端 (Deno + Preact)

```typescript
import { useAuth } from '../lib/auth/use_auth.ts';

function App() {
  const { user, login, logout, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<boolean> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const success = await onLogin(email, password);
    if (!success) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onInput={(e) => setEmail(e.currentTarget.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onInput={(e) => setPassword(e.currentTarget.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## 维护操作

### 1. 验证配置一致性

```bash
./scripts/update_token_auth.sh --validate
```

### 2. 生成新密钥

```bash
./scripts/update_token_auth.sh --generate-new
```

### 3. 轮换密钥

```bash
./scripts/update_token_auth.sh --rotate
```

### 4. 预览模式（不实际更新）

```bash
./scripts/update_token_auth.sh --rotate --dry-run
```

### 5. 更新维护手册版本号

```bash
./scripts/update_token_auth.sh --update-manual
```

### 6. 清理旧备份

```bash
./scripts/update_token_auth.sh --cleanup
```

## 常见问题

### Q: 如何修改令牌过期时间？

**A:** 修改各服务配置中的 `accessExpiry` 和 `refreshExpiry`：

```go
tokenService := auth.NewTokenService(auth.TokenConfig{
    AccessExpiry:   time.Hour * 2,    // 2小时
    RefreshExpiry:  time.Hour * 24 * 30, // 30天
})
```

### Q: 如何添加自定义 Claims？

**A:** 在 `Claims` 结构体中添加字段：

```go
type Claims struct {
    UserID   string   `json:"user_id"`
    Email    string   `json:"email"`
    Roles    []string `json:"roles"`
    MFA      bool     `json:"mfa_verified"`
    // 添加自定义字段
    Department string `json:"department"`
    jwt.RegisteredClaims
}
```

### Q: 如何处理多个环境（开发、测试、生产）？

**A:** 使用不同的配置文件：

- `config.development.yaml`
- `config.test.yaml`
- `config.production.yaml`

每个环境使用不同的密钥。

### Q: 如何集成 Redis 缓存？

**A:** 在中间件中添加 Redis 检查：

```go
func (s *TokenService) AuthMiddlewareWithRedis() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 检查 Redis 中的黑名单
        if isTokenBlacklisted(token) {
            c.JSON(401, gin.H{"error": "Token revoked"})
            return
        }
        // 验证令牌...
    }
}
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题，请联系开发团队或查看完整维护手册。
