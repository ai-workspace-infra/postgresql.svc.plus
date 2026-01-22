#!/bin/bash
# commit-cicd.sh
# 提交 CI/CD 配置

set -e

echo "🔄 提交 GitHub Actions CI/CD 配置"
echo "=================================="
echo ""

# 添加文件
git add .github/workflows/
git add docs/guides/github-actions-cicd.md
git add docs/guides/CICD_QUICKREF.md
git add README.md

# 显示将要提交的文件
echo "📋 将要提交的文件:"
git status --short

# 提交
COMMIT_MESSAGE="feat: 添加 GitHub Actions CI/CD 支持

新增 3 个 GitHub Actions 工作流:

1. Build Image (build-image.yml)
   - 自动构建 PostgreSQL 镜像
   - 推送到 GitHub Container Registry
   - PR 时自动测试扩展

2. Deploy to VM (deploy-vm.yml)
   - 支持 5 种部署模式:
     * basic - 基础 PostgreSQL
     * nginx-certbot - Nginx + Let's Encrypt
     * caddy - Caddy 自动 HTTPS
     * stunnel - Stunnel TLS 隧道
     * full - 完整堆栈
   - 通过 SSH 部署到虚拟机
   - 自动验证部署

3. Deploy to Kubernetes (deploy-k8s.yml)
   - 支持 K8s 和 K3s
   - Helm Chart 自动部署
   - 可选 Stunnel sidecar
   - 可选 Prometheus metrics
   - 自动创建 namespace 和 secrets

特性:
- ✅ 多环境支持 (dev/staging/prod)
- ✅ 手动触发,参数化配置
- ✅ 自动验证部署结果
- ✅ 详细的部署日志
- ✅ 安全的 secrets 管理

文档:
- docs/guides/github-actions-cicd.md (完整配置指南)
- docs/guides/CICD_QUICKREF.md (快速参考)
- README.md (添加 CI/CD 说明)
"

git commit -m "$COMMIT_MESSAGE"

echo ""
echo "✅ 提交完成!"
echo ""
echo "提交信息:"
git log --oneline -1
echo ""
echo "下一步:"
echo "  git push"
