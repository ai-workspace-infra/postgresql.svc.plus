# `dashboard` Fresh + Deno + Zustand Migration Plan

## 1. 背景与目标
`dashboard` 目前基于 Next.js 14 App Router，并通过 React 组件、CMS 模板与特性开关组合出首页等页面。【F:dashboard/app/page.tsx†L1-L26】【F:dashboard/app/layout.tsx†L1-L31】
`AppProviders` 又嵌套多层上下文（语言、用户、主题、CMS 扩展），整体运行在 Node.js + React 18 环境。【F:dashboard/app/AppProviders.tsx†L1-L24】
构建/运行链路依赖 Yarn、Next CLI 与多份脚本，目标版本也在 `package.json` 的 `engines` 字段中锁定为 Node.js。【F:dashboard/package.json†L5-L19】

为了统一使用 Deno 生态、引入 Fresh 框架以及在客户端采用 Zustand 管理全局状态，本规划旨在：

- 拆解现有 Next.js + Node.js 假设，以及与 Fresh/Deno 的差异；
- 设计 Fresh 项目结构、渲染路径与数据加载方案，确保 CMS、下载中心等关键能力仍然可用；
- 在客户端抽取跨页面状态为共享的 Zustand store，减少依赖 React Context；
- 分阶段完成迁移，期间保持可回退、可验证的交付节奏。

## 2. 现状评估

### 2.1 App Router、上下文与页面结构
- 首页、租户空间等页面位于 `app/` 目录，依赖服务器组件和动态模板注入。【F:dashboard/app/page.tsx†L1-L26】
- 根布局通过 `AppProviders` 包裹语言、用户与主题 Provider，后者继续依赖 Zustand store 维护会话用户数据。【F:dashboard/app/AppProviders.tsx†L1-L24】【F:dashboard/lib/userStore.tsx†L1-L132】
- 邮件模块已存在独立的 `mail.store.ts`，证明项目内部对 Zustand 的使用模式可复用。【F:dashboard/app/store/mail.store.ts†L1-L46】

### 2.2 Node 绑定的构建链路
- 脚本命令全部调用 Next CLI、Vitest、Playwright 等 Node 工具，且通过 `node`/`tsx` 执行自定义脚本。【F:dashboard/package.json†L8-L19】
- Makefile、`start.sh` 与 Dockerfile 明确依赖 Node.js、Yarn 与 npm Registry；构建阶段亦输出静态导出给 Nginx 托管。【F:dashboard/Makefile†L7-L107】【F:dashboard/start.sh†L1-L19】【F:dashboard/Dockerfile†L1-L12】
- 配置文件使用 CommonJS，并直接引用 Node 内置模块（`path` 等），在 Deno/Fresh 环境需转换为 ESM 或动态导入。【F:dashboard/next.config.js†L6-L101】【F:dashboard/postcss.config.js†L1-L6】【F:dashboard/tailwind.config.js†L1-L24】【F:dashboard/vitest.config.ts†L1-L40】

### 2.3 内容构建与模板加载
- `src/templateRegistry.ts` 通过 `fs`、`path` 同步读取磁盘模板，依赖 CommonJS `require`；Fresh 环境需改写为异步模块加载或构建期预处理。【F:dashboard/src/templateRegistry.ts†L1-L120】
- 预构建脚本（`export-slugs.ts`、`scan-md.ts`、`fetch-dl-index.ts`）大量使用 Node `fs/promises`、`process`，并写入 `public/_build` 与下载目录。【F:scripts/export-slugs.ts†L1-L74】【F:scripts/scan-md.ts†L1-L63】
- 下载清单在运行时同步读取 JSON 文件，同样倚赖 Node `fs`。【F:dashboard/lib/download-manifest.ts†L1-L24】

### 2.4 API 路由与运行时配置
- Next API Routes 运行在 `runtime = 'nodejs'` 下，返回 JSON 供前端消费；Fresh 需改写为 Deno `Request`/`Response` 处理器。【F:dashboard/app/api/content-meta/route.ts†L1-L23】
- 前端运行时配置依赖 `process.env.NEXT_PUBLIC_*` 与全局变量切换环境/区域，需要在 Deno 中改造为 `Deno.env` 或构建期注入。【F:dashboard/config/runtime-client.ts†L1-L82】

