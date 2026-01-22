# PostgreSQL Service Plus - Project Structure

This document describes the streamlined project structure focused on PostgreSQL runtime with extensions.

## Directory Structure

```
postgresql.svc.plus/
├── README.md                    # Main project documentation
├── QUICKSTART.md               # Quick start guide
├── LICENSE                     # MIT License
├── Makefile                    # Build and deployment automation
├── .gitignore                  # Git ignore rules
│
├── deploy/                     # Deployment configurations
│   ├── base-images/           # Docker base images
│   │   ├── postgres-runtime-wth-extensions.Dockerfile
│   │   └── postgres-runtime-wth-extensions.README
│   │
│   ├── docker/                # Docker Compose deployment
│   │   ├── README.md          # Docker deployment guide
│   │   ├── docker-compose.yml # Main compose file
│   │   ├── docker-compose.caddy.yml    # Caddy reverse proxy
│   │   ├── docker-compose.tunnel.yml   # Stunnel TLS tunnel
│   │   ├── .env.example       # Environment template
│   │   ├── Caddyfile          # Caddy configuration
│   │   ├── stunnel.conf       # Stunnel server config
│   │   ├── stunnel-client.conf # Stunnel client config
│   │   ├── generate-certs.sh  # Certificate generation script
│   │   ├── postgresql.conf    # PostgreSQL configuration
│   │   └── init-scripts/      # Database initialization
│   │       └── 01-init-extensions.sql
│   │
│   └── helm/                  # Kubernetes Helm charts
│       ├── README.md          # Helm deployment guide
│       └── postgresql/        # PostgreSQL chart
│           ├── Chart.yaml     # Chart metadata
│           ├── values.yaml    # Default values
│           └── templates/     # Kubernetes manifests
│               ├── _helpers.tpl
│               ├── configmap.yaml
│               ├── configmap-init-scripts.yaml
│               ├── configmap-stunnel.yaml
│               ├── secret.yaml
│               ├── serviceaccount.yaml
│               ├── service.yaml
│               ├── service-metrics.yaml
│               └── statefulset.yaml
│
└── docs/                      # Additional documentation (optional)
```

## Core Components

### 1. Base Image (`deploy/base-images/`)

**Purpose**: Build PostgreSQL with essential extensions

**Key File**: `postgres-runtime-wth-extensions.Dockerfile`

**Extensions Included**:
- pgvector (v0.8.1) - Vector embeddings and semantic search
- pg_jieba (v2.0.1) - Chinese full-text tokenization
- pgmq (v1.8.0) - Message queue functionality
- pg_trgm - Fuzzy text search
- hstore - Key-value storage
- JSONB + GIN - Document store

**Build Command**:
```bash
make build-postgres-image
```

### 2. Docker Deployment (`deploy/docker/`)

**Purpose**: Single-host or VM-based deployment with Docker Compose

**Deployment Modes**:

1. **Basic PostgreSQL**
   - File: `docker-compose.yml`
   - Command: `docker-compose up -d`

2. **With Caddy Reverse Proxy**
   - Files: `docker-compose.yml` + `docker-compose.caddy.yml`
   - Features: Automatic HTTPS, Let's Encrypt
   - Command: `docker-compose -f docker-compose.yml -f docker-compose.caddy.yml up -d`

3. **With TLS Tunnel (stunnel)**
   - Files: `docker-compose.yml` + `docker-compose.tunnel.yml`
   - Features: Encrypted TCP connections
   - Command: `docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d`

4. **With pgAdmin**
   - Use profile: `docker-compose --profile admin up -d`

**Configuration Files**:
- `.env` - Environment variables (passwords, ports)
- `postgresql.conf` - PostgreSQL tuning
- `Caddyfile` - Caddy reverse proxy rules
- `stunnel.conf` - TLS tunnel configuration
- `init-scripts/*.sql` - Database initialization

### 3. Kubernetes Deployment (`deploy/helm/`)

**Purpose**: Container orchestration with Kubernetes and Helm

**Chart Features**:
- StatefulSet for PostgreSQL
- Persistent volume claims
- ConfigMaps for configuration
- Secrets for credentials
- Optional stunnel sidecar
- Optional Prometheus metrics exporter
- Health checks and probes
- Resource limits and requests

**Installation**:
```bash
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=secure-password \
  --set persistence.size=10Gi
```

