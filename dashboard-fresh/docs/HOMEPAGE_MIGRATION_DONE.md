# 首页迁移完成 + API 端点清单

## ✅ 已完成工作

### 1. 首页迁移 (routes/index.tsx)

**从:** `app/page.tsx`
**到:** `routes/index.tsx`

#### 功能特性
- ✅ Fresh Handlers 支持服务端渲染
- ✅ 动态模板加载 (CMS Experience)
- ✅ 回退到默认首页
- ✅ 使用 Fresh `<Head>` 组件
- ✅ 集成 `ProductMatrix`, `ArticleFeed`, `Sidebar` 组件
- ✅ 美观的默认首页设计

#### 页面结构
1. **Hero Section** - 产品介绍和 CTA
2. **Features Grid** - 3个核心功能展示
3. **CTA Section** - 注册/登录引导

#### 关键代码
```typescript
export const handler: Handlers<HomePageData, FreshState> = {
  async GET(_req, ctx) {
    const useTemplate = isFeatureEnabled('cmsExperience', '/homepage/dynamic')
    let template = null
    if (useTemplate) {
      template = await getActiveTemplate()
    }
    return ctx.render({ useTemplate, template })
  },
}
```

### 2. 布局迁移 (routes/_app.tsx)

**从:** `app/layout.tsx`
**到:** `routes/_app.tsx`

#### 更新内容
- ✅ Fresh `PageProps` 类型
- ✅ HTML 元数据 (title, description)
- ✅ Global CSS 链接 (`/app/globals.css`)
- ✅ Favicon 支持
- ✅ CSS 变量支持 (`--color-background`, `--color-text`)

---

## 📋 API 端点迁移清单

### 进度概览
- **总计:** 29 个 API 端点
- **已完成:** 8 个 (27.6%)
- **待迁移:** 21 个 (72.4%)

### ✅ 已完成 (8/29)

| API 端点 | Fresh 路由 | 状态 |
|---------|-----------|------|
| `/api/ping` | `routes/api/ping.ts` | ✅ |
| `/api/templates` | `routes/api/templates.ts` | ✅ |
| `/api/docs` | `routes/api/docs.ts` | ✅ |
| `/api/downloads` | `routes/api/downloads.ts` | ✅ |
| `/api/render-markdown` | `routes/api/render-markdown.ts` | ✅ |
| `/api/content-meta` | `routes/api/content-meta.ts` | ✅ |
| `/api/auth/login` | `routes/api/auth/login.ts` | ✅ |
| `/api/auth/session` | `routes/api/auth/session.ts` | ✅ |

### 📋 待迁移 (21/29)

#### 🔐 认证相关 (7个) - 高优先级

| Next.js 路由 | Fresh 目标 | 优先级 |
|-------------|-----------|--------|
| `app/api/auth/register/route.ts` | `routes/api/auth/register.ts` | P0 |
| `app/api/auth/register/send/route.ts` | `routes/api/auth/register/send.ts` | P0 |
| `app/api/auth/register/verify/route.ts` | `routes/api/auth/register/verify.ts` | P0 |
| `app/api/auth/verify-email/route.ts` | `routes/api/auth/verify-email.ts` | P1 |
| `app/api/auth/verify-email/send/route.ts` | `routes/api/auth/verify-email/send.ts` | P1 |
| `app/api/auth/mfa/setup/route.ts` | `routes/api/auth/mfa/setup.ts` | P2 |
| `app/api/auth/mfa/verify/route.ts` | `routes/api/auth/mfa/verify.ts` | P2 |
| `app/api/auth/mfa/status/route.ts` | `routes/api/auth/mfa/status.ts` | P2 |
| `app/api/auth/mfa/disable/route.ts` | `routes/api/auth/mfa/disable.ts` | P2 |

#### 👥 用户 & 管理 (4个) - 中优先级

| Next.js 路由 | Fresh 目标 | 优先级 |
|-------------|-----------|--------|
| `app/api/users/route.ts` | `routes/api/users.ts` | P1 |
| `app/api/admin/settings/route.ts` | `routes/api/admin/settings.ts` | P2 |
| `app/api/admin/users/metrics/route.ts` | `routes/api/admin/users/metrics.ts` | P2 |
| `app/api/admin/users/[userId]/role/route.ts` | `routes/api/admin/users/[userId]/role.ts` | P2 |

#### 📧 邮件系统 (7个) - 中优先级

| Next.js 路由 | Fresh 目标 | 优先级 |
|-------------|-----------|--------|
| `app/api/mail/inbox/route.ts` | `routes/api/mail/inbox.ts` | P2 |
| `app/api/mail/send/route.ts` | `routes/api/mail/send.ts` | P2 |
| `app/api/mail/namespace/route.ts` | `routes/api/mail/namespace.ts` | P2 |
| `app/api/mail/message/[id]/route.ts` | `routes/api/mail/message/[id].ts` | P2 |
| `app/api/mail/ai/summarize/route.ts` | `routes/api/mail/ai/summarize.ts` | P3 |
| `app/api/mail/ai/reply-suggest/route.ts` | `routes/api/mail/ai/reply-suggest.ts` | P3 |
| `app/api/mail/ai/classify/route.ts` | `routes/api/mail/ai/classify.ts` | P3 |

#### 🤖 AI & 动态路由 (4个) - 低优先级

| Next.js 路由 | Fresh 目标 | 优先级 |
|-------------|-----------|--------|
| `app/api/askai/route.ts` | `routes/api/askai.ts` | P3 |
| `app/api/rag/query/route.ts` | `routes/api/rag/query.ts` | P3 |
| `app/api/task/[...segments]/route.ts` | `routes/api/task/[...segments].ts` | P3 |
| `app/api/agent/[...segments]/route.ts` | `routes/api/agent/[...segments].ts` | P3 |