### 2.5 状态管理与客户端依赖
- 用户信息等核心状态由自建 `userStore` + React Context 提供，需要在 Fresh + Zustand 方案中拆分为 store 与薄 Provider。【F:dashboard/lib/userStore.tsx†L1-L132】
- 其他页面多通过 SWR、局部状态管理数据，与 Fresh 的 Islands 模式兼容，但需确保库能够通过 `npm:` 或原生 Deno 导入。

## 3. Fresh + Deno + Zustand 目标架构

### 3.1 Fresh 项目骨架
1. 在仓库中新增 `dashboard-fresh/`（暂名），包含 `main.ts`, `fresh.gen.ts`, `routes/`, `islands/`, `static/` 等标准结构；并在 `deno.json` 中启用 `tasks`、`importMap` 指向 `npm:next` 替换项与 `npm:zustand`。【需新建】
2. 将 Next `app/` 路由映射到 Fresh `routes/`：
   - `app/page.tsx` → `routes/index.tsx`（读取 CMS 模板）；
   - `app/(tenant)/**` → `routes/(tenant)/**.tsx`，使用 Fresh `HandlerContext` 拉取数据；
   - `app/api/**` → `routes/api/**.ts`，直接返回 `Response`。
3. 在 `islands/` 中拆分需要交互的组件（如邮件、仪表盘 Widget），以保持 SSR + 客户端增强的 Fresh 模式。

### 3.2 构建与配置体系
1. 创建顶层 `deno.jsonc`，定义 `tasks`：`deno task dev`（调用 `deno run -A main.ts`）、`deno task build`（`deno run -A fresh-build.ts`）、`deno task lint/test` 等；添加 `compilerOptions` 与 `imports` 以取代现有 `tsconfig` 别名。【需新建】
2. 将 Tailwind/PostCSS 配置转为 ESM 模块，并在 Fresh 流程中通过 `deno task tw:build` 调用 `npm:tailwindcss` 生成 CSS。
3. 用 Deno 版 Makefile/脚本替换 Node 依赖：所有 CI 步骤改为调用 `deno task`，同时保留 Node 构建路径直至迁移完成。

### 3.3 内容与模板加载改造
1. 将 `templateRegistry` 拆为：
   - 构建期脚本使用 `Deno.readDir` 与 `import()` 构建模板索引；
   - 运行时通过 Deno `import` 动态加载模板或从预生成的 manifest 读取。
2. 重写 `export-slugs.ts`、`scan-md.ts`、`fetch-dl-index.ts` 为 Deno 脚本：
   - 使用 `std/fs`、`std/path` 处理文件；
   - 以 `Deno.cwd()`、`new URL(import.meta.url)` 处理路径；
   - 替换 `process.exit` 为抛错或 `Deno.exit`。
3. 对下载清单在构建阶段生成纯 JSON 模块（或放入 `static/` 目录），Fresh 路由通过 `import` 读取，避免运行时 `fs` 依赖。

### 3.4 API 层与后端集成
1. 为每个 Next API Route 创建等价的 Fresh handler，保留与 `dashboard/server/**` 模块的调用关系；使用 `fetch` 与 `Request`/`Response` API，确保边缘兼容。
2. 对需要认证 Cookie 的接口（如 `/api/auth/session`）设计 Fresh `middleware.ts`，将 Cookie 解析/刷新逻辑迁移到 Deno。
3. 若某些 Node-only 包（例如 `pdfjs-dist` 渲染）无法直接在 Fresh SSR 中运行，可转为客户端 Islands 或在构建阶段预渲染。