**Advanced Features**:
- Stunnel TLS tunnel sidecar
- Prometheus metrics integration
- Custom PostgreSQL configuration
- Init scripts support
- Backup CronJob (optional)
- NetworkPolicy support
- PodDisruptionBudget

## Deployment Comparison

| Feature | Docker Compose | Kubernetes/Helm |
|---------|---------------|-----------------|
| **Complexity** | Low | Medium-High |
| **Scalability** | Single host | Multi-node cluster |
| **HA** | Manual | Built-in (with replication) |
| **Auto-restart** | Yes | Yes |
| **Load balancing** | Manual | Automatic |
| **Rolling updates** | Manual | Automatic |
| **Monitoring** | Manual setup | Prometheus integration |
| **Backup** | Manual scripts | CronJob automation |
| **Best for** | Dev, small prod | Production, scale |

## Removed Components

The following components from the original project were removed to focus on PostgreSQL:

- ❌ XControl server and dashboard
- ❌ RAG server
- ❌ Account service
- ❌ Next.js frontend
- ❌ OpenResty/Nginx configurations (except Caddy)
- ❌ Go backend services
- ❌ Node.js applications
- ❌ CMS and NeuraPress
- ❌ Agent and CLI tools

## Key Features

### 1. Multi-Model Database

Replace multiple databases with one PostgreSQL instance:
- **Vector DB** (Pinecone) → pgvector
- **Search** (Elasticsearch) → pg_trgm + pg_jieba
- **Message Queue** (Kafka) → pgmq
- **Document Store** (MongoDB) → JSONB + GIN
- **Cache** (Redis) → hstore + UNLOGGED tables

### 2. Deployment Flexibility

- **Vhost/Docker**: Simple, single-host deployment
- **Kubernetes**: Scalable, production-grade orchestration
- **TLS Security**: Optional stunnel for encrypted connections
- **Reverse Proxy**: Optional Caddy for HTTPS termination

### 3. Production Ready

- Health checks and probes
- Resource limits
- Persistent storage
- Backup support
- Monitoring integration
- Security best practices

## Usage Patterns

### Development

```bash
# Quick local test
make test-postgres

# Or with Docker Compose
cd deploy/docker
cp .env.example .env
docker-compose up -d
```

### Staging/Testing

```bash
# Docker with persistence
cd deploy/docker
docker-compose up -d

# Or Kubernetes
helm install staging ./deploy/helm/postgresql \
  --set persistence.size=20Gi
```

### Production

```bash
# Kubernetes with HA, monitoring, backups
helm install production ./deploy/helm/postgresql \
  -f production-values.yaml \
  --set metrics.enabled=true \
  --set backup.enabled=true \
  --set podDisruptionBudget.enabled=true
```

## Customization

### Adding Custom Extensions

Edit `postgres-runtime-wth-extensions.Dockerfile`:

```dockerfile
# Add new extension build stage
RUN git clone https://github.com/example/pg_extension.git && \
    cd pg_extension && \
    make && make install
```

### Custom Initialization

Add SQL files to `deploy/docker/init-scripts/` or Helm `values.yaml`:

```yaml
initScripts:
  scripts:
    02-custom-schema.sql: |
      CREATE SCHEMA myapp;
      CREATE TABLE myapp.users (...);
```

### Performance Tuning

Edit `postgresql.conf` or Helm values:

```yaml
postgresql:
  config: |
    shared_buffers = 4GB
    effective_cache_size = 12GB
    work_mem = 64MB
```

## Maintenance

### Backups

**Docker**:
```bash
docker-compose exec postgres pg_dump -U postgres > backup.sql
```

**Kubernetes**:
```bash
kubectl exec postgresql-0 -- pg_dump -U postgres > backup.sql
```

### Updates

**Docker**:
```bash
make build-postgres-image
docker-compose up -d
```

**Kubernetes**:
```bash
helm upgrade postgresql ./deploy/helm/postgresql \
  --set image.tag=16.5
```

## Support and Documentation

- **Quick Start**: See `QUICKSTART.md`
- **Docker Guide**: See `deploy/docker/README.md`
- **Helm Guide**: See `deploy/helm/README.md`
- **Base Image**: See `deploy/base-images/postgres-runtime-wth-extensions.README`

## License

MIT License - See `LICENSE` file for details.
