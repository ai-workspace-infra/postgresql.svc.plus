# Public + Refresh + JWT Access Token 双层签发维护手册

## 概述

本系统实现了基于 Public Token、Refresh Token 和 JWT Access Token 的三层认证机制，提供安全、灵活的用户认证解决方案。

## 架构设计

### 1. 认证流程

```
┌─────────────┐    1. Login Request     ┌──────────────┐
│   Client    │ ────────────────────────→ │   Account    │
│ (Dashboard) │                          │   Service    │
└─────────────┘                          └──────────────┘
        ↑                                         │
        │ 2. TokenPair (Public+Refresh+JWT)       │
        │                                         ▼
        │                                 ┌──────────────┐
        │                                 │ TokenService │
        │                                 │ (JWT Sign)   │
        │                                 └──────────────┘
        │                                         │
        │ 3. API Request                         │
        ├─────────────────────────────────────────┤
        │                                         │
        │ 4. Access Token Verification           │
        │ (Middleware)                            ▼
        │                                 ┌──────────────┐
        │ 5. Response                     │  Protected   │
        │ ←────────────────────────────── │  Resources   │
        │                                 └──────────────┘
```

### 2. 三层 Token 说明

#### Public Token
- **用途**: 标识客户端身份，用于初次认证
- **特征**: 固定值，存储在配置文件中
- **示例**: `xcontrol-public-token-2024`
- **安全性**: 低，仅作为入口验证

#### Refresh Token
- **用途**: 长期有效的刷新令牌
- **格式**: JWT
- **过期时间**: 7-30 天（可配置）
- **存储**: 客户端安全存储
- **安全性**: 中等，用于获取新的 Access Token

#### Access Token (JWT)
- **用途**: API 访问令牌
- **格式**: JWT with HS256
- **过期时间**: 15-60 分钟（可配置）
- **载荷**: 包含用户信息、角色、MFA 状态等
- **安全性**: 高，短期有效减少泄露风险

## 配置文件

### 1. dashboard-fresh/config/runtime-service-config.base.yaml

```yaml
auth:
  token:
    publicToken: "xcontrol-public-token-2024"
    refreshSecret: "xcontrol-refresh-secret-2024"
```

### 2. account/config/account.yaml

```yaml
auth:
  token:
    publicToken: "xcontrol-public-token-2024"
    refreshSecret: "xcontrol-refresh-secret-2024"
```

### 3. rag-server/config/server.yaml

```yaml
auth:
  token:
    publicToken: "xcontrol-public-token-2024"
    refreshSecret: "xcontrol-refresh-secret-2024"
```

## Go 服务实现

### account/internal/auth/

#### 1. token_service.go

**功能**: 负责 Token 的生成、验证和刷新

**主要方法**:
- `NewTokenService(config TokenConfig)`: 创建服务实例
- `ValidatePublicToken(publicToken string)`: 验证公共令牌
- `GenerateTokenPair(userID, email string, roles []string)`: 生成三层令牌
- `ValidateAccessToken(accessToken string)`: 验证访问令牌
- `RefreshAccessToken(refreshToken string)`: 使用刷新令牌获取新访问令牌

**配置示例**:
```go
tokenService := auth.NewTokenService(auth.TokenConfig{
    PublicToken:    "xcontrol-public-token-2024",
    RefreshSecret:  "xcontrol-refresh-secret-2024",
    AccessSecret:   "xcontrol-access-secret-2024",
    AccessExpiry:   time.Hour,      // 1小时
    RefreshExpiry:  time.Hour * 24 * 7, // 7天
})
```

#### 2. mfa_service.go

**功能**: 多因素认证服务

**主要方法**:
- `GenerateSecret()`: 生成 TOTP 密钥
- `GenerateQRCode(accountName, secret string)`: 生成二维码
- `ValidateTOTP(secret, code string)`: 验证 TOTP 码
- `GenerateBackupCodes(count int)`: 生成备用码

#### 3. middleware.go

**功能**: HTTP 中间件，用于保护 API 端点

**中间件**:
- `AuthMiddleware()`: 验证 JWT 访问令牌
- `RequireMFA()`: 要求 MFA 验证
- `RequireRole(role string)`: 要求特定角色

**使用示例**:
```go
r := gin.Default()
r.Use(tokenService.AuthMiddleware())
r.GET("/api/protected", RequireMFA(), RequireRole("admin"), handler)
```

### rag-server/internal/auth/

#### 1. token_service.go
- 与 account 类似，但 `Issuer` 字段为 `"xcontrol-rag"`
- Audience 为 `"xcontrol-rag-access"` 和 `"xcontrol-rag-refresh"`
- Claim 中包含 `service` 字段用于区分服务

#### 2. middleware.go
- 同样提供认证中间件
- 验证 `service` 字段是否为 `"rag-server"`

## Deno 前端实现

### lib/auth/token_service.ts

**功能**: 前端 Token 管理服务

**主要方法**:
- `setTokens(tokenPair)`: 设置令牌
- `getAccessToken()`: 获取当前访问令牌
- `isTokenExpired()`: 检查令牌是否过期
- `decodeToken()`: 解码 JWT（不验证）
- `refreshAccessToken()`: 刷新访问令牌
- `ensureValidToken()`: 自动验证和刷新令牌