---

## 📊 当前状态

### Fresh 应用结构

```
routes/
├── _app.tsx                    ✅ 布局组件
├── _404.tsx                    ✅ 404页面
├── _500.tsx                    ✅ 错误页面
├── index.tsx                   ✅ 首页（新）
└── api/
    ├── ping.ts                 ✅
    ├── templates.ts            ✅
    ├── docs.ts                 ✅
    ├── downloads.ts            ✅
    ├── render-markdown.ts      ✅
    ├── content-meta.ts         ✅
    └── auth/
        ├── login.ts            ✅
        └── session.ts          ✅
```

### 访问测试

```bash
# 启动开发服务器
make dev

# 访问首页
open http://localhost:8000

# 测试 API
curl http://localhost:8000/api/ping
```

### 预期效果

**首页将显示:**
1. CloudNative Suite 品牌和标题
2. 3个核心功能卡片
   - Fast Deployment
   - Secure by Default
   - Real-time Monitoring
3. 注册/登录 CTA 按钮

**样式:**
- 紫色主题 (purple-600)
- 渐变背景 (purple-50 → blue-50)
- 卡片阴影和悬停效果
- 响应式布局

---

## 🎯 下一步推荐

### 选项 1: 完成认证流程 (推荐)
迁移注册相关的 3 个 API 端点，使用户可以完整注册：
```bash
1. /api/auth/register
2. /api/auth/register/send
3. /api/auth/register/verify
```

### 选项 2: 迁移认证页面
迁移登录和注册页面让用户可以访问：
```bash
app/(auth)/login/page.tsx → routes/login/index.tsx
app/(auth)/register/page.tsx → routes/register/index.tsx
```

### 选项 3: 批量迁移 API
按优先级批量迁移所有 P0 和 P1 API 端点。

---

## 📚 相关文档

- **完整 API 清单:** `docs/API_ENDPOINTS_TODO.md`
- **API 迁移指南:** `docs/API_MIGRATION.md`
- **路由清理报告:** `docs/CLEANUP_REPORT.md`
- **Makefile 使用:** `docs/MAKEFILE_MIGRATION.md`

---

## 🚀 快速验证

### 1. 启动开发服务器
```bash
make dev
# 或
deno task dev
```

### 2. 访问首页
```bash
open http://localhost:8000
```

### 3. 查看源码
```bash
# 首页
cat routes/index.tsx

# 布局
cat routes/_app.tsx

# API
cat routes/api/auth/login.ts
```

---

**状态:** ✅ 首页和布局迁移完成
**API 进度:** 8/29 (27.6%)
**下一步:** 迁移认证 API 或认证页面

**最后更新:** 2025-11-04


📊 app/ 目录迁移情况总结

  ✅ 已迁移到 routes/ (约 18%)

  | app/ 路径                  | routes/ 路径        | 状态             |
  |--------------------------|-------------------|----------------|
  | page.tsx (首页)            | index.tsx         | ✅ 已迁移          |
  | (auth)/login/page.tsx    | login.tsx         | ✅ 已迁移          |
  | (auth)/register/page.tsx | register.tsx      | ✅ 已迁移          |
  | panel/page.tsx           | panel/index.tsx   | ✅ 已迁移          |
  | panel/account/page.tsx   | panel/account.tsx | ✅ 已迁移          |
  | panel/mail/page.tsx      | panel/mail.tsx    | ✅ 已迁移          |
  | 404/page.tsx             | _404.tsx          | ✅ 已迁移          |
  | API 路由                   | api/*             | ✅ 部分迁移 (12/29) |

  ❌ 未迁移 (约 82%)

  认证相关

  - (auth)/email-verification/page.tsx - 邮箱验证页面

  租户/邮件系统 (4 个页面)

  - (tenant)/[tenantId]/mail/page.tsx - 邮件列表
  - (tenant)/[tenantId]/mail/compose/page.tsx - 撰写邮件
  - (tenant)/[tenantId]/mail/message/[id]/page.tsx - 邮件详情
  - (tenant)/[tenantId]/mail/settings/page.tsx - 邮件设置

  文档系统 (3 个页面)

  - docs/page.tsx - 文档首页
  - docs/[collection]/page.tsx - 文档集合
  - docs/[collection]/[version]/page.tsx - 文档版本

  下载中心 (2 个页面)

  - download/page.tsx - 下载首页
  - download/[...segments]/page.tsx - 动态下载路径

  演示/Demo (3 个页面)

  - demo/page.tsx - 演示首页
  - demo/theme/page.tsx - 主题演示
  - demo/markdown/page.tsx - ⚠️ 已损坏（引用了已删除的 ui/）

  云 IaC (3 个页面)

  - cloud_iac/page.tsx - IaC 首页
  - cloud_iac/[provider]/page.tsx - 云供应商
  - cloud_iac/[provider]/[service]/page.tsx - 云服务

  洞察工作台

  - insight/page.tsx - 洞察工作台

  其他

  - logout/page.tsx - 登出页面

  用户面板子页面 (6 个)

  - panel/agent/page.tsx - Agent 管理
  - panel/api/page.tsx - API 管理
  - panel/appearance/page.tsx - 外观设置
  - panel/ldp/page.tsx - LDP 页面
  - panel/management/page.tsx - 管理页面
  - panel/subscription/page.tsx - 订阅管理

  ---
  🎯 结论

  ❌ app/ 目录的功能还没有完全迁移！

  - 已迁移: ~18% (主要是首页、登录注册、部分面板页面)
  - 未迁移: ~82% (大量功能模块)
  - API 迁移: 41.4% (12/29 个端点)