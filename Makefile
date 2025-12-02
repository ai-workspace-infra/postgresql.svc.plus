OS := $(shell uname -s)
SHELL := /bin/bash
O_BIN ?= /usr/local/go/bin
PG_MAJOR ?= 16
NODE_MAJOR ?= 22
BASE_IMAGE_DIR ?= deploy/base-images
OPENRESTY_IMAGE ?= xcontrol/openresty-geoip:latest
POSTGRES_EXT_IMAGE ?= xcontrol/postgres-extensions:16
NODE_BUILDER_IMAGE ?= xcontrol/node-builder:22
NODE_RUNTIME_IMAGE ?= xcontrol/node-runtime:22
ARCH := $(shell dpkg --print-architecture)
PG_DSN ?= postgres://shenlan:password@127.0.0.1:5432/xserver?sslmode=disable

ifeq ($(shell id -u),0)
SUDO :=
else
SUDO ?= sudo
endif

HOSTS_FILE ?= /etc/hosts
HOSTS_IP ?= 127.0.0.1
HOSTS_DOMAINS ?= dev-accounts.svc.plus dev-api.svc.plus

ifeq ($(OS),Darwin)
NGINX_PREFIX ?= /opt/homebrew/openresty/nginx
NGINX_MAIN_TEMPLATE ?= example/macos/openresty/nginx.conf
else
NGINX_PREFIX ?= /usr/local/openresty/nginx
endif

NGINX_CONF_ROOT ?= $(NGINX_PREFIX)/conf
NGINX_CONF_DIR ?= $(NGINX_CONF_ROOT)/conf.d
NGINX_MAIN_CONF ?= $(NGINX_CONF_ROOT)/nginx.conf

NGINX_SIT_CONFIGS := example/sit/nginx/nginx.conf
NGINX_SIT_CONFIGS += example/sit/nginx/dev.svc.plus.conf
NGINX_SIT_CONFIGS += example/sit/nginx/dev-api.svc.plus.conf
NGINX_SIT_CONFIGS := example/sit/nginx/dev-accounts.svc.plus.conf

NGINX_PROD_CONFIGS := example/prod/nginx/nginx.conf
NGINX_PROD_CONFIGS := example/prod/nginx/dev.svc.plus.conf
NGINX_PROD_CONFIGS := example/prod/nginx/api.svc.plus.conf
NGINX_PROD_CONFIGS := example/prod/nginx/accounts.svc.plus.conf

NGINX_ALL_CONFIGS := $(NGINX_SIT_CONFIGS) $(NGINX_PROD_CONFIGS)

export PATH := $(GO_BIN):$(PATH)

# -----------------------------------------------------------------------------
# Environment bootstrap (hosts & services)
# -----------------------------------------------------------------------------

init: configure-hosts init-nginx init-account init-rag-server

install-services: configure-hosts install-nginx install-account install-rag-server

upgrade-services: configure-hosts upgrade-nginx upgrade-account upgrade-rag-server

configure-hosts:
	@set -e; \
	if [ ! -f "$(HOSTS_FILE)" ]; then \
		echo "⚠️ Hosts file $(HOSTS_FILE) not found; skipping host configuration."; \
	else \
		for domain in $(HOSTS_DOMAINS); do \
			if grep -qE "^[[:space:]]*$(HOSTS_IP)[[:space:]]+.*\b$$domain\b" "$(HOSTS_FILE)"; then \
				echo "✅ Hosts entry exists for $$domain"; \
			else \
				echo "➕ Adding $(HOSTS_IP) $$domain to $(HOSTS_FILE)"; \
				echo "$(HOSTS_IP) $$domain" | $(SUDO) tee -a "$(HOSTS_FILE)" >/dev/null; \
			fi; \
		done; \
	fi

init-nginx:
	@$(SUDO) mkdir -p "$(NGINX_CONF_DIR)"
	@if [ -n "$(NGINX_MAIN_TEMPLATE)" ]; then \
                if [ -f "$(NGINX_MAIN_CONF)" ]; then \
                        if cmp -s "$(NGINX_MAIN_TEMPLATE)" "$(NGINX_MAIN_CONF)"; then \
                                echo "✅ $(NGINX_MAIN_CONF) already up to date"; \
                        else \
                                echo "⬆️ Updating $(NGINX_MAIN_CONF) from template"; \
                                $(SUDO) install -m 0644 "$(NGINX_MAIN_TEMPLATE)" "$(NGINX_MAIN_CONF)"; \
                        fi; \
                else \
                        echo "➕ Installing $(NGINX_MAIN_CONF)"; \
                        $(SUDO) install -m 0644 "$(NGINX_MAIN_TEMPLATE)" "$(NGINX_MAIN_CONF)"; \
                fi; \
        fi
	@for file in $(NGINX_ALL_CONFIGS); do \
                dest="$(NGINX_CONF_DIR)/$$(basename $$file)"; \
                if [ -f "$$dest" ]; then \
                        echo "✅ $$dest already exists; skipping"; \
                else \
                        echo "➕ Installing $$dest"; \
                        $(SUDO) install -m 0644 "$$file" "$$dest"; \
                fi; \
        done