### 3.5 Zustand 状态基线
1. 抽取公共 store：会话用户（来自 `userStore`）、运行时环境（读取 `runtime-client`）、特性开关等，迁移至 `dashboard-fresh/stores/` 下的 `createXXXStore.ts`。
2. 在 Fresh `islands/` 中通过 Zustand hooks 访问共享状态，必要时封装 `<Provider>` 以兼容现有组件。
3. 邮件、下载等功能模块沿用或重构现有 Zustand 逻辑，将 `mail.store.ts` 迁移为岛组件专用 store，并与新的全局 store 解耦。

### 3.6 UI 组件与路由迁移策略
1. 采用“页面优先”迁移：先将静态内容页（文档、下载列表）迁至 Fresh，保持 React 组件和 CSS 基本不变；随后逐步迁移需要交互的管理面板。
2. 使用 Fresh `Head`、`Layout` 功能重建 `AppProviders` 逻辑，将语言、主题 Provider 改为 Zustand + Signals 或 Fresh 中间件注入。
3. CMS 模板可编译为 Preact 组件，仍放置在 `cms/` 下，通过构建脚本注入 Fresh 路由。

### 3.7 开发、测试与质量保证
1. 评估保留 Vitest（通过 `deno run -A npm:vitest`）还是迁移至 `deno test`，必要时编写兼容层加载 JSDOM。
2. 将 Playwright 测试改为通过 `deno run -A npm:playwright` 执行，或在迁移完成后替换为 Fresh 官方推荐方案。
3. 更新文档与脚本，指导开发者使用 `deno task dev`, `deno task test` 等命令，保留 Node 版本作为过渡 fallback。

### 3.8 部署与运维
1. 提供 Deno Deploy/Fresh 官方容器的部署示例：`FROM denoland/deno:alpine`，执行 `deno task build` + `deno task start`。
2. 迁移 Terraform/Helm 等部署文件，确保环境变量通过 `deno.json` 与 `deployctl` 注入；同时更新 `start.sh`、Dockerfile，保留 Node 版本作为灰度备份。
3. 在 CI 管道中引入 Deno 缓存与 `deno task lint`，并调整制品（静态资源、manifests）输出目录。

## 4. 分阶段实施路线

| 阶段 | 目标 | 关键输出 | 前置条件 |
| --- | --- | --- | --- |
| 0 | 建立 Deno/Fresh 骨架 | `deno.json(c)`、Fresh 基础目录、`deno task dev` 可启动 Hello World | 无 |
| 1 | 共存期：内容页迁移 | Fresh routes 提供首页、下载、文档的静态渲染；Node 版保留功能测试 | 阶段0 |
| 2 | API + CMS 适配 | Fresh handler 替换核心 API，`templateRegistry`、构建脚本完成 Deno 化 | 阶段1 |
| 3 | Zustand 重构 | 会话、运行时、特性等全局状态迁移到共享 store，并与 Fresh Islands 对接 | 阶段2 |
| 4 | 运维与部署 | Deno 容器/Deploy 工作流上线，Node 版本进入维护模式 | 阶段3 |
| 5 | 收尾 & 清理 | 移除 Next.js 目录、废弃脚本，更新所有文档与脚手架 | 阶段4 |

## 5. 风险与注意事项
- **Fresh 框架特性差异**：缺少内建的服务器组件与 App Router，需要重构布局/数据获取逻辑；可通过 Islands + 服务器端 handler 模式逐步替代。【设计考量】
- **第三方依赖兼容性**：例如 `pdfjs-dist`、`react-grid-layout` 等包依赖 Node 构建工具，可能需要改用 `esm.sh`、`skypack` 或自建打包；必要时将其限制在客户端 Islands 中。【F:dashboard/package.json†L20-L38】
- **构建脚本迁移成本**：大量 Node 工具需改写为 Deno 版本，需预留自动化测试验证生成文件是否一致。【F:scripts/export-slugs.ts†L1-L74】【F:scripts/scan-md.ts†L1-L63】
- **团队协作与培训**：Fresh/Deno 与 Next.js 开发体验不同，需要补充文档、工作流示例，并在迁移过程中保持双运行时以降低学习曲线。

---

> 本规划会随迁移进度更新，执行团队请记录阻碍与修复方案，以便迭代 Fresh + Deno + Zustand 的最佳实践。
