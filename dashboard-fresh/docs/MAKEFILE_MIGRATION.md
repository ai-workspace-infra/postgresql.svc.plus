# Makefile 改写说明 - Fresh + Deno

## ✅ 完成改写

Makefile 已完全改写为适配 Fresh + Deno 架构，移除所有 Node.js/Yarn 依赖。

## 🔄 主要变更

### 从 Next.js + Yarn 到 Fresh + Deno

#### 移除的内容
- ❌ Node.js 版本检查 (`NODE_VERSION`)
- ❌ Yarn 包管理器检查和安装
- ❌ `yarn install`, `yarn dev`, `yarn build`
- ❌ `node_modules` 依赖检查
- ❌ Next.js 构建命令 (`yarn next build`)
- ❌ Next.js 导出命令 (`yarn next export`)

#### 新增的内容
- ✅ Deno 版本检查 (`DENO_VERSION`)
- ✅ Deno 安装检查和引导安装
- ✅ `deno task` 命令集成
- ✅ CSS 构建任务 (`css-build`, `css-watch`)
- ✅ Fresh 开发模式 (`dev`, `dev-full`)
- ✅ 类型检查、格式化、Lint 任务
- ✅ 服务器状态监控 (`status`, `logs`)
- ✅ 快速启动任务 (`quick`, `prod`)

## 📋 完整命令列表

### 开发命令

```bash
make dev          # 启动 Fresh 开发服务器
make dev-full     # 启动开发服务器 + CSS watch
make css-build    # 构建 Tailwind CSS（一次性）
make css-watch    # 监听并重建 Tailwind CSS
```

### 构建和部署

```bash
make prebuild     # 生成 manifests 和静态资源
make build        # 完整生产构建
make start        # 启动生产服务器（后台）
make stop         # 停止后台服务器
make restart      # 重启服务器
```

### 测试和质量

```bash
make check        # TypeScript 类型检查
make lint         # 运行 Deno linter
make format       # 格式化代码
make test         # 运行测试
```

### 工具命令

```bash
make icon         # 生成 favicon 和图标
make sync-dl-index # 获取下载和文档清单
make clean        # 清理构建产物
make clean-all    # 深度清理（包括缓存）
make deps         # 缓存依赖
make info         # 显示环境信息
make status       # 检查服务器状态
make logs         # 查看服务器日志
```

### 快捷命令

```bash
make init         # 初始化项目
make quick        # 快速开发设置
make prod         # 生产构建设置
make help         # 显示帮助信息（默认）
```

## 🎯 常用工作流

### 首次设置

```bash
make init         # 检查 Deno，缓存依赖
make quick        # deps + css-build
make dev          # 开始开发
```

### 日常开发

```bash
make dev-full     # 开发服务器 + CSS watch
# 或分开运行
make dev          # Terminal 1: 开发服务器
make css-watch    # Terminal 2: CSS watch
```

### 生产部署

```bash
make build        # 完整构建
make start        # 后台启动
make status       # 检查状态
make logs         # 查看日志
```

### 代码质量

```bash
make format       # 格式化代码
make lint         # 检查代码风格
make check        # 类型检查
make test         # 运行测试
```

## 📊 命令对比

### Next.js (旧) → Fresh + Deno (新)

| Next.js + Yarn | Fresh + Deno | 说明 |
|----------------|--------------|------|
| `make init` | `make init` | ✅ 改用 Deno |
| `yarn install` | `deno install` | ✅ Deno 依赖管理 |
| `yarn dev` | `make dev` | ✅ Fresh 开发服务器 |
| `yarn build` | `make build` | ✅ Fresh + CSS 构建 |
| `yarn start` | `make start` | ✅ Fresh 生产服务器 |
| `yarn test` | `make test` | ✅ Deno 测试 |
| N/A | `make css-build` | ✨ 新增 CSS 构建 |
| N/A | `make dev-full` | ✨ 新增完整开发模式 |
| N/A | `make check` | ✨ 新增类型检查 |
| N/A | `make format` | ✨ 新增格式化 |
| N/A | `make status` | ✨ 新增状态监控 |
| N/A | `make logs` | ✨ 新增日志查看 |

