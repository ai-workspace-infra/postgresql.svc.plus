# PostgreSQL Service Plus - 项目精简总结

## 概述

本项目已成功精简为专注于 PostgreSQL 运行时及其扩展的部署方案。所有与 `deploy/base-images/postgres-runtime-wth-extensions.*` 无关的组件已被移除或重构。

## 核心特性

### 1. PostgreSQL 扩展运行时

**基础镜像**: `deploy/base-images/postgres-runtime-wth-extensions.Dockerfile`

**包含的扩展**:
- **pgvector** (v0.8.1) - 向量嵌入和语义搜索
- **pg_jieba** (v2.0.1) - 中文分词和全文搜索
- **pgmq** (v1.8.0) - 轻量级消息队列
- **pg_trgm** - 模糊文本搜索
- **hstore** - 键值存储
- **JSONB + GIN** - 文档存储

### 2. 支持的部署模式

#### 模式 1: Vhost/Docker 部署

**位置**: `deploy/docker/`

**部署选项**:

1. **基础 PostgreSQL**
   ```bash
   cd deploy/docker
   docker-compose up -d
   ```

2. **带 Caddy 反向代理** (自动 HTTPS)
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.caddy.yml up -d
   ```
   - 自动 Let's Encrypt 证书
   - HTTP/2 和 HTTP/3 支持
   - 配置文件: `Caddyfile`

3. **带 TLS over TCP 隧道** (stunnel)
   ```bash
   # 生成证书
   bash generate-certs.sh
   
   # 启动隧道
   docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
   ```
   - 服务端配置: `stunnel.conf`
   - 客户端配置: `stunnel-client.conf`
   - 加密 TCP 连接

4. **带 pgAdmin 管理界面**
   ```bash
   docker-compose --profile admin up -d
   ```

**配置文件**:
- `.env.example` - 环境变量模板
- `postgresql.conf` - PostgreSQL 性能调优
- `init-scripts/01-init-extensions.sql` - 数据库初始化

#### 模式 2: Kubernetes/Helm/Chart 部署

**位置**: `deploy/helm/postgresql/`

**特性**:
- StatefulSet 部署
- 持久化存储 (PVC)
- 健康检查和探针
- 资源限制和请求
- 可选的 stunnel sidecar
- 可选的 Prometheus metrics
- ConfigMap 配置管理
- Secret 密码管理

**安装命令**:
```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=secure-password \
  --set persistence.size=10Gi
```

**高级功能**:
- **Stunnel TLS 隧道**: 
  ```bash
  --set stunnel.enabled=true \
  --set stunnel.certificatesSecret=stunnel-certs
  ```

- **Prometheus 监控**:
  ```bash
  --set metrics.enabled=true
  ```

- **自定义配置**:
  ```yaml
  postgresql:
    config: |
      shared_buffers = 2GB
      effective_cache_size = 6GB
  ```

## 项目结构

```
postgresql.svc.plus/
├── README.md                   # 项目主文档
├── QUICKSTART.md              # 快速开始指南
├── PROJECT_STRUCTURE.md       # 项目结构说明
├── Makefile                   # 构建和部署自动化
├── LICENSE                    # MIT 许可证
├── .gitignore                 # Git 忽略规则
│
├── deploy/
│   ├── base-images/
│   │   ├── postgres-runtime-wth-extensions.Dockerfile  # 核心镜像
│   │   └── postgres-runtime-wth-extensions.README      # 扩展说明
│   │
│   ├── docker/                # Docker Compose 部署
│   │   ├── README.md          # Docker 部署指南
│   │   ├── docker-compose.yml # 基础配置
│   │   ├── docker-compose.caddy.yml    # Caddy 配置
│   │   ├── docker-compose.tunnel.yml   # Stunnel 配置
│   │   ├── .env.example       # 环境变量模板
│   │   ├── Caddyfile          # Caddy 反向代理配置
│   │   ├── stunnel.conf       # Stunnel 服务端配置
│   │   ├── stunnel-client.conf # Stunnel 客户端配置
│   │   ├── generate-certs.sh  # 证书生成脚本
│   │   ├── postgresql.conf    # PostgreSQL 配置
│   │   └── init-scripts/
│   │       └── 01-init-extensions.sql  # 初始化脚本
│   │
│   └── helm/                  # Kubernetes Helm Charts
│       ├── README.md          # Helm 部署指南
│       └── postgresql/
│           ├── Chart.yaml     # Chart 元数据
│           ├── values.yaml    # 默认配置值
│           └── templates/     # Kubernetes 资源模板
│               ├── _helpers.tpl
│               ├── configmap.yaml
│               ├── configmap-init-scripts.yaml
│               ├── configmap-stunnel.yaml
│               ├── secret.yaml
│               ├── serviceaccount.yaml
│               ├── service.yaml
│               ├── service-metrics.yaml
│               └── statefulset.yaml
```

## 已移除的组件

为了专注于 PostgreSQL 运行时,以下组件已被移除:

- ❌ XControl 服务器和控制面板
- ❌ RAG 服务器
- ❌ Account 服务
- ❌ Next.js 前端应用
- ❌ Go 后端服务
- ❌ Node.js 应用
- ❌ CMS 和 NeuraPress
- ❌ Agent 和 CLI 工具
- ❌ OpenResty/Nginx 配置 (已替换为 Caddy)

## Makefile 命令

```bash
# 构建 PostgreSQL 镜像
make build-postgres-image

