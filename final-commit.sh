#!/bin/bash
# final-commit.sh
# 最终提交脚本 - 整理文档并提交到特性分支

set -e

FEATURE_BRANCH="feature/postgresql-service-plus-refactor"

echo "🚀 PostgreSQL Service Plus - 最终提交"
echo "======================================"
echo ""

# 步骤 1: 重命名和移动文档
echo "📝 步骤 1/4: 重命名 Markdown 文件并移动到 docs/"
if [ -f "rename-md-to-english.sh" ]; then
    chmod +x rename-md-to-english.sh
    ./rename-md-to-english.sh
else
    echo "⚠️  rename-md-to-english.sh 不存在,跳过"
fi

echo ""
echo "✅ 文档整理完成"
echo ""

# 步骤 2: 检查 git 状态
echo "📋 步骤 2/4: 检查 Git 状态"
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是 git 仓库"
    exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $CURRENT_BRANCH"

# 步骤 3: 创建特性分支
echo ""
echo "🔀 步骤 3/4: 创建特性分支"
git checkout -b "$FEATURE_BRANCH" 2>/dev/null || {
    echo "分支已存在,切换到: $FEATURE_BRANCH"
    git checkout "$FEATURE_BRANCH"
}

# 步骤 4: 添加和提交
echo ""
echo "💾 步骤 4/4: 添加文件并提交"

# 添加所有更改
git add -A

# 显示将要提交的文件
echo ""
echo "📋 将要提交的文件:"
git status --short | head -20
TOTAL_FILES=$(git status --short | wc -l)
if [ "$TOTAL_FILES" -gt 20 ]; then
    echo "... 还有 $((TOTAL_FILES - 20)) 个文件"
fi

# 提交信息
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

新增配置:
- deploy/docker/docker-compose.nginx.yml (Nginx + Certbot)
- deploy/docker/docker-compose.caddy.yml (Caddy)
- deploy/docker/docker-compose.tunnel.yml (Stunnel)
- deploy/docker/stunnel-server.conf (服务端)
- deploy/docker/stunnel-client.conf (客户端)
- deploy/docker/init-letsencrypt.sh (证书初始化)
- deploy/docker/generate-certs.sh (证书生成)
- deploy/helm/postgresql/ (Helm Chart)

文档:
- docs/README.md (文档索引)
- docs/QUICKSTART.md (快速开始)
- docs/ARCHITECTURE.md (架构设计)
- docs/PROJECT_STRUCTURE.md (项目结构)
- docs/SUMMARY.md (中文总结)
- docs/COMPLETION_REPORT.md (完成报告)
- docs/deployment/ (部署指南)
- docs/guides/ (专项指南)

Breaking Changes:
- 移除了 XControl, RAG server, Account service 等组件
- PostgreSQL 不再直接暴露端口,必须通过 stunnel 访问
- 项目专注于 PostgreSQL 运行时部署
"

# 提交
echo ""
echo "💾 提交更改..."
git commit -m "$COMMIT_MESSAGE"

echo ""
echo "✅ 提交完成!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 提交信息:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -1
echo ""
echo "📁 文件统计:"
git diff --stat HEAD~1 | tail -1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 下一步操作:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. 查看提交详情:"
echo "     git show"
echo ""
echo "  2. 查看文件变更:"
echo "     git diff HEAD~1 --stat"
echo ""
echo "  3. 推送到远程仓库:"
echo "     git push -u origin $FEATURE_BRANCH"
echo ""
echo "  4. 创建 Pull Request:"
echo "     访问 GitHub 仓库创建 PR"
echo ""
echo "  5. 切换回原分支:"
echo "     git checkout $CURRENT_BRANCH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