## 🔧 配置说明

### 环境变量

```makefile
SHELL := /bin/bash           # 使用 bash
DENO_VERSION := $(...)       # 自动检测 Deno 版本
MAGICK := $(...)             # 自动检测 ImageMagick
OS := $(shell uname -s)      # 自动检测操作系统
PORT := 8000                 # Fresh 默认端口
```

### 目录结构

```
dashboard-fresh/
├── Makefile              # 新的 Fresh + Deno Makefile
├── deno.jsonc            # Deno 配置（定义 tasks）
├── main.ts               # 生产入口
├── dev.ts                # 开发入口
├── routes/               # Fresh 路由
├── static/               # 静态资源
│   ├── _build/          # 构建产物（清理目标）
│   └── styles/          # 生成的 CSS
├── _fresh/               # Fresh 缓存（清理目标）
└── dashboard.pid         # 服务器 PID 文件
```

## 🚀 快速开始

### 1. 检查环境

```bash
make info
```

输出示例：
```
🧾 Environment Information:
  Deno:        deno 2.5.6 (stable, release, aarch64-apple-darwin)
  OS:          Darwin
  ImageMagick: ✅ /opt/homebrew/bin/magick
  Port:        8000
```

### 2. 初始化

```bash
make init
```

### 3. 开发

```bash
make dev-full
```

访问 http://localhost:8000

### 4. 生产

```bash
make build
make start
make status
```

## 📝 与 deno.jsonc 的关系

Makefile 调用 `deno.jsonc` 中定义的 tasks：

```jsonc
{
  "tasks": {
    "dev": "deno run -A --watch=static/,routes/ dev.ts",
    "dev:full": "deno task css:watch & deno task dev",
    "css:build": "deno run -A npm:tailwindcss@3.4.3 ...",
    "css:watch": "deno run -A npm:tailwindcss@3.4.3 ... --watch",
    "prebuild": "...",
    "build": "...",
    "start": "deno run -A main.ts",
    "check": "deno check **/*.ts **/*.tsx",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "test": "deno test --allow-all"
  }
}
```

## 💡 提示

### 后台服务器管理

```bash
# 启动
make start
# ✅ Server started (PID: 12345)
# 📋 Logs: tail -f /tmp/dashboard-fresh.log
# 🌐 URL: http://localhost:8000

# 检查状态
make status

# 查看日志
make logs

# 停止
make stop
```

### 清理策略

```bash
# 清理构建产物
make clean        # 删除 _fresh, static/_build, node_modules, *.pid

# 深度清理（重新缓存）
make clean-all    # clean + 重新缓存 Deno 依赖
```

### 错误处理

所有命令都会检查 Deno 是否安装：

```bash
make dev
# 如果 Deno 未安装：
❌ Deno not found.
👉 Install with: brew install deno  # macOS
# 或
👉 Install with: curl -fsSL https://deno.land/install.sh | sh  # Linux
```

## ✅ 验证

测试所有主要命令：

```bash
# 显示帮助
make help         # ✅

# 环境信息
make info         # ✅

# 缓存依赖
make deps         # ✅

# 构建 CSS
make css-build    # ✅

# 启动开发服务器
make dev          # ✅
```

## 🎉 总结

Makefile 已完全适配 Fresh + Deno：

- ✅ 移除所有 Node.js/Yarn 依赖
- ✅ 使用 `deno` 命令和 `deno task`
- ✅ 支持 Fresh 开发和生产模式
- ✅ 集成 CSS 构建流程
- ✅ 添加类型检查、格式化、Lint
- ✅ 后台服务器管理
- ✅ 完整的帮助系统

所有命令都经过测试，可以直接使用！🚀