# 推送镜像到仓库
make push-postgres-image DOCKER_REGISTRY=your-registry.io/

# 本地测试
make test-postgres

# Docker Compose 部署
make deploy-docker

# Helm 部署
make deploy-helm

# 清理测试容器
make clean

# 查看帮助
make help
```

## 快速开始

### 1. 构建镜像

```bash
make build-postgres-image
```

### 2. 本地测试

```bash
make test-postgres
# 连接: psql -h localhost -U postgres -d postgres
# 密码: testpass
```

### 3. 部署到生产环境

**Docker 部署**:
```bash
cd deploy/docker
cp .env.example .env
# 编辑 .env 设置密码
docker-compose up -d
```

**Kubernetes 部署**:
```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=your-secure-password \
  --set persistence.size=20Gi \
  --set resources.requests.memory=2Gi
```

## 部署模式对比

| 特性 | Docker Compose | Kubernetes/Helm |
|------|---------------|-----------------|
| **复杂度** | 低 | 中-高 |
| **可扩展性** | 单主机 | 多节点集群 |
| **高可用** | 手动配置 | 内置支持 |
| **自动重启** | 是 | 是 |
| **负载均衡** | 手动 | 自动 |
| **滚动更新** | 手动 | 自动 |
| **监控集成** | 手动配置 | Prometheus 集成 |
| **备份** | 手动脚本 | CronJob 自动化 |
| **适用场景** | 开发、小型生产 | 生产、大规模 |

## Caddy 反向代理特性

- ✅ 自动 HTTPS (Let's Encrypt)
- ✅ HTTP/2 和 HTTP/3 支持
- ✅ 自动证书续期
- ✅ 简单的配置语法
- ✅ 健康检查端点
- ✅ 访问日志 (JSON 格式)

**配置示例** (`Caddyfile`):
```caddyfile
db.yourdomain.com {
    handle /health {
        respond "OK" 200
    }
    
    tls {
        protocols tls1.2 tls1.3
    }
}
```

## TLS over TCP 隧道特性

- ✅ 加密 PostgreSQL TCP 连接
- ✅ 支持服务端和客户端模式
- ✅ TLS 1.2/1.3 支持
- ✅ 自定义证书
- ✅ 连接重试机制

**使用场景**:
- 连接到不支持原生 TLS 的远程数据库
- 在不修改数据库配置的情况下加密流量
- 跨不安全网络的安全连接

## 扩展使用示例

### pgvector - 向量搜索
```sql
CREATE TABLE items (embedding vector(3));
INSERT INTO items VALUES ('[1,2,3]'), ('[4,5,6]');
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
```

### pg_jieba - 中文分词
```sql
SELECT * FROM to_tsvector('jiebacfg', '我爱北京天安门');
```

### pgmq - 消息队列
```sql
SELECT pgmq.create('my_queue');
SELECT pgmq.send('my_queue', '{"task": "process"}');
SELECT * FROM pgmq.read('my_queue', 30, 1);
```

## 文档资源

- **快速开始**: `QUICKSTART.md`
- **项目结构**: `PROJECT_STRUCTURE.md`
- **Docker 部署**: `deploy/docker/README.md`
- **Helm 部署**: `deploy/helm/README.md`
- **扩展说明**: `deploy/base-images/postgres-runtime-wth-extensions.README`

## 下一步

1. **测试部署**: 使用 `make test-postgres` 验证镜像
2. **配置环境**: 复制 `.env.example` 并设置密码
3. **选择部署模式**: Docker 或 Kubernetes
4. **配置备份**: 设置定期备份策略
5. **监控**: 启用 Prometheus metrics (Helm)
6. **性能调优**: 根据工作负载调整 `postgresql.conf`

## 许可证

MIT License - 详见 `LICENSE` 文件

## 支持

- GitHub Issues: 报告问题和功能请求
- 文档: 查看 `docs/` 目录
- 示例: 参考 `QUICKSTART.md` 中的示例
