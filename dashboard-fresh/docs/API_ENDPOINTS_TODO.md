# API 端点迁移清单

## 📊 迁移进度

**总计:** 29 个 API 端点
**已完成:** 8 个 (27.6%)
**待迁移:** 21 个 (72.4%)

---

## ✅ 已完成 (8/29)

### 核心 API
- [x] `/api/ping` → `routes/api/ping.ts`
- [x] `/api/templates` → `routes/api/templates.ts`
- [x] `/api/docs` → `routes/api/docs.ts`
- [x] `/api/downloads` → `routes/api/downloads.ts`
- [x] `/api/render-markdown` → `routes/api/render-markdown.ts`
- [x] `/api/content-meta` → `routes/api/content-meta.ts`

### 认证 API
- [x] `/api/auth/login` → `routes/api/auth/login.ts`
- [x] `/api/auth/session` → `routes/api/auth/session.ts`

---

## 📋 待迁移 (21/29)

### 🔐 认证相关 (7 个) - 高优先级

#### 注册流程
- [ ] `app/api/auth/register/route.ts` → `routes/api/auth/register.ts`
  - **方法:** POST
  - **功能:** 用户注册
  - **依赖:** authGateway.deno.ts, serviceConfig.deno.ts

- [ ] `app/api/auth/register/send/route.ts` → `routes/api/auth/register/send.ts`
  - **方法:** POST
  - **功能:** 发送注册验证邮件
  - **依赖:** 邮件服务

- [ ] `app/api/auth/register/verify/route.ts` → `routes/api/auth/register/verify.ts`
  - **方法:** POST
  - **功能:** 验证注册码
  - **依赖:** Account Service

#### 邮箱验证
- [ ] `app/api/auth/verify-email/route.ts` → `routes/api/auth/verify-email.ts`
  - **方法:** POST
  - **功能:** 验证邮箱
  - **依赖:** Account Service

- [ ] `app/api/auth/verify-email/send/route.ts` → `routes/api/auth/verify-email/send.ts`
  - **方法:** POST
  - **功能:** 发送邮箱验证链接
  - **依赖:** 邮件服务

#### MFA (多因素认证)
- [ ] `app/api/auth/mfa/setup/route.ts` → `routes/api/auth/mfa/setup.ts`
  - **方法:** POST
  - **功能:** 设置 MFA (生成 TOTP secret)
  - **依赖:** Account Service, qrcode

- [ ] `app/api/auth/mfa/verify/route.ts` → `routes/api/auth/mfa/verify.ts`
  - **方法:** POST
  - **功能:** 验证 TOTP 代码
  - **依赖:** Account Service

- [ ] `app/api/auth/mfa/status/route.ts` → `routes/api/auth/mfa/status.ts`
  - **方法:** GET
  - **功能:** 获取 MFA 状态
  - **依赖:** 需要认证

- [ ] `app/api/auth/mfa/disable/route.ts` → `routes/api/auth/mfa/disable.ts`
  - **方法:** POST
  - **功能:** 禁用 MFA
  - **依赖:** 需要认证

---

### 👥 用户管理 (2 个) - 中优先级

- [ ] `app/api/users/route.ts` → `routes/api/users.ts`
  - **方法:** GET, POST, PUT, DELETE
  - **功能:** 用户 CRUD
  - **依赖:** 需要认证

- [ ] `app/api/admin/users/metrics/route.ts` → `routes/api/admin/users/metrics.ts`
  - **方法:** GET
  - **功能:** 用户统计数据
  - **依赖:** 需要 admin 权限

---

### 🔧 管理员 API (2 个) - 中优先级

- [ ] `app/api/admin/settings/route.ts` → `routes/api/admin/settings.ts`
  - **方法:** GET, PUT
  - **功能:** 系统设置
  - **依赖:** 需要 admin 权限

- [ ] `app/api/admin/users/[userId]/role/route.ts` → `routes/api/admin/users/[userId]/role.ts`
  - **方法:** PUT
  - **功能:** 修改用户角色
  - **依赖:** 需要 admin 权限
  - **注意:** 动态路由 [userId]

---

### 📧 邮件系统 (7 个) - 中优先级

#### 邮件操作
- [ ] `app/api/mail/inbox/route.ts` → `routes/api/mail/inbox.ts`
  - **方法:** GET
  - **功能:** 获取收件箱
  - **依赖:** 需要认证

- [ ] `app/api/mail/send/route.ts` → `routes/api/mail/send.ts`
  - **方法:** POST
  - **功能:** 发送邮件
  - **依赖:** 需要认证, 邮件服务

- [ ] `app/api/mail/namespace/route.ts` → `routes/api/mail/namespace.ts`
  - **方法:** GET
  - **功能:** 获取邮箱命名空间
  - **依赖:** 需要认证

- [ ] `app/api/mail/message/[id]/route.ts` → `routes/api/mail/message/[id].ts`
  - **方法:** GET, DELETE
  - **功能:** 邮件详情和删除
  - **依赖:** 需要认证
  - **注意:** 动态路由 [id]

#### AI 功能
- [ ] `app/api/mail/ai/summarize/route.ts` → `routes/api/mail/ai/summarize.ts`
  - **方法:** POST
  - **功能:** AI 邮件摘要
  - **依赖:** 需要认证, AI 服务