install-nginx: init-nginx reload-openresty

upgrade-nginx:
	@$(SUDO) mkdir -p "$(NGINX_CONF_DIR)"
	@if [ -n "$(NGINX_MAIN_TEMPLATE)" ]; then \
                echo "⬆️ Updating $(NGINX_MAIN_CONF)"; \
                $(SUDO) install -m 0644 "$(NGINX_MAIN_TEMPLATE)" "$(NGINX_MAIN_CONF)"; \
        fi
	@for file in $(NGINX_ALL_CONFIGS); do \
                dest="$(NGINX_CONF_DIR)/$$(basename $$file)"; \
                echo "⬆️ Updating $$dest"; \
                $(SUDO) install -m 0644 "$$file" "$$dest"; \
        done
	@$(MAKE) reload-openresty

reload-openresty:
	@echo "🔄 Reloading OpenResty/Nginx if available..."
	@command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q '^openresty.service' && { \
		$(SUDO) systemctl reload openresty 2>/dev/null || $(SUDO) systemctl restart openresty 2>/dev/null || true; \
		echo "✅ openresty.service reloaded"; \
	} || echo "ℹ️ openresty.service not managed by systemd or systemctl missing; please reload manually."

init-account:
	@$(MAKE) -C account init

install-account:
	@$(MAKE) -C account build

upgrade-account:
	@$(MAKE) -C account upgrade

init-rag-server:
	@$(MAKE) -C rag-server init

install-rag-server:
	@$(MAKE) -C rag-server build

upgrade-rag-server:
	@$(MAKE) -C rag-server build
	@$(MAKE) -C rag-server restart

.PHONY: install install-openresty install-redis install-postgresql init-db \
        build update-dashboard-manifests build-server build-dashboard \
        start start-openresty start-server start-dashboard \
        stop stop-server stop-dashboard stop-openresty restart lint-cms \
        init init-nginx install-nginx upgrade-nginx reload-openresty \
        init-account install-account upgrade-account \
        init-rag-server install-rag-server upgrade-rag-server \
        configure-hosts install-services upgrade-services \
        build-base-images docker-openresty-geoip docker-postgres-extensions \
        docker-node-builder docker-node-runtime

# -----------------------------------------------------------------------------
# Dependency installation
# -----------------------------------------------------------------------------

install: install-nodejs install-go install-openresty install-redis install-postgresql

# --- Node.js ---------------------------------------------------------------
install-nodejs:
ifeq ($(OS),Darwin)
	( brew install node@22 && brew link --overwrite --force node@22 ) || brew install node
	corepack enable || true
	corepack prepare yarn@stable --activate || true
	@echo "✅ Node: $$(node -v)"; echo "✅ Yarn: $$(yarn -v 2>/dev/null || echo n/a)"
else
	@echo "🟦 Installing Node.js $(NODE_MAJOR) via setup_ubuntu_2204.sh..."
	NODE_MAJOR=$(NODE_MAJOR) bash scripts/setup_ubuntu_2204.sh install-nodejs
endif

# --- Go --------------------------------------------------------------------
install-go:
ifeq ($(OS),Darwin)
	brew install go
else
	GO_VERSION=$(GO_VERSION) bash scripts/setup_ubuntu_2204.sh install-go
endif

# --- OpenResty -------------------------------------------------------------
install-openresty:
	@echo "🚀 Installing OpenResty using external script..."
	@bash scripts/install-openresty.sh; \

# --- Redis -----------------------------------------------------------------
install-redis:
ifeq ($(OS),Darwin)
	brew install redis && brew services start redis
else
	@echo "🟥 Installing Redis via setup_ubuntu_2204.sh..."
	bash scripts/setup_ubuntu_2204.sh install-redis
endif

# --- PostgreSQL ------------------------------------------------------------
install-postgresql:
ifeq ($(OS),Darwin)
	@set -e; \
		echo "🍎 Installing PostgreSQL 16 via Homebrew..."; \
		brew install postgresql@16 || true; \
		brew services start postgresql@16; \
		echo "📦 Installing pgvector extension..."; \
		brew install pgvector || true; \
		echo "📦 Installing pg_jieba (替代 zhparser + scws)..."; \
		tmp_dir=$$(mktemp -d) && cd $$tmp_dir && \
			git clone --recursive https://github.com/jaiminpan/pg_jieba.git && \
			cd pg_jieba && mkdir build && cd build && \
			cmake -DPostgreSQL_TYPE_INCLUDE_DIR=$$(brew --prefix postgresql@16)/include/postgresql/server .. && \
			make -j$$(sysctl -n hw.ncpu) && sudo make install && \
			cd / && rm -rf $$tmp_dir; \
		echo "✅ PostgreSQL extensions installed successfully!"
