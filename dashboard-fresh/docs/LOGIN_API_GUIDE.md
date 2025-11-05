# 登录 API 使用指南

## API 端点

`POST /api/auth/login?step={step}`

支持三个步骤的登录流程：

### Step 1: 检查邮箱 (`check_email`)
### Step 2: 用户登录 (`login`)
### Step 3: 验证 MFA (`verify_mfa`)

---

## 1. 检查邮箱是否存在及 MFA 状态

### 请求

```http
POST /api/auth/login?step=check_email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 成功响应 (200 OK)

```json
{
  "success": true,
  "error": null,
  "exists": true,
  "mfaEnabled": false
}
```

### 字段说明

- `success`: 请求是否成功
- `error`: 错误信息（成功时为 null）
- `exists`: 邮箱是否存在
- `mfaEnabled`: 该用户是否启用了 MFA

### 错误响应

```json
{
  "success": false,
  "error": "missing_email",
  "exists": false,
  "mfaEnabled": false
}
```

### 错误代码

| 错误代码 | 说明 |
|---------|------|
| `missing_email` | 未提供邮箱地址 |
| `check_email_failed` | 邮箱检查失败 |
| `account_service_unreachable` | 认证服务不可达 |

---

## 2. 用户登录

### 请求

```http
POST /api/auth/login?step=login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "remember": true
}
```

### 参数说明

- `email`: 用户邮箱（必填）
- `password`: 用户密码（必填）
- `remember`: 是否保持登录状态（可选，默认 false）

### 成功响应 - 无需 MFA (200 OK)

```json
{
  "success": true,
  "error": null,
  "needMfa": false
}
```

**设置的 Cookie:**
- `session`: 会话令牌
- 清除 `mfa_token`（如果存在）

### 成功响应 - 需要 MFA (401 Unauthorized)

```json
{
  "success": false,
  "error": "mfa_required",
  "needMfa": true
}
```

**设置的 Cookie:**
- `mfa_token`: MFA 验证令牌
- 清除 `session`

### 错误响应

```json
{
  "success": false,
  "error": "authentication_failed",
  "needMfa": false
}
```

### 错误代码

| 错误代码 | 状态码 | 说明 |
|---------|--------|------|
| `missing_credentials` | 400 | 缺少邮箱或密码 |
| `authentication_failed` | 401 | 认证失败（邮箱或密码错误） |
| `mfa_required` | 401 | 需要 MFA 验证 |
| `mfa_setup_required` | 401 | 需要设置 MFA |
| `account_service_unreachable` | 502 | 认证服务不可达 |

---

## 3. 验证 MFA 代码

### 请求

```http
POST /api/auth/login?step=verify_mfa
Content-Type: application/json
Cookie: mfa_token=<mfa_token>

{
  "totp": "123456"
}
```

或者直接在请求体中提供 token：

```json
{
  "totp": "123456",
  "token": "mfa_token_from_previous_step"
}
```

### 参数说明

- `totp` 或 `code`: 6 位 TOTP 验证码（必填）
- `token`: MFA 令牌（可选，如果未在 Cookie 中提供）

### 成功响应 (200 OK)

```json
{
  "success": true,
  "error": null,
  "needMfa": false
}
```

**设置的 Cookie:**
- `session`: 会话令牌
- 清除 `mfa_token`

### 错误响应

```json
{
  "success": false,
  "error": "mfa_verification_failed",
  "needMfa": true
}
```

### 错误代码

| 错误代码 | 状态码 | 说明 |
|---------|--------|------|
| `missing_totp_code` | 400 | 未提供 TOTP 代码 |
| `missing_mfa_token` | 401 | 缺少 MFA 令牌 |
| `mfa_verification_failed` | 401 | MFA 验证失败 |
| `account_service_unreachable` | 502 | 认证服务不可达 |

---

## 4. 清除会话（登出）

### 请求

```http
DELETE /api/auth/login
```

### 响应 (200 OK)

```json
{
  "success": true,
  "error": null,
  "needMfa": false
}
```

**清除的 Cookie:**
- `session`
- `mfa_token`

---

## 完整登录流程示例

### 场景 1: 无 MFA 的简单登录

```javascript
// 1. 检查邮箱
const checkResponse = await fetch('/api/auth/login?step=check_email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
const checkData = await checkResponse.json()
console.log(checkData)
// { success: true, exists: true, mfaEnabled: false }

// 2. 登录
const loginResponse = await fetch('/api/auth/login?step=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123',
    remember: true
  })
})
const loginData = await loginResponse.json()
console.log(loginData)
// { success: true, error: null, needMfa: false }
// ✅ 登录成功，session cookie 已设置
```

### 场景 2: 带 MFA 的登录流程

```javascript
// 1. 检查邮箱
const checkResponse = await fetch('/api/auth/login?step=check_email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
const checkData = await checkResponse.json()
console.log(checkData)
// { success: true, exists: true, mfaEnabled: true }

// 2. 登录（第一步）
const loginResponse = await fetch('/api/auth/login?step=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // 重要：保存 cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
})
const loginData = await loginResponse.json()
console.log(loginData)
// { success: false, error: "mfa_required", needMfa: true }
// ⚠️ 需要 MFA 验证，mfa_token cookie 已设置

