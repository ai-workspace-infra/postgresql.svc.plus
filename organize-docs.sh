#!/bin/bash
# organize-docs.sh
# 将所有 Markdown 文档移动到 docs/ 目录

set -e

echo "📚 组织项目文档结构"
echo "===================="

# 创建 docs 目录结构
mkdir -p docs
mkdir -p docs/deployment
mkdir -p docs/guides

# 移动根目录的文档
echo "移动根目录文档..."
[ -f "QUICKSTART.md" ] && mv QUICKSTART.md docs/
[ -f "PROJECT_STRUCTURE.md" ] && mv PROJECT_STRUCTURE.md docs/
[ -f "精简总结.md" ] && mv "精简总结.md" docs/
[ -f "完成总结.md" ] && mv "完成总结.md" docs/

# 移动 deploy/docker 的文档
echo "移动 Docker 部署文档..."
[ -f "deploy/docker/README.md" ] && mv deploy/docker/README.md docs/deployment/docker-deployment.md
[ -f "deploy/docker/STUNNEL_GUIDE.md" ] && mv deploy/docker/STUNNEL_GUIDE.md docs/guides/stunnel-server.md
[ -f "deploy/docker/STUNNEL_CLIENT_GUIDE.md" ] && mv deploy/docker/STUNNEL_CLIENT_GUIDE.md docs/guides/stunnel-client.md

# 移动 deploy/helm 的文档
echo "移动 Helm 部署文档..."
[ -f "deploy/helm/README.md" ] && mv deploy/helm/README.md docs/deployment/helm-deployment.md

# 移动 deploy/base-images 的文档
echo "移动基础镜像文档..."
[ -f "deploy/base-images/README.md" ] && mv deploy/base-images/README.md docs/deployment/base-images.md
[ -f "deploy/base-images/postgres-runtime-wth-extensions.README" ] && \
    mv deploy/base-images/postgres-runtime-wth-extensions.README docs/deployment/postgres-extensions.md

# 创建文档索引
cat > docs/README.md <<'EOF'
# PostgreSQL Service Plus - 文档中心

## 📖 快速开始

- [快速开始指南](QUICKSTART.md) - 5分钟快速部署
- [项目结构说明](PROJECT_STRUCTURE.md) - 了解项目组织
- [精简总结](精简总结.md) - 中文项目总结
- [完成总结](完成总结.md) - 项目完成报告

## 🚀 部署指南

### Docker 部署
- [Docker Compose 部署](deployment/docker-deployment.md) - 完整的 Docker 部署指南
  - 基础模式
  - Nginx + Certbot (自动 SSL)
  - Caddy (零配置 HTTPS)
  - Stunnel TLS 隧道
  - pgAdmin 管理界面

### Kubernetes 部署
- [Helm Chart 部署](deployment/helm-deployment.md) - Kubernetes 生产部署
  - StatefulSet 配置
  - 持久化存储
  - Stunnel sidecar
  - Prometheus 监控

### 基础镜像
- [基础镜像构建](deployment/base-images.md) - PostgreSQL 扩展镜像
- [扩展说明](deployment/postgres-extensions.md) - 包含的扩展详解

## 🔐 安全指南

### TLS over TCP 隧道
- [Stunnel 服务端指南](guides/stunnel-server.md) - 服务端配置和部署
- [Stunnel 客户端指南](guides/stunnel-client.md) - 客户端部署和应用连接

**核心设计**:
- PostgreSQL 只监听 127.0.0.1:5432 (容器内部)
- 所有外部访问通过 stunnel HTTPS 端点 (5433)
- 客户端使用 stunnel 监听 15432 端口
- 应用使用普通 PostgreSQL 连接 (localhost:15432)
- 无需配置 sslmode,透明加密

## 📁 文档结构

```
docs/
├── README.md                           # 本文件 - 文档索引
├── QUICKSTART.md                       # 快速开始
├── PROJECT_STRUCTURE.md                # 项目结构
├── 精简总结.md                          # 中文总结
├── 完成总结.md                          # 完成报告
│
├── deployment/                         # 部署文档
│   ├── docker-deployment.md            # Docker 部署
│   ├── helm-deployment.md              # Helm 部署
│   ├── base-images.md                  # 基础镜像
│   └── postgres-extensions.md          # 扩展说明
│
└── guides/                             # 专项指南
    ├── stunnel-server.md               # Stunnel 服务端
    └── stunnel-client.md               # Stunnel 客户端
```

## 🎯 按场景查找文档

### 我想快速测试
→ [快速开始指南](QUICKSTART.md)

### 我想部署到开发环境
→ [Docker 部署 - 基础模式](deployment/docker-deployment.md#1-basic-postgresql-only)

### 我想部署到生产环境 (单机)
→ [Docker 部署 - Nginx + Certbot](deployment/docker-deployment.md#nginx--certbot-deployment)

### 我想部署到 Kubernetes
→ [Helm Chart 部署](deployment/helm-deployment.md)

### 我想配置 TLS 加密隧道
→ [Stunnel 服务端指南](guides/stunnel-server.md)  
→ [Stunnel 客户端指南](guides/stunnel-client.md)

### 我想了解包含哪些扩展
→ [PostgreSQL 扩展说明](deployment/postgres-extensions.md)

### 我想自定义镜像
→ [基础镜像构建](deployment/base-images.md)

## 🔧 常见任务

### 构建镜像
```bash
make build-postgres-image
```

### 本地测试
```bash
make test-postgres
```

### Docker 部署
```bash
cd deploy/docker
cp .env.example .env
# 编辑 .env
docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
```

### Kubernetes 部署
```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=secure-password
```

## 📞 获取帮助

- **GitHub Issues**: 报告问题和功能请求
- **文档问题**: 查看相关指南
- **许可证**: MIT License

## 🌟 核心特性

- **多模型数据库**: 向量搜索 + 全文搜索 + 消息队列 + 文档存储
- **安全优先**: 强制 TLS 加密,网络隔离
- **灵活部署**: 6 种部署模式
- **生产就绪**: 监控、备份、高可用
- **完整文档**: 中英文,覆盖所有场景
EOF

echo ""
echo "✅ 文档组织完成!"
echo ""
echo "文档结构:"
echo "  docs/"
echo "  ├── README.md                    # 文档索引"
echo "  ├── QUICKSTART.md                # 快速开始"
echo "  ├── PROJECT_STRUCTURE.md         # 项目结构"
echo "  ├── 精简总结.md                   # 中文总结"
echo "  ├── 完成总结.md                   # 完成报告"
echo "  ├── deployment/"
echo "  │   ├── docker-deployment.md     # Docker 部署"
echo "  │   ├── helm-deployment.md       # Helm 部署"
echo "  │   ├── base-images.md           # 基础镜像"
echo "  │   └── postgres-extensions.md   # 扩展说明"
echo "  └── guides/"
echo "      ├── stunnel-server.md        # Stunnel 服务端"
echo "      └── stunnel-client.md        # Stunnel 客户端"
echo ""
echo "查看文档索引: cat docs/README.md"
