# Quick Start Guide

Get PostgreSQL with extensions up and running in minutes.

## Prerequisites

Choose your deployment method:

- **Docker**: Docker 20.10+ and Docker Compose 2.0+
- **Kubernetes**: Kubernetes 1.19+ and Helm 3.0+

## Option 1: Docker Deployment (Fastest)

### 1. Build the Image

```bash
make build-postgres-image
```

### 2. Test Locally

```bash
make test-postgres
```

This starts a test container with all extensions enabled. Connect with:

```bash
psql -h localhost -U postgres -d postgres
# Password: testpass
```

### 3. Deploy with Docker Compose

```bash
cd deploy/docker
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD
docker-compose up -d
```

### 4. Verify Extensions

```bash
docker-compose exec postgres psql -U postgres -c "\dx"
```

You should see: `vector`, `pg_jieba`, `pgmq`, `pg_trgm`, `hstore`

## Option 2: Kubernetes Deployment

### 1. Build and Push Image

```bash
# Build image
make build-postgres-image

# Tag and push to your registry
docker tag postgres-extensions:16 your-registry.io/postgres-extensions:16
docker push your-registry.io/postgres-extensions:16
```

### 2. Install with Helm

```bash
helm install postgresql ./deploy/helm/postgresql \
  --set image.repository=your-registry.io/postgres-extensions \
  --set image.tag=16 \
  --set auth.password=your-secure-password \
  --set persistence.size=10Gi
```

### 3. Verify Deployment

```bash
kubectl get pods -l app.kubernetes.io/name=postgresql
kubectl logs -f postgresql-0
```

### 4. Connect to PostgreSQL

```bash
# Port forward
kubectl port-forward svc/postgresql 5432:5432

# Connect
psql -h localhost -U postgres -d postgres
```

## Advanced Deployments

### With Caddy (Automatic HTTPS)

```bash
cd deploy/docker
docker-compose -f docker-compose.yml -f docker-compose.caddy.yml up -d
```

Edit `Caddyfile` to configure your domain.

### With TLS Tunnel (stunnel)

```bash
# Generate certificates
cd deploy/docker
bash generate-certs.sh

# Start with tunnel
docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d

# Connect through encrypted tunnel
psql -h localhost -p 5433 -U postgres -d postgres
```

### Kubernetes with Stunnel

```bash
# Generate and create secret
cd deploy/docker
bash generate-certs.sh
kubectl create secret generic stunnel-certs \
  --from-file=server-cert.pem=certs/server-cert.pem \
  --from-file=server-key.pem=certs/server-key.pem

# Deploy with stunnel enabled
helm install postgresql ./deploy/helm/postgresql \
  --set auth.password=your-password \
  --set stunnel.enabled=true \
  --set stunnel.certificatesSecret=stunnel-certs
```

## Testing Extensions

Once connected, try these examples:

### pgvector (Semantic Search)

```sql
-- Create table with embeddings
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(3)
);

-- Insert sample data
INSERT INTO documents (content, embedding) VALUES
  ('Hello world', '[1,2,3]'),
  ('PostgreSQL rocks', '[4,5,6]'),
  ('Vector search', '[7,8,9]');

-- Similarity search
SELECT content, embedding <-> '[2,3,4]' AS distance
FROM documents
ORDER BY distance
LIMIT 3;
```

### pg_jieba (Chinese Full-Text Search)

```sql
-- Create table
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT
);

-- Insert Chinese content
INSERT INTO articles (title, content) VALUES
  ('测试文章', '我爱北京天安门，天安门上太阳升'),
  ('技术文档', 'PostgreSQL是世界上最先进的开源数据库');

-- Search with jieba tokenization
SELECT title, content
FROM articles
WHERE to_tsvector('jiebacfg', content) @@ to_tsquery('jiebacfg', '北京');
```

### pgmq (Message Queue)

```sql
-- Create a queue
SELECT pgmq.create('tasks');

-- Send messages
SELECT pgmq.send('tasks', '{"task": "process_order", "order_id": 123}');
SELECT pgmq.send('tasks', '{"task": "send_email", "to": "user@example.com"}');

-- Read messages (30 second visibility timeout)
SELECT * FROM pgmq.read('tasks', 30, 1);

-- Archive processed message
SELECT pgmq.archive('tasks', 1);
```

### JSONB + GIN (Document Store)

```sql
-- Create table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  data JSONB
);

-- Create GIN index
CREATE INDEX idx_products_data ON products USING gin(data);

-- Insert documents
INSERT INTO products (data) VALUES
  ('{"name": "Laptop", "price": 999, "tags": ["electronics", "computers"]}'),
  ('{"name": "Mouse", "price": 29, "tags": ["electronics", "accessories"]}');

-- Query with JSONB operators
SELECT data->>'name' AS name, data->>'price' AS price
FROM products
WHERE data @> '{"tags": ["electronics"]}';
```

## Next Steps

- Read the full documentation in `deploy/docker/README.md` or `deploy/helm/README.md`
- Configure backups
- Set up monitoring with Prometheus
- Tune performance in `postgresql.conf`
- Implement connection pooling with PgBouncer

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs postgres
# or
kubectl logs postgresql-0
```

### Can't connect

```bash
# Verify service is running
docker-compose ps
# or
kubectl get pods

# Test connection from container
docker-compose exec postgres pg_isready -U postgres
# or
kubectl exec postgresql-0 -- pg_isready -U postgres
```

### Extension not found

```bash
# List available extensions
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_available_extensions;"

# Check if extension files exist
docker-compose exec postgres ls -la /usr/share/postgresql/16/extension/
```

## Clean Up

### Docker

```bash
# Stop services
docker-compose down

# Remove volumes (⚠️ deletes all data)
docker-compose down -v

# Remove test container
make clean
```

### Kubernetes

```bash
# Uninstall release
helm uninstall postgresql

# Delete PVC (⚠️ deletes all data)
kubectl delete pvc data-postgresql-0
```

## Support

- Documentation: See `docs/` directory
- Issues: [GitHub Issues](https://github.com/your-org/postgresql.svc.plus/issues)
- License: MIT
