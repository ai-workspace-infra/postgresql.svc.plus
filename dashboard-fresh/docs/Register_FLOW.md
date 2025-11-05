  ## 已完成的功能

### 1. 核心登录 API - routes/api/auth/login.ts

  - ✅ 使用新的 getAuthUrl() 配置加载器
  - ✅ 添加详细的日志输出
  - ✅ **MFA 设置跳转现在只在注册流程中处理**

### 2. MFA 验证 API - routes/api/auth/mfa/verify/index.ts

  - ✅ 更新使用 getAuthUrl() 替代旧的配置方式
  - ✅ 添加详细的日志输出
  - ✅ 添加 10 秒超时控制
  - ✅ 改进错误处理

### 3. MFA 状态检查 API - routes/api/auth/mfa/status/index.ts

  - ✅ 更新使用 getAuthUrl() 替代旧的配置方式
  - ✅ 添加详细的日志输出
  - ✅ 添加 10 秒超时控制
  - ✅ 添加错误处理，失败时返回 totpEnabled: false

### 4. 注册表单 - islands/RegisterForm.tsx

  - ✅ 多步骤注册流程
  - ✅ 邮箱验证码验证
  - ✅ 自动登录
  - ✅ **注册成功后总是重定向到 MFA 设置页面**

### 5. 运行时配置加载器 - config/runtime-loader.ts

  - ✅ 纯 Deno 实现
  - ✅ 支持 SIT/PROD 环境切换
  - ✅ 支持多区域配置
  - ✅ 环境变量覆盖
  - ✅ 配置缓存

  📊 完整的流程说明

  ### 注册流程 (RegisterForm.tsx)

  1. 用户填写邮箱和密码
  2. 请求发送验证码：POST /api/auth/register/send
  3. 用户输入验证码
  4. 验证邮箱：POST /api/auth/register/verify
  5. 完成注册：POST /api/auth/register
  6. 自动登录：POST /api/auth/login
  7. **注册成功后，总是重定向到 `/panel/account?NeedSetupMfa=1`**
  8. 用户可以在 MFA 设置页面选择启用或跳过 MFA

  ### 登录流程

  **重要说明**：
  - 登录 API **永远不会**返回 `needMfa: true`
  - `/panel/account?NeedSetupMfa=1` 的重定向**只在注册流程**中处理
  - 日常登录时，如果需要 TOTP，返回 `needMfa: false` + `error: 'mfa_code_required'`

  情况 1：用户未启用 MFA

  1. 前端预检：GET /api/auth/mfa/status?identifier=user@example.com
     ← { mfa: { totpEnabled: false } }

  2. 前端提交登录：POST /api/auth/login
     { email, password }
     ← { success: true } + session cookie

  3. ✅ 登录成功

  情况 2：用户启用了 MFA（完整流程）

  1. 前端预检：GET /api/auth/mfa/status?identifier=user@example.com
     ← { mfa: { totpEnabled: true } }

  2. 前端显示 TOTP 输入框

  3. 第一次提交（未输入 TOTP）：POST /api/auth/login
     { email, password }
     ← { success: false, error: "mfa_code_required", needMfa: false }

  4. 前端看到 error 是 mfa_code_required，显示 TOTP 输入框（不跳转）

  5. 第二次提交（带 TOTP）：POST /api/auth/login
     { email, password, totp: "123456" }

     → 后端内部调用：POST /api/auth/login
     ← { success: true } + session cookie

  6. ✅ 登录成功

  情况 3：使用独立的 MFA 验证 API（不推荐用于日常登录）

  1. 第一次登录（不带 TOTP）：POST /api/auth/login
     { email, password }
     ← { success: false, error: "mfa_code_required", needMfa: false }
     注意：日常登录时不会返回 mfa_token cookie

  2. MFA 验证：POST /api/auth/mfa/verify
     注意：此API主要用于MFA设置流程，日常登录推荐使用情况2的方式
     Cookie: mfa_token=xxx
     { code: "123456" }
     ← { success: true } + session cookie

  3. ✅ 登录成功

  🎯 后端 API 路径映射

  | Fresh API                 | 后端 API
  | 说明        |
  |---------------------------|-------------------------------------|-
  ----------|
  | POST /api/auth/login      | ${authUrl}/api/auth/login           |
  用户登录      |
  | GET /api/auth/mfa/status  | ${authUrl}/api/auth/mfa/status      |
  检查 MFA 状态 |
  | POST /api/auth/mfa/verify | ${authUrl}/api/auth/mfa/totp/verify |
  验证 MFA 代码 |

  📝 日志输出示例

  登录流程日志：

  [login] ===== Request received =====
  [login] Method: POST
  [login] URL: http://localhost:8003/api/auth/login
  [login] Step parameter: null (backward compatibility mode)
  [login] Payload parsed, keys: [ "email", "password", "remember" ]
  [login] → Backward compatibility: routing to handleLogin
  [login/handleLogin] Starting login process
  [login/handleLogin] Email: manbuzhe2009@qq.com
  [login/handleLogin] Has password: true
  [login/handleLogin] Remember: true
  [login/handleLogin] Calling proxy to backend...
  [login-proxy] → /api/auth/login { email: "manbuzhe2009@qq.com" }
  [login-proxy] ← /api/auth/login [400] { ok: false, hasData: true }
  [login/handleLogin] Backend response - ok: false status: 400
  [login/handleLogin] Error code: mfa_code_required Needs MFA: true
  Has mfaToken: false
  [login/handleLogin] → MFA required, but no mfaToken from backend

  MFA 状态检查日志：

  [mfa/status] Request received
  [mfa/status] Identifier: user@example.com Has session: false
  [mfa/status] Calling backend: http://localhost:8080/api/auth/mfa/sta
  tus?identifier=user@example.com
  [mfa/status] Backend response - status: 200

  MFA 验证日志：

  [mfa/verify] ===== Request received =====
  [mfa/verify] Payload parsed, has code: true
  [mfa/verify] Has token: true Code length: 6
  [mfa/verify] Calling backend:
  http://localhost:8080/api/auth/mfa/totp/verify
  [mfa/verify] Backend response - status: 200 ok: true
  [mfa/verify] ✓ MFA verification successful

  🚀 下一步

  现在所有 API 已经更新完成，你需要：

  1. 测试登录流程：
  # 确保后台进程已清理
  pkill -f "deno task dev"

  # 重新启动
  ./dev-local.sh
  2. 在浏览器中测试：
    - 访问 http://localhost:8003/login
    - 输入你的邮箱（manbuzhe2009@qq.com）
    - 应该会显示 TOTP 输入框
    - 输入密码和 TOTP 代码
    - 点击登录
  3. 检查日志：
  在服务器日志中应该能看到完整的请求流程
