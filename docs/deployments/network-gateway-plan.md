# svc.plus 三层网关与域名规划

本文档描述 `svc.plus` 在生产与测试环境下的前端、网关与后端服务拆分方案，确保请求路径、域名与安全策略保持一致。架构遵循「Internet → Nginx/OpenResty → Next.js BFF → Go 后端」的分层原则。

## 1. 总体拓扑

```
Internet
   │ 443/TLS
   ▼
┌──────────────────────────────┐
│ Nginx / OpenResty            │
│ • TLS / HTTP2 / HSTS         │
│ • Gzip / 缓存 / 访问控制       │
│ • 按域名与路径分流             │
└──────────────────────────────┘
                 │ 3001 (intranet)
                 ▼
┌──────────────────────────────┐
│ Next.js Dashboard (BFF)      │
│ • SSR / UI / i18n            │
│ • /api/auth/*、/api/agent/*  │
│   统一转发与会话校验          │
└──────────────────────────────┘
        ├──────────────────┬──────────────────┤
        ▼                  ▼
┌───────────────┐   ┌────────────────┐
│ accounts.svc  │   │ api.svc        │
│ Go @ :8080    │   │ Go @ :8090     │
│ Auth / MFA 等 │   │ Agent / Task   │
└───────────────┘   └────────────────┘
```

## 2. 域名与端口映射

| 域名 | 环境 | 内部转发 | 主要路径 | 说明 |
| --- | --- | --- | --- | --- |
| `www.svc.plus` | 生产 | `http://127.0.0.1:3001` | `/`, `/api/*` | Dashboard 入口；所有认证与 Agent API 先进入 Next.js。 |
| `dev.svc.plus` | 测试（SIT） | `http://127.0.0.1:3001` | `/`, `/api/*` | 测试版 Dashboard，逻辑与生产一致。 |
| `accounts.svc.plus` | 生产 | `http://127.0.0.1:8080` | `/api/auth/*` | Go 账号服务，供 BFF 或第三方系统调用。 |
| `accounts-dev.svc.plus` | 测试 | `http://127.0.0.1:8080` | `/api/auth/*` | 测试账号服务，TLS 证书沿用 `*.svc.plus`。 |
| `api.svc.plus` | 生产 | `http://127.0.0.1:8090` | `/api/agent/*`, `/api/task/*` | Go 业务服务；BFF 也会访问该地址。 |
| `dev-api.svc.plus` | 测试 | `http://127.0.0.1:8090` | `/api/agent/*`, `/api/task/*` | 测试版业务服务。 |
| `dl.svc.plus` | 全部 | 静态目录 | `/packages/*` | 离线包及大体积静态文件，直接由 Nginx 提供。 |
| `docs.svc.plus` | 全部 | 静态目录 | `/*` | 文档与门户，完全静态化部署。 |

> **命名规范**：测试域名前缀统一使用 `dev-`（例如 `dev-api.svc.plus`、`accounts-dev.svc.plus`），便于证书与路由管理。

## 3. 路由策略

| 分类 | 路由策略 | 原因 |
| --- | --- | --- |
| Auth 类 (`/api/auth/*`) | 必经 Next.js，由 BFF 校验并注入 `xc_session` 等 Cookie，再转发至账号服务。 | 防止浏览器直接暴露账号服务，集中会话治理。 |
| Agent / Task (`/api/agent/*`, `/api/task/*`) | 浏览器流量先到 Next.js，由 BFF 附加用户上下文后转发；机器到机器调用可以直接命中 `api.svc.plus`。 | 平衡性能与权限控制。 |
| 静态资源 (`/_next/static/*`, `/public/*`) | 由 Nginx/OpenResty 缓存与压缩，Next.js 仅负责构建。 | 减少 Node 负载。 |
| 离线包/下载 (`/packages/*`) | 独立域名 `dl.svc.plus`，支持大文件断点续传与 CDN。 | 避免 Next.js 进程被大文件占用。 |
| 文档 (`docs.svc.plus`) | 完全静态化，不经过 Node。 | 降低安全面。 |

## 4. 配置要点

### 4.1 Nginx/OpenResty

- 在 `http` 块内声明复用连接的 `upstream`：`next_dashboard`（3001）、`account_service`（8080）、`api_service`（8090）。
- `www.svc.plus` / `dev.svc.plus` 站点：
  - `/_next/static/`、`/public/` 直接回源 Next.js 并开启长缓存。
  - `/api/auth/*`、`/api/agent/*`、`/api/task/*` 统一代理至 Next.js，由 BFF 处理。
  - 其余 `/api/*` 若为透传接口，可按需再细分到 `api_service`。
- 子域名 `accounts*.svc.plus`、`api*.svc.plus` 独立 `server`，启用 HSTS、CORS 及必要的超时时间。

### 4.2 Next.js Dashboard

- 默认监听 `3001`，保持 `compress: false`，由 Nginx 提供压缩。
- 在 `next.config.js` 中：
  - 启用 `httpAgentOptions.keepAlive`，减少对 Go 服务的建立连接开销。
  - 通过 `headers()` 对 `/api/*` 设置 `Cache-Control: no-store`，避免代理层缓存敏感数据。
- BFF 侧新增 `/api/agent/*` 与 `/api/task/*` Catch-all Route，复用会话信息并将请求转发给 `api_service`。

### 4.3 Go 后端

- `accounts` 服务负责认证、MFA、密码重置，不直接暴露在 Dashboard 主域名下。
- `api` 服务聚合 Agent、任务、日志等业务接口，可接受来自 BFF 或专用域名的调用。
- 两个服务都暴露 `/metrics`，供 `otel.svc.plus` 或 Prometheus 抓取。

## 5. 监控与证书

- TLS 统一使用 `*.svc.plus` 泛域名证书，可覆盖测试与生产子域。
- Prometheus 抓取地址建议：
  - `https://accounts.svc.plus/metrics`
  - `https://api.svc.plus/metrics`
- BFF 层应在日志中记录 `X-Request-ID` / `X-B3-TraceId` 等链路标识，便于串联 Nginx 与后端日志。

## 6. 变更清单

- 测试环境沿用 `dev-` 前缀的域名，配置与生产一致，仅监听端口与证书路径不同。
- Nginx 示例文件（`example/prod/nginx`、`example/sit/nginx`、`example/macos/openresty`）已按上述策略更新，部署时可直接替换原有示例并根据实际路径调整证书位置。