else
	@set -e; \
		echo "🟨 Installing PostgreSQL 16..."; \
		bash scripts/setup_ubuntu_2204.sh install-postgresql; \
		echo "🟨 Installing pgvector extension..."; \
		bash scripts/setup_ubuntu_2204.sh install-pgvector; \
		echo "🟨 Installing pg_jieba extension (替代 zhparser + scws)..."; \
		tmp_dir=$$(mktemp -d) && cd $$tmp_dir && \
			sudo apt-get install -y cmake g++ git postgresql-server-dev-${PG_MAJOR}; \
			git clone --recursive https://github.com/jaiminpan/pg_jieba.git && \
			cd pg_jieba && mkdir build && cd build && \
			cmake -DPostgreSQL_TYPE_INCLUDE_DIR=/usr/include/postgresql/${PG_MAJOR}/server .. && \
			make -j$$(nproc) && sudo make install && \
			cd / && rm -rf $$tmp_dir; \
		echo "✅ PostgreSQL extensions installed successfully!"
endif

# -----------------------------------------------------------------------------
# Base container images
# -----------------------------------------------------------------------------

build-base-images:
	@OPENRESTY_IMAGE=$(OPENRESTY_IMAGE) POSTGRES_EXT_IMAGE=$(POSTGRES_EXT_IMAGE) \
	NODE_BUILDER_IMAGE=$(NODE_BUILDER_IMAGE) NODE_RUNTIME_IMAGE=$(NODE_RUNTIME_IMAGE) \
		bash scripts/build-base-images.sh

docker-openresty-geoip:
	docker build -f $(BASE_IMAGE_DIR)/openresty-geoip.Dockerfile -t $(OPENRESTY_IMAGE) $(BASE_IMAGE_DIR)

docker-postgres-extensions:
	docker build -f $(BASE_IMAGE_DIR)/postgres-extensions.Dockerfile -t $(POSTGRES_EXT_IMAGE) $(BASE_IMAGE_DIR)

docker-node-builder:
	docker build -f $(BASE_IMAGE_DIR)/node-builder.Dockerfile -t $(NODE_BUILDER_IMAGE) $(BASE_IMAGE_DIR)

docker-node-runtime:
	docker build -f $(BASE_IMAGE_DIR)/node-runtime.Dockerfile -t $(NODE_RUNTIME_IMAGE) $(BASE_IMAGE_DIR)

# -----------------------------------------------------------------------------
# Database initialization
# -----------------------------------------------------------------------------
init-db:
@psql $(PG_DSN) -f rag-server/sql/schema.sql

# -----------------------------------------------------------------------------
# Build targets
# -----------------------------------------------------------------------------
build: update-dashboard-manifests build-cli build-server build-dashboard

build-cli:
	$(MAKE) -C rag-server/cmd/rag-server-cli build

build-server:
	$(MAKE) -C rag-server build

build-dashboard:
	$(MAKE) -C dashboard build SKIP_SYNC=1

update-dashboard-manifests:
	$(MAKE) -C dashboard sync-dl-index

# -----------------------------------------------------------------------------
# Run targets
# -----------------------------------------------------------------------------
start: start-openresty start-server start-dashboard

start-server:
	$(MAKE) -C rag-server start

start-dashboard:
	$(MAKE) -C dashboard start

stop: stop-server stop-dashboard stop-openresty

stop-server:
	$(MAKE) -C rag-server stop

stop-dashboard:
	$(MAKE) -C dashboard stop

start-openresty:
ifeq ($(OS),Darwin)
	@brew services start openresty >/dev/null 2>&1 || \
	( echo "Creating LaunchAgent for OpenResty..." && \
	  mkdir -p ~/Library/LaunchAgents && \
	  printf '%s\n' '<?xml version="1.0" encoding="UTF-8?>' \
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
		'<plist version="1.0"><dict>' \
		'  <key>Label</key><string>homebrew.mxcl.openresty</string>' \
		'  <key>ProgramArguments</key>' \
		'  <array>' \
		'    <string>/opt/homebrew/openresty/nginx/sbin/nginx</string>' \
		'    <string>-g</string>' \
		'    <string>daemon off;</string>' \
		'  </array>' \
		'  <key>RunAtLoad</key><true/>' \
		'</dict></plist>' \
		> ~/Library/LaunchAgents/homebrew.mxcl.openresty.plist && \
	  brew services start ~/Library/LaunchAgents/homebrew.mxcl.openresty.plist )
else
	sudo systemctl enable --now openresty || echo "⚠️ openresty.service missing or inactive"
endif

stop-openresty:
ifeq ($(OS),Darwin)
	-brew services stop openresty >/dev/null 2>&1
else
	-sudo systemctl stop openresty >/dev/null 2>&1
endif

restart: stop start

# -----------------------------------------------------------------------------
# CMS configuration validation
# -----------------------------------------------------------------------------
lint-cms:
	python3 scripts/validate_cms_config.py
