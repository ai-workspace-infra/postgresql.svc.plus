#!/bin/bash
# cleanup-old-files.sh
# 清理与 PostgreSQL 运行时无关的旧文件和目录

set -e

echo "🧹 PostgreSQL Service Plus - 清理旧文件"
echo "========================================="
echo ""
echo "⚠️  警告: 此脚本将删除与 PostgreSQL 运行时无关的文件和目录"
echo "请确保您已备份重要数据!"
echo ""
read -p "是否继续? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "开始清理..."

# 删除旧文档
OLD_DOCS=(
    "AGENTS.md"
    "IMPLEMENTATION_GUIDE.md"
    "PATH_VERIFICATION.md"
    "TOKEN_AUTH_MANUAL.md"
    "TOKEN_AUTH_SUMMARY.md"
)

for doc in "${OLD_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ❌ 删除: $doc"
        rm -f "$doc"
    fi
done

# 删除不相关的目录
OLD_DIRS=(
    "docs"
    "example"
    "scripts"
    "tests"
    "types"
    "workflows"
    "deploy/ansible"
    "deploy/charts"
    "deploy/docker-compose"
    "deploy/nerdctl-compose"
    "deploy/nextjs"
    "deploy/nginx"
    "deploy/openresty"
)

for dir in "${OLD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ❌ 删除目录: $dir"
        rm -rf "$dir"
    fi
done

# 保留的 base-images 文件
echo ""
echo "✅ 保留的核心文件:"
echo "  ✓ deploy/base-images/postgres-runtime-wth-extensions.Dockerfile"
echo "  ✓ deploy/base-images/postgres-runtime-wth-extensions.README"

# 清理 deploy/base-images 中的其他文件
if [ -d "deploy/base-images" ]; then
    cd deploy/base-images
    for file in *; do
        if [[ "$file" != "postgres-runtime-wth-extensions.Dockerfile" ]] && \
           [[ "$file" != "postgres-runtime-wth-extensions.README" ]] && \
           [[ "$file" != "README.md" ]] && \
           [[ "$file" != "mail-stack" ]]; then
            echo "  ❌ 删除: deploy/base-images/$file"
            rm -rf "$file"
        fi
    done
    cd ../..
fi

echo ""
echo "✅ 清理完成!"
echo ""
echo "保留的目录结构:"
echo "  postgresql.svc.plus/"
echo "  ├── README.md"
echo "  ├── QUICKSTART.md"
echo "  ├── PROJECT_STRUCTURE.md"
echo "  ├── 精简总结.md"
echo "  ├── Makefile"
echo "  ├── LICENSE"
echo "  ├── .gitignore"
echo "  ├── .dockerignore"
echo "  └── deploy/"
echo "      ├── base-images/"
echo "      │   ├── postgres-runtime-wth-extensions.Dockerfile"
echo "      │   └── postgres-runtime-wth-extensions.README"
echo "      ├── docker/"
echo "      │   ├── docker-compose.yml"
echo "      │   ├── docker-compose.caddy.yml"
echo "      │   ├── docker-compose.tunnel.yml"
echo "      │   ├── Caddyfile"
echo "      │   ├── stunnel.conf"
echo "      │   └── ..."
echo "      └── helm/"
echo "          └── postgresql/"
echo ""
echo "下一步:"
echo "  1. 查看 README.md 了解项目概述"
echo "  2. 阅读 QUICKSTART.md 快速开始"
echo "  3. 运行 'make build-postgres-image' 构建镜像"
echo "  4. 运行 'make test-postgres' 测试部署"
