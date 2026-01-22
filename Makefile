# PostgreSQL Service Plus - Simplified Makefile

.PHONY: help build-postgres-image push-postgres-image test-postgres \
        deploy-docker deploy-helm clean

# Image configuration
POSTGRES_IMAGE_NAME ?= postgres-extensions
POSTGRES_IMAGE_TAG ?= 16
POSTGRES_FULL_IMAGE ?= $(POSTGRES_IMAGE_NAME):$(POSTGRES_IMAGE_TAG)

# Build arguments
PG_MAJOR ?= 16
PG_VERSION ?= 16.4
PG_JIEBA_VERSION ?= v2.0.1
PG_VECTOR_VERSION ?= v0.8.1
PGMQ_VERSION ?= v1.8.0

# Docker registry (customize for your environment)
DOCKER_REGISTRY ?= 
DOCKER_IMAGE ?= $(DOCKER_REGISTRY)$(POSTGRES_FULL_IMAGE)

help:
	@echo "PostgreSQL Service Plus - Available targets:"
	@echo ""
	@echo "  build-postgres-image  - Build the PostgreSQL runtime image with extensions"
	@echo "  push-postgres-image   - Push image to registry (set DOCKER_REGISTRY)"
	@echo "  test-postgres         - Run a test container locally"
	@echo "  deploy-docker         - Deploy using Docker Compose"
	@echo "  deploy-helm           - Deploy using Helm chart"
	@echo "  clean                 - Stop and remove test containers"
	@echo ""
	@echo "Configuration:"
	@echo "  POSTGRES_IMAGE_NAME   = $(POSTGRES_IMAGE_NAME)"
	@echo "  POSTGRES_IMAGE_TAG    = $(POSTGRES_IMAGE_TAG)"
	@echo "  DOCKER_REGISTRY       = $(DOCKER_REGISTRY)"
	@echo "  PG_MAJOR              = $(PG_MAJOR)"
	@echo "  PG_VERSION            = $(PG_VERSION)"

build-postgres-image:
	@echo "🔨 Building PostgreSQL $(PG_VERSION) with extensions..."
	docker build \
		-f deploy/base-images/postgres-runtime-wth-extensions.Dockerfile \
		--build-arg PG_MAJOR=$(PG_MAJOR) \
		--build-arg PG_VERSION=$(PG_VERSION) \
		--build-arg PG_JIEBA_VERSION=$(PG_JIEBA_VERSION) \
		--build-arg PG_VECTOR_VERSION=$(PG_VECTOR_VERSION) \
		--build-arg PGMQ_VERSION=$(PGMQ_VERSION) \
		-t $(POSTGRES_FULL_IMAGE) \
		deploy/base-images/
	@echo "✅ Image built: $(POSTGRES_FULL_IMAGE)"

push-postgres-image: build-postgres-image
	@if [ -z "$(DOCKER_REGISTRY)" ]; then \
		echo "❌ DOCKER_REGISTRY not set. Example: make push-postgres-image DOCKER_REGISTRY=myregistry.io/"; \
		exit 1; \
	fi
	@echo "📤 Pushing $(DOCKER_IMAGE)..."
	docker tag $(POSTGRES_FULL_IMAGE) $(DOCKER_IMAGE)
	docker push $(DOCKER_IMAGE)
	@echo "✅ Image pushed: $(DOCKER_IMAGE)"

test-postgres: build-postgres-image
	@echo "🧪 Starting test PostgreSQL container..."
	docker run -d \
		--name postgres-test \
		-e POSTGRES_PASSWORD=testpass \
		-p 5432:5432 \
		$(POSTGRES_FULL_IMAGE)
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 5
	@echo "✅ Testing extensions..."
	@docker exec postgres-test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;" || true
	@docker exec postgres-test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS pg_jieba;" || true
	@docker exec postgres-test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS pgmq;" || true
	@docker exec postgres-test psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true
	@docker exec postgres-test psql -U postgres -c "\dx" | grep -E "vector|jieba|pgmq|trgm"
	@echo "✅ Test container running. Connect with:"
	@echo "   psql -h localhost -U postgres -d postgres"
	@echo "   Password: testpass"
	@echo ""
	@echo "Stop with: make clean"

deploy-docker:
	@echo "🚀 Deploying with Docker Compose..."
	cd deploy/docker && docker-compose up -d
	@echo "✅ PostgreSQL deployed. Check status with:"
	@echo "   cd deploy/docker && docker-compose ps"

deploy-helm:
	@echo "🚀 Deploying with Helm..."
	@if ! command -v helm &> /dev/null; then \
		echo "❌ Helm not found. Please install Helm first."; \
		exit 1; \
	fi
	helm upgrade --install postgresql ./deploy/helm/postgresql \
		--set image.repository=$(POSTGRES_IMAGE_NAME) \
		--set image.tag=$(POSTGRES_IMAGE_TAG) \
		--create-namespace
	@echo "✅ PostgreSQL deployed via Helm. Check status with:"
	@echo "   kubectl get pods -l app.kubernetes.io/name=postgresql"

clean:
	@echo "🧹 Cleaning up test containers..."
	-docker stop postgres-test 2>/dev/null || true
	-docker rm postgres-test 2>/dev/null || true
	@echo "✅ Cleanup complete"