- [ ] `app/api/mail/ai/reply-suggest/route.ts` → `routes/api/mail/ai/reply-suggest.ts`
  - **方法:** POST
  - **功能:** AI 回复建议
  - **依赖:** 需要认证, AI 服务

- [ ] `app/api/mail/ai/classify/route.ts` → `routes/api/mail/ai/classify.ts`
  - **方法:** POST
  - **功能:** AI 邮件分类
  - **依赖:** 需要认证, AI 服务

---

### 🤖 AI & RAG (2 个) - 低优先级

- [ ] `app/api/askai/route.ts` → `routes/api/askai.ts`
  - **方法:** POST
  - **功能:** AI 问答
  - **依赖:** 需要认证, AI 服务

- [ ] `app/api/rag/query/route.ts` → `routes/api/rag/query.ts`
  - **方法:** POST
  - **功能:** RAG 检索增强生成
  - **依赖:** 需要认证, RAG 服务

---

### 🔀 动态路由 (2 个) - 低优先级

- [ ] `app/api/task/[...segments]/route.ts` → `routes/api/task/[...segments].ts`
  - **方法:** GET, POST, PUT, DELETE
  - **功能:** 任务管理 (通配符路由)
  - **依赖:** 需要认证
  - **注意:** Catch-all 路由

- [ ] `app/api/agent/[...segments]/route.ts` → `routes/api/agent/[...segments].ts`
  - **方法:** GET, POST
  - **功能:** Agent 代理 (通配符路由)
  - **依赖:** 需要认证
  - **注意:** Catch-all 路由

---

## 🎯 推荐迁移顺序

### 第一批: 认证核心 (3 个)
完成完整的用户注册和登录流程
```
1. /api/auth/register
2. /api/auth/register/send
3. /api/auth/register/verify
```

### 第二批: 邮箱验证 (2 个)
完成邮箱验证功能
```
4. /api/auth/verify-email
5. /api/auth/verify-email/send
```

### 第三批: MFA 安全 (4 个)
完成多因素认证
```
6. /api/auth/mfa/setup
7. /api/auth/mfa/verify
8. /api/auth/mfa/status
9. /api/auth/mfa/disable
```

### 第四批: 用户管理 (2 个)
基本用户操作
```
10. /api/users
11. /api/admin/users/metrics
```

### 第五批: 管理功能 (2 个)
系统管理
```
12. /api/admin/settings
13. /api/admin/users/[userId]/role
```

### 第六批: 邮件系统 (7 个)
邮件功能
```
14-20. /api/mail/* (所有邮件相关)
```

### 第七批: AI 功能 (2 个)
AI 集成
```
21. /api/askai
22. /api/rag/query
```

### 第八批: 动态路由 (2 个)
复杂路由
```
23. /api/task/[...segments]
24. /api/agent/[...segments]
```

---

## 📝 迁移模板

### 基本 API Handler

```typescript
import { Handlers } from '$fresh/server.ts'
import { FreshState } from '@/middleware.ts'

export const handler: Handlers<unknown, FreshState> = {
  async POST(req, ctx) {
    // Check authentication
    if (!ctx.state.isAuthenticated) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const body = await req.json()

    // Business logic here

    // Return response
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
```

### 动态路由

```typescript
// routes/api/mail/message/[id].ts
export const handler: Handlers = {
  async GET(_req, ctx) {
    const { id } = ctx.params
    // Use id parameter
  },
}
```

### Catch-all 路由

```typescript
// routes/api/task/[...segments].ts
export const handler: Handlers = {
  async GET(_req, ctx) {
    const segments = ctx.params.segments.split('/')
    // segments 是数组: ['project', '123', 'tasks']
  },
}
```

---

## 🔧 通用迁移步骤

对每个 API 端点:

1. **创建文件**
   ```bash
   # Next.js
   app/api/auth/register/route.ts

   # Fresh
   routes/api/auth/register.ts
   ```

2. **导入依赖**
   ```typescript
   import { Handlers } from '$fresh/server.ts'
   import { FreshState } from '@/middleware.ts'
   import { /* helpers */ } from '@/lib/...'
   ```

3. **转换导出**
   ```typescript
   // Next.js
   export async function POST(request: NextRequest) { }

   // Fresh
   export const handler: Handlers = {
     async POST(req, ctx) { }
   }
   ```

4. **更新代码**
   - Request parsing: `new URL(req.url).searchParams`
   - Cookies: 使用 `@/lib/authGateway.deno.ts` helpers
   - State access: `ctx.state.user`, `ctx.state.isAuthenticated`
   - Response: 标准 `Response` API

5. **测试**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"pass"}'
   ```

---

## 📚 参考文档

- **API Migration Guide:** `docs/API_MIGRATION.md`
- **Middleware Documentation:** `middleware.ts:1-282`
- **Auth Gateway:** `lib/authGateway.deno.ts`
- **Service Config:** `server/serviceConfig.deno.ts`

---

## ⚡ 快速启动

```bash
# 查看当前 API 端点
curl http://localhost:8000/api/ping

# 测试认证
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# 查看会话
curl http://localhost:8000/api/auth/session \
  -H "Cookie: xc_session=TOKEN"
```

---

**最后更新:** 2025-11-04
**进度:** 8/29 完成 (27.6%)
