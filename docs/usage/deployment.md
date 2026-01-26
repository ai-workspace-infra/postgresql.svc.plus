# 部署方式

## 1) VM / 单机（Docker Compose）

### 最小部署（仅 PostgreSQL）

```bash
cd deploy/docker
cp .env.example .env
# 设置 POSTGRES_PASSWORD
docker-compose up -d
```

### 启用 stunnel 服务端（推荐）

```bash
docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
```

### 证书管理（可选）

- Caddy：`docker-compose -f docker-compose.yml -f docker-compose.caddy.yml up -d`
- Nginx + Certbot：`docker-compose -f docker-compose.yml -f docker-compose.nginx.yml up -d`

## 2) 云服务器一键部署（Vhost）

```bash
bash scripts/init_vhost.sh 16 db.example.com
```

默认会启用 stunnel（对外 443）。

## 3) Kubernetes / Helm

```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=your-secure-password \
  --set persistence.size=10Gi
```

启用 stunnel sidecar：

```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=your-secure-password \
  --set stunnel.enabled=true \
  --set stunnel.certificatesSecret=stunnel-certs
```

## 端口与安全建议

- PostgreSQL 内部仅监听 `5432`。
- 对外 TLS 入口推荐使用 `443`。
- 生产环境仅开放 80/443（证书签发 + TLS 连接）。