// 3. 验证 MFA 代码
const mfaResponse = await fetch('/api/auth/login?step=verify_mfa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // 重要：发送 mfa_token cookie
  body: JSON.stringify({
    totp: '123456' // 用户的 6 位 TOTP 代码
  })
})
const mfaData = await mfaResponse.json()
console.log(mfaData)
// { success: true, error: null, needMfa: false }
// ✅ MFA 验证成功，session cookie 已设置
```

### 场景 3: 登出

```javascript
const logoutResponse = await fetch('/api/auth/login', {
  method: 'DELETE',
  credentials: 'include'
})
const logoutData = await logoutResponse.json()
console.log(logoutData)
// { success: true, error: null, needMfa: false }
// ✅ 登出成功，所有认证 cookies 已清除
```

---

## 前端集成建议

### React/Preact 示例

```tsx
import { useState } from 'preact/hooks'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [needMfa, setNeedMfa] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: Event) => {
    e.preventDefault()
    setError('')

    try {
      // Step 1: Check email
      const checkRes = await fetch('/api/auth/login?step=check_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const checkData = await checkRes.json()

      if (!checkData.exists) {
        setError('邮箱不存在')
        return
      }

      // Step 2: Login
      const loginRes = await fetch('/api/auth/login?step=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember: true })
      })
      const loginData = await loginRes.json()

      if (loginData.success) {
        // 登录成功，跳转到仪表板
        window.location.href = '/panel'
      } else if (loginData.needMfa) {
        // 需要 MFA 验证
        setNeedMfa(true)
      } else {
        setError(loginData.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误')
    }
  }

  const handleMfaVerify = async (e: Event) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/auth/login?step=verify_mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totp: mfaCode })
      })
      const data = await res.json()

      if (data.success) {
        window.location.href = '/panel'
      } else {
        setError(data.error || 'MFA 验证失败')
      }
    } catch (err) {
      setError('网络错误')
    }
  }

  if (needMfa) {
    return (
      <form onSubmit={handleMfaVerify}>
        <h2>双因素认证</h2>
        <input
          type="text"
          placeholder="请输入 6 位验证码"
          value={mfaCode}
          onInput={(e) => setMfaCode(e.currentTarget.value)}
          maxLength={6}
        />
        <button type="submit">验证</button>
        {error && <p className="error">{error}</p>}
      </form>
    )
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>登录</h2>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onInput={(e) => setEmail(e.currentTarget.value)}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onInput={(e) => setPassword(e.currentTarget.value)}
      />
      <button type="submit">登录</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
```

---

## 技术实现细节

### 代理函数 (proxy)

内部使用统一的代理函数来调用外部认证 API：

```typescript
async function proxy<T>(
  endpoint: string,
  body: Record<string, unknown>,
  timeout = 10000
): Promise<{ ok: boolean; status: number; data: T }>
```

**特点：**
- 自动从运行时配置加载 `authUrl`
- 统一超时控制（默认 10 秒）
- 统一日志输出
- 统一错误处理

### 后端 API 映射

| 前端端点 | 后端 API | 方法 |
|---------|---------|------|
| `?step=check_email` | `${authUrl}/api/auth/check_email` | POST |
| `?step=login` | `${authUrl}/api/auth/login` | POST |
| `?step=verify_mfa` | `${authUrl}/api/auth/verify_mfa` | POST |

### Cookie 管理

- **Session Cookie**: `session`
  - 存储会话令牌
  - HttpOnly, Secure
  - 过期时间根据 remember 参数调整

- **MFA Cookie**: `mfa_token`
  - 临时存储 MFA 令牌
  - HttpOnly, Secure
  - 短期有效

### 日志输出

所有请求都会输出结构化日志：

```
[login-proxy] → /api/auth/check_email { email: 'user@example.com' }
[login-proxy] ← /api/auth/check_email [200] { ok: true, hasData: true }
[login] ✓ Login successful
```

---

## 安全注意事项

1. **所有请求必须使用 HTTPS**（生产环境）
2. **密码永远不会被记录在日志中**
3. **MFA 令牌仅用于临时验证，验证后立即清除**
4. **Session Cookie 设置了 HttpOnly 和 Secure 标志**
5. **所有输入都经过规范化和验证**

---

## 相关文件

- API 实现：`routes/api/auth/login.ts`
- 认证工具：`lib/authGateway.deno.ts`
- 运行时配置：`server/runtime-loader.deno.ts`
- 环境配置：参见 `docs/ENVIRONMENT_SETUP.md`

---

## 兼容性说明

### 向后兼容

如果请求未指定 `step` 参数，API 会默认使用 `login` 行为：

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

这与旧版 API 行为保持一致，确保现有客户端继续工作。

### 推荐做法

新的集成应使用明确的 `step` 参数：
- ✅ `POST /api/auth/login?step=login`
- ❌ `POST /api/auth/login` (虽然可用，但不推荐)
