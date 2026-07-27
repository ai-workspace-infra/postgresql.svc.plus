# PostgreSQL Service Plus

生产就绪的 PostgreSQL 运行时, 包含向量搜索、中文分词、消息队列等扩展, 支持多种安全部署模式。

## 部署要求

| 维度 | 要求 / 规格 | 说明 |
| :--- | :--- | :--- |
| **网络** | 公网 IP + 域名 (DNS) | 域名需解析至主机 IP (用于 ACME 证书) |
| **端口** | 开放 `80`, `5443` | 80 用于证书验证 (HTTP-01)，5443 为 Stunnel TLS 入口（默认） |
| **最低** | 1 CPU / 2GB RAM / 20GB SSD | 仅支持基础数据库功能 |
| **推荐** | 2 CPU / 4GB RAM / 50GB SSD | 支持向量搜索、高并发等全量扩展 |

> **提示**: `80/TCP` 仅用于 ACME 证书验证。本服务默认使用 **`5443/TCP`** 作为 Stunnel 安全入口；如需兼容历史客户端可改为 `443`。

## 快速开始

### 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/ai-workspace-infra/postgresql.svc.plus/main/scripts/init_vhost.sh \
  | bash -s -- 17 db.example.com
```
- bash -s -- <PG版本> <域名>
- 默认安装最新稳定版 (PG 16)，使用当前主机名作为域名

> **详细指南**: 查看 [docs/QUICKSTART.md](docs/QUICKSTART.md) | [完整指南](docs/PROJECT_DETAILS.md)

### 数据库全量迁移示例

使用脚本: `scripts/db_full_migration.sh`

1) 初始化目标机 + 全量迁移（源域名与目标域名独立）

```bash
scripts/db_full_migration.sh \
  root@postgresql.svc.plus \
  ubuntu@57.183.19.25 \
  --init-db \
  --target-domain postgresql-aws.svc.plus
```

1.1) 与 `agent.svc.plus(caddy.service+xray)` 共存时（复用 host caddy 申请证书）

```bash
scripts/db_full_migration.sh \
  root@postgresql.svc.plus \
  ubuntu@57.183.19.25 \
  --init-db \
  --target-domain postgresql-aws.svc.plus \
  --acme-mode host-caddy
```

2) 只测迁移流程（不重做目标机 init）

```bash
scripts/db_full_migration.sh \
  root@postgresql.svc.plus \
  ubuntu@57.183.19.25 \
  --skip-init \
  --target-domain postgresql-aws.svc.plus
```

3) 常用可选参数

```text
--source-domain <domain>   源服务域名（用于提示/切换说明）
--target-domain <domain>   目标域名（用于 init_vhost ACME 证书检查）
--target-tls-port <port>   目标 TLS 端口，默认 5443
--acme-mode <mode>         ACME模式：auto|bootstrap|host-caddy（默认 auto）
--import-globals           导入 globals.sql（角色/表空间）
--skip-import              仅做 init/校验，不做导入
--skip-compare             跳过源目标对比
```

### 🏗️ 部署模式

| 模式 | 复杂度 | TLS隧道 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Stunnel + ACME** | ⭐ | ✅ (自动证书) | 个人/生产单机 |
| **Kubernetes/Helm** | ⭐⭐⭐ | ✅ (Sidecar) | 企业级生产 |

### 🔄 CI/CD 自动化

GitHub Actions 工作流 (`.github/workflows/ci-pipeline.yaml` / `pipeline.yaml`):
- ✅ **统一矩阵构建 (Matrix Strategy)**: 一键并发构建并推送镜像 (`stunnel-server`, `stunnel-client`, `postgresql`)
- ✅ **Helm Chart 自动发布**: 自动打包并推送 Helm Chart 到 GHCR
- ✅ **Vault OIDC 凭据接入**: 无缝对接 HashiCorp Vault 动态鉴权
- ✅ **多环境智能路由**: 根据 Git 事件自动路由部署至 `sit` / `uat` / `prod` 环境

### 📦 GHCR 产物

当前 CI/CD 约定的发布路径如下:

- `oci://ghcr.io/ai-workspace-infra/charts/postgresql`
- `ghcr.io/ai-workspace-infra/postgresql`
- `ghcr.io/ai-workspace-infra/stunnel-client`
- `ghcr.io/ai-workspace-infra/stunnel-server`

