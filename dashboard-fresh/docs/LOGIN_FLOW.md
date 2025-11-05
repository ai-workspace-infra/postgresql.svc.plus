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

### 5. 运行时配置加载器 - config/runtime-loader.ts

  - ✅ 纯 Deno 实现
  - ✅ 支持 SIT/PROD 环境切换
  - ✅ 支持多区域配置
  - ✅ 环境变量覆盖
  - ✅ 配置缓存

### 登录流程

  情况 1：用户未启用 MFA

  1. 前端预检：GET /api/auth/mfa/status?identifier=user@example.com
     ← { mfa: { totpEnabled: false } }

  2. 前端提交登录：POST /api/auth/login
     { email, password }
     ← { success: true } + session cookie
     前端不显示 TOTP 输入框

  3. ✅ 登录成功

  情况 2：用户启用了 MFA（完整流程）

  1. 前端预检：GET /api/auth/mfa/status?identifier=user@example.com
     ← { mfa: { totpEnabled: true } }

  2. 前端显示 TOTP 输入框

  3. POST /api/auth/login  email, password, mfa_code}
     ← { success: true } + session cookie

  4. ✅ 登录成功


# 后端 API 路径映射

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

# 日志输出示例

  登录流程日志：

  MFA 状态检查日志：

  MFA 验证日志：
