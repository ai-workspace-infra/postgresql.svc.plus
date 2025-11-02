# Dashboard Mail Module Planning / Dashboard 邮件模块规划

## Overview / 概览
This document outlines the proposed dashboard mail module that integrates a multi-tenant
email experience with tenant-scoped AI assistance. The design aligns with the user's
requirement of keeping the mail capabilities cohesive inside the dashboard and enforcing
tenant isolation end-to-end. / 本文档概述了在 Dashboard 中集成多租户邮件体验和租户级
AI 助手的规划方案，满足“邮件子模块”高内聚的目标，并在前后端全链路落实租户隔离。

## Frontend Structure (Next.js) / 前端目录结构（Next.js）
```
dashboard/app/
│  ├ mail/
│  ├─ (tenant)/[tenantId]/mail/
│  │  ├─ page.tsx                # Inbox view 列表 + 过滤 + 分页
│  │  ├─ compose/page.tsx        # Compose / Reply / Forward
│  │  ├─ settings/page.tsx       # Account mapping, signatures, aliases, keys
│  │  └─ message/[id]/page.tsx   # Message detail with AI summary & smart reply
│  └─ api/
│     └─ mail/                   # Edge proxy or upload signature (optional)
├─ components/mail/
│  ├─ Inbox.tsx
│  ├─ MessageItem.tsx
│  ├─ MessageView.tsx
│  ├─ ComposeForm.tsx
│  └─ Toolbar.tsx
├─ lib/
│  ├─ apiClient.ts               # Fetch helper with tenant context
│  ├─ auth.ts                    # OIDC/JWT parsing, inject tenantId/userId
│  └─ types.ts                   # Shared TS types (Message, Thread, Label, etc.)
└─ store/
   └─ mail.store.ts              # Lightweight state for query/filter/page
```

### Frontend Guidelines / 前端要点
- URL paths carry the `tenantId` explicitly and are validated against the `tid` field in
  the authenticated JWT. / URL 显式携带 `tenantId` 并与 JWT 中的 `tid` 校验一致。
- Every backend request attaches an `x-tenant-id` header; the backend re-checks the
  header against JWT claims. / 所有后端请求都加 `x-tenant-id` 头部，后端二次比对。
- Large attachments use S3 direct uploads. The frontend obtains a pre-signed URL from the
  backend, then performs a `PUT` directly to S3 to avoid saturating the backend. /
  大附件通过后端获取预签名 URL 后直接 PUT 到 S3，减少后端带宽占用。
- Components keep AI-specific render logic (summary, reply suggestions) inside
  `MessageView` while surfacing controls via `Toolbar`. / AI 摘要与智能回复逻辑在
  `MessageView` 内封装，通过 `Toolbar` 暴露交互控件。

## Backend Service Layout (Go) / 后端服务目录结构（Go）
```
cmd/mailapi/main.go
internal/
  auth/
    middleware.go          # JWT/OIDC validation, inject tid/uid into context
  imap/
    client.go              # Dovecot IMAPS (emersion/go-imap)
    fetch.go               # Listing, fetch, read-state updates
    flags.go               # Star, archive, delete
  smtp/
    sender.go              # SMTPS 465 (emersion/go-smtp or SMTP AUTH)
  s3/
    presign.go             # Upload/download presigned URLs
  ai/
    summarizer.go          # Summaries, highlights, action items
    classifier.go          # Auto labeling & priority tagging
    reply_suggest.go       # Smart replies (few-shot prompts)
    namespace.go           # Tenant-scoped models, quotas, vector stores, logs
  search/
    indexer.go             # Optional metadata indexing (PG/Meilisearch)
  http/
    server.go              # chi/fiber/gin wrapper
    handlers.go            # HTTP route registration
  core/
    types.go               # Message, Thread, Attachment, AIResult, etc.
    config.go              # TLS/S3/IMAP/SMTP/AI configuration
    logger.go              # Shared structured logging helpers
```

### Backend Operations / 后端运行模型
- Communicate with Dovecot via IMAPS (port 993) and with Postfix via SMTPS (port 465 or
  587 + STARTTLS). / 与 Dovecot 通过 IMAPS:993，Postfix 通过 SMTPS:465 或 587+STARTTLS。
- The backend never exposes raw IMAP/SMTP credentials to the frontend; all mail access is
  proxied through the API. / 后端不向前端泄露 IMAP/SMTP 凭证，通过 API 统一代理。
- Each tenant receives an isolated AI namespace managed in `ai/namespace.go`, covering
  model choice, temperature, rate limits, vector indices, and audit logging. / 每个租户在
  `ai/namespace.go` 中拥有独立的模型、温度、速率限制、向量索引与日志策略。