## 📦 核心特性

### 多模型数据库
一个 PostgreSQL 实例替代多个专用数据库:

| 传统方案 | PostgreSQL 扩展 | 用途 |
|----------|-----------------|------|
| Pinecone | **pgvector** | 向量嵌入和语义搜索 |
| Elasticsearch | **pg_jieba + pg_trgm** | 中文分词和全文搜索 |
| Kafka | **pgmq** | 轻量级消息队列 |
| MongoDB | **JSONB + GIN** | 文档存储 |
| Redis | **hstore + UNLOGGED** | 高速键值缓存 |

### 🛠️ 技术栈
- **PostgreSQL**: 16/17/18 (PGDG)
- **扩展**: pgvector, pg_jieba, pgmq, pg_cron, pg_trgm
- **TLS 隧道**: stunnel4
- **证书管理**: Caddy (ACME) 或自签名
- **容器编排**: Docker Compose 或 Kubernetes/Helm

---

## 📚 说明文档
- **[快速入门](docs/QUICKSTART.md)** - 5分钟完成部署
- **[详细指南](docs/PROJECT_DETAILS.md)** - 安全方案与高级配置
- **[项目结构](docs/PROJECT_STRUCTURE.md)** - 了解代码组织
- **[代码分析报告](docs/COMPLETION_REPORT.md)** - 技术实现细节

## 📝 许可证
MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献
欢迎贡献! 请查看文档并提交 Pull Request。

## 📞 支持
- **文档中心**: [docs/](docs/)
- **示例配置**: [example/](example/)
- **报告问题**: GitHub Issues

---
**一个 PostgreSQL, 替代多个数据库** 🚀

## CI/CD 与 Vault 鉴权 (Vault OIDC Role)

本仓库的持续集成流水线 (`.github/workflows/ci-pipeline.yml`) 使用 GitHub Actions OIDC 机制与 HashiCorp Vault (`vault.svc.plus`) 进行无密钥身份认证。

为了遵循最小权限原则（Least Privilege）和环境隔离，本仓库的 CI 拥有独立的 Vault Policy 和 Role，具体安全约束如下：

1. **凭据访问范围（路径隔离）**
   - CI 流水线仅拥有 `kv/data/CICD` 的**只读**权限。
   - 该路径仅包含基础的公共服务凭据（例如 GHCR_USERNAME 和 GHCR_TOKEN），用于构建完成后推送镜像。
   - CI 无法读取任何环境特有的底层云资源凭据、Terraform State 或主机 SSH 部署私钥。

2. **身份铸造限制（绑定收紧）**
   - 本服务在 Vault 中对应 3 个独立环境的 Role（`sit`、`uat`、`prod`）。
   - **`job_workflow_ref` 白名单钉死**：Vault 强制校验调用方的流水线文件。只有本仓库白名单内的流水线（即 `ci-pipeline.yml`）发起的请求才能成功换取 Token。
   - 仓库内任何人**新增**或**重命名**未经授权的 workflow 文件，皆无法绕过限制获取凭据。

> **⚠️ 排障指南 (403 Forbidden)**
> 如果 CI 流水线在 `Fetch Vault Secrets` 步骤报 `403` 权限拒绝，请确认：
> 1. 请求的凭据路径是否超出了 `kv/data/CICD` 层的范围。
> 2. 流水线文件名称或仓库名称是否发生了变更。
> 
> 如果确需修改流水线名称，必须由管理员在 `platform-ops-toolkit` 仓的 `docs/tasks/vault_service_repo_roles.sh` 中更新白名单，并重新对 Vault 服务端执行该脚本。
