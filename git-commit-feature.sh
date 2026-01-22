#!/bin/bash
# git-commit-feature.sh
# 创建特性分支并提交所有更改

set -e

FEATURE_BRANCH="feature/postgresql-service-plus-refactor"
COMMIT_MESSAGE="feat: PostgreSQL Service Plus - 精简和增强

核心改进:
- 精简项目为专注于 PostgreSQL 运行时及其扩展
- 包含 pgvector, pg_jieba, pgmq 等扩展

部署模式 (6种):
1. 基础模式 + Stunnel TLS 隧道
2. Nginx + Certbot (自动 Let's Encrypt SSL)
3. Caddy (零配置 HTTPS)
4. Stunnel TLS over TCP 隧道
5. pgAdmin Web 管理界面
6. Kubernetes/Helm Chart

架构设计:
- PostgreSQL 只监听 127.0.0.1:5432 (容器内部)
- Stunnel 提供 HTTPS 端点 (5433) 用于数据库连接
- Nginx/Caddy 仅用于证书管理和 Web 界面,不代理 SQL
- 客户端使用 stunnel 客户端 (15432) 透明加密

性能优势:
- 避免 PostgreSQL sslmode 的性能开销
- Stunnel 专门优化 TLS 处理
- PostgreSQL 专注 SQL,最高性能

安全特性:
- 强制 TLS 1.2/1.3 加密
- 网络隔离 (PostgreSQL 不直接暴露)
- 支持双向 TLS 认证
- 灵活的证书管理 (不绑定零信任平台)

新增文件:
- deploy/docker/docker-compose.nginx.yml (Nginx + Certbot)
- deploy/docker/docker-compose.caddy.yml (Caddy)
- deploy/docker/docker-compose.tunnel.yml (Stunnel)
- deploy/docker/stunnel-server.conf (服务端配置)
- deploy/docker/stunnel-client.conf (客户端配置)
- deploy/docker/init-letsencrypt.sh (证书初始化)
- deploy/docker/generate-certs.sh (证书生成)
- deploy/docker/nginx.conf (Nginx 主配置)
- deploy/docker/nginx-postgres.conf (Nginx 服务器配置)
- deploy/docker/Caddyfile (Caddy 配置)
- deploy/helm/postgresql/ (Helm Chart)
- docs/ (完整文档体系)

文档:
- docs/README.md (文档索引)
- docs/QUICKSTART.md (快速开始)
- docs/ARCHITECTURE.md (架构设计)
- docs/PROJECT_STRUCTURE.md (项目结构)
- docs/deployment/docker-deployment.md (Docker 部署)
- docs/deployment/helm-deployment.md (Helm 部署)
- docs/guides/stunnel-server.md (Stunnel 服务端)
- docs/guides/stunnel-client.md (Stunnel 客户端)

工具脚本:
- organize-docs.sh (文档组织)
- cleanup-old-files.sh (清理旧文件)

Breaking Changes:
- 移除了 XControl, RAG server, Account service 等组件
- PostgreSQL 不再直接暴露端口,必须通过 stunnel 访问
- 项目专注于 PostgreSQL 运行时部署
"

echo "🔀 创建特性分支并提交更改"
echo "================================"
echo ""
echo "分支名称: $FEATURE_BRANCH"
echo ""

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是 git 仓库"
    exit 1
fi

# 检查是否有未提交的更改
if git diff-index --quiet HEAD --; then
    echo "ℹ️  没有需要提交的更改"
    exit 0
fi

# 保存当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $CURRENT_BRANCH"

# 创建并切换到特性分支
echo ""
echo "📝 创建特性分支..."
git checkout -b "$FEATURE_BRANCH" 2>/dev/null || git checkout "$FEATURE_BRANCH"

# 添加所有更改
echo ""
echo "➕ 添加文件..."
git add .

# 显示将要提交的文件
echo ""
echo "📋 将要提交的文件:"
git status --short

# 提交
echo ""
echo "💾 提交更改..."
git commit -m "$COMMIT_MESSAGE"

echo ""
echo "✅ 提交完成!"
echo ""
echo "分支信息:"
git log --oneline -1
echo ""
echo "下一步:"
echo "  1. 查看提交: git show"
echo "  2. 推送到远程: git push -u origin $FEATURE_BRANCH"
echo "  3. 创建 Pull Request"
echo "  4. 切换回主分支: git checkout $CURRENT_BRANCH"