- Tenant and user boundaries are enforced in `auth/middleware.go` by validating `tid` and
  `uid` claims on every request. / `auth/middleware.go` 统一校验 `tid` 与 `uid`，保证权限边界。

## HTTP API Contract / HTTP API 设计
All endpoints require `Authorization: Bearer <JWT>` and `x-tenant-id` headers, where the
header must match the JWT `tid`. / 所有请求必须携带 `Authorization: Bearer <JWT>` 与
`x-tenant-id`，且后者需与 JWT 中的 `tid` 一致。

### Mail Core / 邮件核心
- `GET /v1/mail/inbox?cursor=&pageSize=&label=&q=` — Returns a paginated inbox with light
  summaries and unread counts. / 返回分页收件箱、摘要与未读计数。
- `GET /v1/mail/message/:id` — Returns message body (HTML/text), attachments, cached AI
  summaries. / 返回邮件正文、附件元信息及缓存的 AI 摘要。
- `POST /v1/mail/send` — Sends mail through SMTPS and persists to the Sent folder. /
  通过 SMTPS 发送邮件并写入已发送。
- `DELETE /v1/mail/message/:id` — Moves to trash or marks deleted. / 标记删除或移动到废纸篓。

### Attachment Flows / 附件直传
- `POST /v1/mail/attachments/presign` — Request S3 upload URL for large attachments. /
  获取大附件直传 S3 的预签名 URL。
- `GET /v1/mail/attachments/:key/presign` — Fetch download URLs for existing attachments.
  / 获取附件下载签名 URL。

### AI Namespace APIs / AI 命名空间接口
- `POST /v1/ai/mail/summarize` — Summaries, bullet points, actions, tone analysis. /
  输出摘要、要点、行动项与语气分析。
- `POST /v1/ai/mail/reply-suggest` — Generates three draft replies given style and
  language preferences. / 根据风格与语言返回三条智能草稿。
- `POST /v1/ai/mail/classify` — Applies tenant-tuned labels such as Billing or Incident.
  / 自动打标签（计费、故障、人力、垃圾等）。
- `POST /v1/ai/mail/thread-digest` — Produces a thread-level digest with timeline. /
  输出会话摘要与时间线要点。
- `GET /v1/ai/namespace` — Returns the tenant's AI configuration and quota status. /
  查看租户 AI 配置与配额。
- `PUT /v1/ai/namespace` — Tenant admins update model, temperature, max tokens, and
  policies (e.g., sensitive-word restrictions). / 租户管理员修改模型、温度、最大 Token 与
  敏感词策略。

## Infrastructure Notes / 基础设施要点
- Domain separation: `smtp.svc.plus`, `imap.svc.plus`, `mail.svc.plus`, with wildcard TLS
  (`*.svc.plus`) via Let’s Encrypt or imported certificates. / 域名分离：`smtp.svc.plus`,
  `imap.svc.plus`, `mail.svc.plus`，TLS 使用 `*.svc.plus` 通配符证书。
- Adjust `stalwart.toml` to map SMTP/IMAP hostnames and keep DNS A records aligned for all
  three domains. / 在 `stalwart.toml` 中区分 SMTP/IMAP 主机名，并保持 DNS A 记录同步。
- The Web UI remains dashboard-driven; stalwart’s native UI stays disabled as a placeholder.
  / WebUI 以 Dashboard 为中心，stalwart 原生界面保持关闭占位状态。

## Integration Checklist / 集成检查清单
1. Implement the Next.js routes and components following the tenant-aware structure. /
   按租户结构实现 Next.js 路由与组件。
2. Wire `apiClient.ts` to automatically inject `Authorization` and `x-tenant-id` headers. /
   `apiClient.ts` 自动注入认证与租户头部。
3. Stand up the Go mail API with middleware enforcing tenant isolation and TLS-only
   upstream connections. / 部署 Go 邮件 API，确保中间件与 TLS-only 上游链路。
4. Configure S3 buckets, IAM roles, and stalwart connectors for attachment handling. /
   配置 S3、IAM 与 stalwart 附件处理。
5. Provision AI namespace defaults per tenant (model, temperature, quotas) and surface the
   settings page for admins. / 为每个租户设置 AI 命名空间默认值，并在设置页展示给管理员。
6. Validate end-to-end flows: inbox load, message view with AI summary, compose/send,
   attachments, and AI reply/classification actions. / 验证全链路：收件箱、AI 摘要、写信发送、
   附件、智能回复与分类。