### lib/auth/use_auth.ts

**功能**: React Hook，提供认证状态管理

**主要功能**:
- `login(email, password)`: 登录
- `logout()`: 登出
- `refreshToken()`: 刷新令牌
- `hasRole(role)`: 检查角色
- 自动加载和保存令牌到 localStorage

**使用示例**:
```typescript
import { useAuth } from '../lib/auth/use_auth.ts';

function LoginComponent() {
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    const success = await login('user@example.com', 'password');
    if (success) {
      // 登录成功
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* 表单内容 */}
    </form>
  );
}
```

## API 接口

### 1. 登录接口

**POST** `/api/auth/login`

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**响应**:
```json
{
  "public_token": "xcontrol-public-token-2024",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. 刷新令牌接口

**POST** `/api/auth/refresh`

**请求体**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### 3. 验证接口

**GET** `/api/auth/verify`

**请求头**:
```
Authorization: Bearer <access_token>
```

**响应**:
```json
{
  "valid": true,
  "user_id": "12345",
  "email": "user@example.com",
  "roles": ["user", "admin"],
  "mfa_verified": true
}
```

## 安全最佳实践

### 1. Token 安全
- ✅ Access Token 短期有效（15-60 分钟）
- ✅ Refresh Token 长期有效（7-30 天）
- ✅ 使用强随机密钥
- ✅ 定期轮换密钥
- ❌ 不在 URL 中传递令牌
- ❌ 不在客户端永久存储 Access Token

### 2. 存储策略
- **Access Token**: 内存或短期存储
- **Refresh Token**: 安全存储（HttpOnly Cookie 或加密存储）
- **Public Token**: 可公开存储

### 3. 传输安全
- ✅ 所有 API 调用使用 HTTPS
- ✅ 使用 Authorization Header
- ✅ 设置适当的 CORS 策略

### 4. 刷新策略
- ✅ 提前刷新（剩余时间 < 5 分钟）
- ✅ 失败时清理令牌并重定向登录
- ✅ 限制刷新频率

## 故障排除

### 1. 常见错误

#### 401 Unauthorized
- **原因**: Access Token 过期或无效
- **解决**: 调用刷新接口获取新令牌

#### 403 Forbidden
- **原因**: 权限不足
- **解决**: 检查用户角色和中间件配置

#### 400 Bad Request
- **原因**: 请求格式错误
- **解决**: 检查请求体和头部

### 2. 调试命令

#### 检查令牌有效性
```bash
# 使用 jq 解码 JWT
echo "<token>" | cut -d. -f2 | base64 -d | jq
```

#### 验证令牌签名
```bash
# 使用 OpenSSL 验证 HMAC
```

### 3. 日志分析

#### Go 服务日志
```
[INFO] Token validated for user: user_id
[WARN] Token refresh failed: invalid signature
[ERROR] Middleware blocked request: missing authorization
```

#### 前端控制台
```
Token refreshed successfully
Token is expired, attempting refresh...
Authentication failed: 401
```

## 密钥管理

### 1. 生成强随机密钥

```bash
# 使用 OpenSSL 生成 32 字节随机密钥
openssl rand -base64 32
```

### 2. 密钥轮换流程

1. 生成新密钥
2. 更新配置文件
3. 同时接受新旧密钥（过渡期）
4. 逐步淘汰旧密钥
5. 完全切换到新密钥

### 3. 环境分离

- **开发环境**: 使用开发专用密钥
- **测试环境**: 使用测试专用密钥
- **生产环境**: 使用生产密钥（严格保密）

## 监控和告警

### 1. 监控指标
- Token 刷新成功率
- 认证失败次数
- Token 过期频率
- 并发用户数

### 2. 告警规则
- 认证失败率 > 5%
- 连续 3 次刷新失败
- Token 解析错误

## 性能优化

### 1. 缓存策略
- 将用户信息缓存在 Redis
- 使用本地内存缓存（短期）
- 实现分布式缓存（多实例）

### 2. 令牌预刷新
- 前台定时检查令牌剩余时间
- 后台预刷新机制
- 智能延迟刷新

## 迁移指南

### 从旧版迁移

1. **评估现有系统**
   - 记录当前认证流程
   - 识别依赖的 API
   - 制定迁移计划

2. **分阶段部署**
   - 第一阶段：实现新认证模块
   - 第二阶段：更新 API 端点
   - 第三阶段：更新前端代码
   - 第四阶段：移除旧认证

3. **兼容性**
   - 同时支持新旧认证
   - 渐进式切换
   - 回滚方案

## 维护任务

### 日常检查清单
- [ ] 检查认证错误日志
- [ ] 监控 Token 刷新成功率
- [ ] 验证配置一致性
- [ ] 测试自动刷新机制

### 周度任务
- [ ] 分析认证统计数据
- [ ] 检查密钥轮换计划
- [ ] 更新 MFA 备用码

### 月度任务
- [ ] 安全审计
- [ ] 性能评估
- [ ] 更新文档
- [ ] 备份配置

## 联系信息

如有问题或需要支持，请联系：

- **开发团队**: dev@svc.plus
- **安全团队**: security@svc.plus
- **运维团队**: ops@svc.plus

---

**文档版本**: v1.0
**最后更新**: 2025-11-05
**维护者**: XControl Team
