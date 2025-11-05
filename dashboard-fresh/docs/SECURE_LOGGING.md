# Secure Logging Best Practices

## 🎯 目标

防止在日志中意外泄露敏感信息，同时保留足够的调试信息。

## 🚨 敏感字段清单

以下字段在日志中将被自动屏蔽：

| 字段名 | 屏蔽方式 |
|--------|----------|
| `password` | `[REDACTED]` |
| `token` | `[REDACTED]` |
| `accessToken` | `[REDACTED]` |
| `refreshToken` | `[REDACTED]` |
| `mfaToken` | `[REDACTED]` |
| `mfaTotpSecret` | `[REDACTED]` |
| `totp` | `[REDACTED]` |
| `totpCode` | `[REDACTED]` |
| `code` | `[REDACTED]` |
| `secret` | `[REDACTED]` |
| `privateKey` | `[REDACTED]` |
| `private_key` | `[REDACTED]` |

## 📧 邮箱处理

邮箱地址将被模糊化显示：
- `manbuzhe2009@qq.com` → `man***09@qq.com`
- `user@example.com` → `use***@example.com`

## 🔧 使用方法

### 1. 使用 `safeLog()` 函数

```typescript
// ❌ 不安全的日志
console.log('User login:', { email, password, totp })

// ✅ 安全的日志
console.log('User login:', safeLog({ email, password, totp }))
```

### 2. 手动屏蔽特定字段

```typescript
// ❌ 不安全
console.log('Response:', responseData)

// ✅ 安全
console.log('Response:', safeLog({
  status: responseData.status,
  ok: responseData.ok,
  user: { id: responseData.user?.id, email: responseData.user?.email }
}))
```

### 3. 在 API 路由中

```typescript
export async function POST(request: Request) {
  const body = await request.json()

  // ✅ 使用 safeLog
  console.log('Received request:', safeLog(body))

  // ✅ 手动模糊邮箱
  console.log('Email:', maskEmail(body.email))

  // ✅ 仅标记敏感字段存在
  console.log('Has password:', !!body.password)
}
```

## 📝 日志级别

### ✅ 可以安全记录的信息
- HTTP 状态码（200, 400, 401, 500等）
- API 路径（/api/auth/login）
- 用户 ID（如果已存在）
- 部分邮箱地址（已模糊化）
- 布尔值标志（hasPassword, hasTotp）
- 错误代码（mfa_code_required）

### ❌ 禁止记录的信息
- 密码（任何形式）
- TOTP 代码
- 访问令牌（token）
- MFA 密钥
- 私人密钥
- 完整的个人身份信息

## 🔍 调试信息保留

尽管屏蔽了敏感字段，日志仍提供足够的调试信息：

```javascript
// 示例：成功登录
[login-proxy] → /api/auth/login {
  email: 'man***09@qq.com',  // 模糊化邮箱
  hasPassword: true,         // 只标记存在性
  hasTotp: true,            // TOTP 已提供但被屏蔽
  totp: '[REDACTED]'        // TOTP 代码被屏蔽
}

// 示例：错误响应
[login-proxy] ← /api/auth/login [400] {
  ok: false,
  hasData: true,
  hasToken: false,          // 有用的调试信息
  hasMfaToken: false,       // 指示后端行为
  error: 'mfa_code_required' // 具体的错误代码
}
```

## 🎯 最佳实践

1. **总是使用 `safeLog()`** 打印可能包含用户数据的对象
2. **使用布尔标记**代替敏感值（`hasPassword: true` 而不是密码）
3. **模糊化邮箱**始终使用 `maskEmail()`
4. **只记录必要信息**避免过度记录
5. **错误代码和状态码**可以安全记录

## 🚀 故障排查

### 如果需要更多调试信息

**错误代码**（如 `mfa_code_required`）已保留，足以定位问题。

**TOTP 验证失败**？检查：
- `hasTotp: true` - 确认 TOTP 已发送
- `totp: '[REDACTED]'` - 确认代码被屏蔽（这是正常的）
- 错误代码 - 了解失败原因

**不需要查看实际的 TOTP 值**！如果需要验证，使用：
```bash
oathtool --totp -b xxxx_mfaTotpSecret_xxxx
```

## ✅ 合规性

这个安全日志系统确保：
- ✅ 符合数据最小化原则
- ✅ 满足 GDPR/CCPA 要求
- ✅ 防止凭据泄露
- ✅ 保留审计追踪能力
- ✅ 支持安全事件调查

---

**记住**：日志中的信息可能被持久化存储或传输到监控系统。始终使用 `safeLog()` 保护用户隐私！
