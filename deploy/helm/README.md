# PostgreSQL Helm Chart

This Helm chart deploys PostgreSQL with extensions (pgvector, pg_jieba, pgmq) on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PV provisioner support in the underlying infrastructure (for persistence)

## Installing the Chart

### Basic Installation

```bash
helm install my-postgresql ./postgresql
```

### With Custom Values

```bash
helm install my-postgresql ./postgresql \
  --set auth.password=mySecurePassword \
  --set persistence.size=20Gi
```

### Using a Values File

```bash
# Create custom values
cat > my-values.yaml <<EOF
auth:
  password: mySecurePassword
  database: myapp

persistence:
  size: 20Gi
  storageClass: fast-ssd

resources:
  requests:
    memory: 2Gi
    cpu: 1000m
  limits:
    memory: 4Gi
    cpu: 2000m
EOF

# Install with custom values
helm install my-postgresql ./postgresql -f my-values.yaml
```

## Configuration

### Authentication

| Parameter | Description | Default |
|-----------|-------------|---------|
| `auth.username` | PostgreSQL superuser name | `postgres` |
| `auth.password` | PostgreSQL password | `""` (required) |
| `auth.database` | Default database name | `postgres` |
| `auth.existingSecret` | Use existing secret for password | `""` |

### Image Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | PostgreSQL image repository | `postgres-extensions` |
| `image.tag` | Image tag | `16` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.enabled` | Enable persistence | `true` |
| `persistence.size` | PVC size | `10Gi` |
| `persistence.storageClass` | Storage class | `""` (default) |
| `persistence.accessModes` | Access modes | `[ReadWriteOnce]` |

### Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.requests.cpu` | CPU request | `500m` |
| `resources.requests.memory` | Memory request | `1Gi` |
| `resources.limits.cpu` | CPU limit | `2000m` |
| `resources.limits.memory` | Memory limit | `2Gi` |

### Stunnel (TLS over TCP)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `stunnel.enabled` | Enable stunnel sidecar | `false` |
| `stunnel.port` | Stunnel listen port | `5433` |
| `stunnel.certificatesSecret` | Secret with TLS certificates | `""` |

### Metrics

| Parameter | Description | Default |
|-----------|-------------|---------|
| `metrics.enabled` | Enable Prometheus metrics | `false` |
| `metrics.service.port` | Metrics service port | `9187` |

## Examples

### 1. Production Deployment with High Availability

```yaml
# production-values.yaml
auth:
  password: "change-me-in-production"
  database: production

persistence:
  enabled: true
  size: 100Gi
  storageClass: fast-ssd

resources:
  requests:
    memory: 4Gi
    cpu: 2000m
  limits:
    memory: 8Gi
    cpu: 4000m

postgresql:
  config: |
    shared_buffers = 2GB
    effective_cache_size = 6GB
    work_mem = 64MB
    maintenance_work_mem = 512MB
    max_connections = 200
    checkpoint_completion_target = 0.9

metrics:
  enabled: true

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

```bash
helm install prod-postgresql ./postgresql -f production-values.yaml
```

### 2. Development Environment

```yaml
# dev-values.yaml
auth:
  password: "devpassword"
  database: devdb

persistence:
  enabled: false  # Use emptyDir for dev

resources:
  requests:
    memory: 512Mi
    cpu: 250m
  limits:
    memory: 1Gi
    cpu: 500m
```

```bash
helm install dev-postgresql ./postgresql -f dev-values.yaml
```

### 3. With Stunnel TLS Tunnel

First, create a secret with TLS certificates:

```bash
# Generate certificates
cd ../../docker
bash generate-certs.sh

# Create Kubernetes secret
kubectl create secret generic stunnel-certs \
  --from-file=server-cert.pem=certs/server-cert.pem \
  --from-file=server-key.pem=certs/server-key.pem
```

Then deploy with stunnel enabled:

```yaml
# stunnel-values.yaml
auth:
  password: "securepassword"

stunnel:
  enabled: true
  port: 5433
  certificatesSecret: stunnel-certs
```

```bash
helm install postgresql ./postgresql -f stunnel-values.yaml
```

Connect through the TLS tunnel:

```bash
# Port-forward the stunnel port
kubectl port-forward svc/postgresql 5433:5433

# Connect using psql
psql -h localhost -p 5433 -U postgres -d postgres
```

### 4. With Prometheus Metrics

```yaml
# metrics-values.yaml
auth:
  password: "password"

metrics:
  enabled: true
  service:
    annotations:
      prometheus.io/scrape: "true"
      prometheus.io/port: "9187"
```

```bash
helm install postgresql ./postgresql -f metrics-values.yaml
```

## Upgrading

```bash
# Upgrade with new values
helm upgrade my-postgresql ./postgresql \
  --set persistence.size=50Gi

# Upgrade with new image version
helm upgrade my-postgresql ./postgresql \
  --set image.tag=16.5
```

## Uninstalling

```bash
# Uninstall release
helm uninstall my-postgresql

# Remove PVC (⚠️ This deletes all data!)
kubectl delete pvc data-my-postgresql-0
```

## Backup and Restore

### Manual Backup

```bash
# Create backup
kubectl exec -it my-postgresql-0 -- \
  pg_dump -U postgres postgres > backup.sql

# Restore backup
cat backup.sql | kubectl exec -i my-postgresql-0 -- \
  psql -U postgres postgres
```

### Automated Backup (CronJob)

Enable backup in values:

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 7
  size: 50Gi
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=postgresql

# View logs
kubectl logs my-postgresql-0

# Describe pod
kubectl describe pod my-postgresql-0
```

### Connection Issues

```bash
# Test from within cluster
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql -h my-postgresql -U postgres -d postgres

# Port forward for local access
kubectl port-forward svc/my-postgresql 5432:5432
psql -h localhost -U postgres -d postgres
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc

# Check PV
kubectl get pv

# Resize PVC (if storage class supports it)
kubectl patch pvc data-my-postgresql-0 -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'
```

## Security Considerations

1. **Always set a strong password** via `auth.password` or `auth.existingSecret`
2. **Use NetworkPolicy** to restrict access: `networkPolicy.enabled=true`
3. **Enable TLS** for production: `tls.enabled=true`
4. **Use RBAC** and limit service account permissions
5. **Regular backups** - enable automated backups
6. **Update regularly** - keep the image up to date

## License

MIT License - see [LICENSE](../../../LICENSE) for details.
