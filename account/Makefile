# =========================================
# 📦 XControl Account Service Makefile
# =========================================

APP_NAME    := xcontrol-account
MAIN_FILE   := ./cmd/accountsvc/main.go
PORT        ?= 8080
OS          := $(shell uname -s)

DB_NAME     := account
DB_USER     := shenlan
DB_PASS     := password
DB_HOST     := 127.0.0.1
DB_PORT     := 5432
DB_URL      := postgres://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable

REPLICATION_MODE ?= pgsync

DB_ADMIN_USER ?= $(DB_USER)
DB_ADMIN_PASS ?= $(DB_PASS)

SCHEMA_FILE := ./sql/schema.sql
PGLOGICAL_INIT_FILE := ./sql/schema_pglogical_init.sql
PGLOGICAL_PATCH_FILE := ./sql/schema_pglogical_patch.sql
PGLOGICAL_REGION_FILE := ./sql/schema_pglogical_region.sql

ACCOUNT_EXPORT_FILE ?= account-export.yaml
ACCOUNT_IMPORT_FILE ?= account-export.yaml
ACCOUNT_EMAIL_KEYWORD ?=
ACCOUNT_SYNC_CONFIG ?= config/sync.yaml
SUPERADMIN_USERNAME ?= Admin
SUPERADMIN_PASSWORD ?= ChangeMe
SUPERADMIN_EMAIL    ?= admin@svc.plus

export PATH := /usr/local/go/bin:$(PATH)

# =========================================
# 🧩 基础命令
# =========================================

.PHONY: all init build clean start stop restart dev test help \
	init-db-core init-db-replication init-db-pglogical \
	reinit-pglogical account-sync-push account-sync-pull account-sync-mirror create-db-user db-reset

all: build

help:
	@echo "🧭 XControl Account Service Makefile"
	@echo "make init               初始化 Go 环境与数据库"
	@echo "make init-db            执行数据库 schema（支持 REPLICATION_MODE=pgsync|pglogical）"
	@echo "make create-db-user     创建数据库用户并授权"
	@echo "make db-reset           重置整个 PostgreSQL 集群 (危险操作!)"
	@echo "make migrate-db         执行数据库迁移"
	@echo "make dump-schema        导出数据库 schema"
	@echo "make account-export     导出账号数据为 YAML"
	@echo "make account-import     从 YAML 导入账号数据"
	@echo "make create-super-admin 创建超级管理员"
	@echo "make reinit-db          重置业务 schema (不涉及 pglogical)"
	@echo "make reinit-pglogical   重新初始化 pglogical schema"
	@echo "make dev                热重载开发模式"
	@echo "make clean              清理构建产物"

# =========================================
# 🧰 初始化
# =========================================

init: init-go init-db

init-go:
	@echo ">>> 检查 Go 环境"
	@if ! command -v go >/dev/null; then \
		echo "未安装 Go，自动安装中..."; \
		([ "$(OS)" = "Darwin" ] && brew install go@1.24 && brew link --overwrite --force go@1.24) || \
		(sudo apt-get update && sudo apt-get install -y golang); \
	fi
	@echo ">>> 配置 Go Proxy"
	@(curl -fsSL --max-time 5 https://goproxy.cn >/dev/null && go env -w GOPROXY=https://goproxy.cn,direct) || \
	(go env -w GOPROXY=https://proxy.golang.org,direct)
	@go mod tidy

init-db:
	@echo ">>> 初始化数据库 schema"
	@command -v psql >/dev/null || (echo "❌ 未检测到 psql，请安装 PostgreSQL 客户端" && exit 1)
	@$(MAKE) init-db-core
	@$(MAKE) init-db-replication

init-db-core:
	@echo ">>> 初始化业务 schema ($(SCHEMA_FILE))"
	@psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(SCHEMA_FILE)

init-db-replication:
	@if [ "$(REPLICATION_MODE)" = "pglogical" ]; then \
		$(MAKE) init-db-pglogical; \
	else \
		echo ">>> 跳过 pglogical 初始化 (REPLICATION_MODE=$(REPLICATION_MODE))"; \
	fi

init-db-pglogical:
	@if [ -f $(PGLOGICAL_INIT_FILE) ]; then \
		echo ">>> 初始化 pglogical schema (REPLICATION_MODE=pglogical)"; \
		if PGPASSWORD="$(DB_ADMIN_PASS)" psql -h $(DB_HOST) -U $(DB_ADMIN_USER) -d $(DB_NAME) \
			-Atc "SELECT rolsuper FROM pg_roles WHERE rolname = current_user" 2>/dev/null | grep -qx 't'; then \
			PGPASSWORD="$(DB_ADMIN_PASS)" psql -h $(DB_HOST) -U $(DB_ADMIN_USER) -d $(DB_NAME) \
				-v ON_ERROR_STOP=1 -f $(PGLOGICAL_INIT_FILE); \
		elif psql "$(DB_URL)" -Atc "SELECT rolsuper FROM pg_roles WHERE rolname = current_user" | grep -qx 't'; then \
			psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(PGLOGICAL_INIT_FILE); \
		else \
			echo "⚠️ 当前用户非超级用户，跳过 pglogical 初始化"; \
		fi; \
	fi; \
	if [ -f $(PGLOGICAL_PATCH_FILE) ]; then \
		echo ">>> 应用 pglogical 默认值补丁"; \
		psql "$(DB_URL)" -v ON_ERROR_STOP=1 -f $(PGLOGICAL_PATCH_FILE); \
	fi

# =========================================
# 🧠 PGLogical 双节点初始化
# =========================================

init-pglogical-region:
	@[ -n "$(REGION_DB_URL)" ] || (echo "❌ 缺少 REGION_DB_URL"; exit 1)
	@[ -n "$(NODE_NAME)" ] || (echo "❌ 缺少 NODE_NAME"; exit 1)
	@[ -n "$(NODE_DSN)" ] || (echo "❌ 缺少 NODE_DSN"; exit 1)
	@[ -n "$(SUBSCRIPTION_NAME)" ] || (echo "❌ 缺少 SUBSCRIPTION_NAME"; exit 1)
	@[ -n "$(PROVIDER_DSN)" ] || (echo "❌ 缺少 PROVIDER_DSN"; exit 1)
	@psql "$(REGION_DB_URL)" -v ON_ERROR_STOP=1 \
		-v NODE_NAME="$(NODE_NAME)" \
		-v NODE_DSN="$(NODE_DSN)" \
		-v SUBSCRIPTION_NAME="$(SUBSCRIPTION_NAME)" \
		-v PROVIDER_DSN="$(PROVIDER_DSN)" \
		-f $(PGLOGICAL_REGION_FILE)

init-pglogical-region-cn:
	@$(MAKE) init-pglogical-region \
		REGION_DB_URL="$(DB_URL)" \
		NODE_NAME="node_cn" \
		NODE_DSN="host=cn-homepage.svc.plus port=5432 dbname=account user=pglogical password=xxxx" \
		SUBSCRIPTION_NAME="sub_from_global" \
		PROVIDER_DSN="host=global-homepage.svc.plus port=5432 dbname=account user=pglogical password=xxxx"

init-pglogical-region-global:
	@$(MAKE) init-pglogical-region \
		REGION_DB_URL="$(DB_URL)" \
		NODE_NAME="node_global" \
		NODE_DSN="host=global-homepage.svc.plus port=5432 dbname=account user=pglogical password=xxxx" \
		SUBSCRIPTION_NAME="sub_from_cn" \
		PROVIDER_DSN="host=cn-homepage.svc.plus port=5432 dbname=account user=pglogical password=xxxx"

# =========================================
# 📦 数据库迁移与管理
# =========================================

create-db-user:
	@echo ">>> 创建数据库用户 $(DB_USER)"
	@command -v psql >/dev/null || (echo "❌ 未检测到 psql，请安装 PostgreSQL 客户端" && exit 1)
	@echo "正在以 postgres 超级用户身份创建用户..."
	@sudo -u postgres psql -c "CREATE USER $(DB_USER) WITH PASSWORD '$(DB_PASS)';" || echo "⚠️ 用户可能已存在"
	@sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $(DB_NAME) TO $(DB_USER);"
	@echo "✓ 数据库用户创建完成"

migrate-db:
	@echo ">>> 执行数据库迁移"
	@go run ./cmd/migratectl/main.go migrate --dsn "$(DB_URL)" --dir sql/migrations

dump-schema:
	@echo ">>> 导出 schema 到 $(SCHEMA_FILE)"
	@pg_dump -s -O -x "$(DB_URL)" > $(SCHEMA_FILE)

db-reset:
	@echo "⚠️ 即将重置整个 PostgreSQL 数据库集群 ..."
	@read -p "确定要重置数据库集群? 这将删除所有数据! [y/N] " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo ">>> 停止 PostgreSQL 服务 ..."; \
		sudo systemctl stop postgresql; \
		echo ">>> 删除数据库集群 16 main ..."; \
		sudo pg_dropcluster --stop 16 main; \
		echo ">>> 清理数据目录 ..."; \
		sudo rm -rf /var/lib/postgresql/16/main; \
		echo ">>> 清理配置目录 ..."; \
		sudo rm -rf /etc/postgresql/16/main; \
		echo ">>> 创建新的数据库集群 ..."; \
		sudo pg_createcluster 16 main --start; \
		echo "✓ PostgreSQL 集群重置完成"; \
	else \
		echo "取消重置"; \
	fi

drop-db:
	@echo "⚠️  即将删除数据库 $(DB_NAME) ..."
	@read -p "确定要删除数据库 $(DB_NAME)? [y/N] " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo ">>> 强制断开现有连接 ..."; \
		if ! PGPASSWORD="$(DB_ADMIN_PASS)" psql -h $(DB_HOST) -U $(DB_ADMIN_USER) -d postgres \
			-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$(DB_NAME)' AND pid <> pg_backend_pid();"; then \
			echo "⚠️ 无法断开所有连接（需要超级用户权限）"; \
		fi; \
		echo ">>> 清理 pglogical schema ..."; \
		PGPASSWORD="$(DB_ADMIN_PASS)" psql -h $(DB_HOST) -U $(DB_ADMIN_USER) -d $(DB_NAME) \
			-c "DROP SCHEMA IF EXISTS pglogical CASCADE;" >/dev/null 2>&1 || \
			echo "⚠️ 无法删除 pglogical schema（数据库可能不存在或缺少权限）"; \
		echo ">>> 删除数据库 $(DB_NAME) ..."; \
		if PGPASSWORD="$(DB_ADMIN_PASS)" psql -h $(DB_HOST) -U $(DB_ADMIN_USER) -d postgres \
			-c "DROP DATABASE IF EXISTS $(DB_NAME);"; then \
			echo ">>> 数据库已删除"; \
		else \
			echo ">>> 删除失败"; \
		fi; \
	else \
		echo "取消删除"; \
	fi

reset-public-schema:
	@psql "$(DB_URL)" -v ON_ERROR_STOP=1 -v db_user="$(DB_USER)" -f sql/reset_public_schema.sql

reinit-db:
	@echo ">>> 重置业务 schema (sql/schema.sql)"
	@$(MAKE) reset-public-schema
	@$(MAKE) init-db-core

reinit-pglogical:
	@if [ "$(REPLICATION_MODE)" = "pglogical" ]; then \
		echo ">>> 重新初始化 pglogical schema"; \
		$(MAKE) init-db-pglogical; \
	else \
		echo ">>> 当前 REPLICATION_MODE=$(REPLICATION_MODE)，无需 pglogical 处理"; \
	fi

# =========================================
# 💾 账号导入导出
# =========================================

account-export:
	@go run ./cmd/migratectl/main.go export --dsn "$(DB_URL)" --output "$(ACCOUNT_EXPORT_FILE)" $(if $(ACCOUNT_EMAIL_KEYWORD),--email "$(ACCOUNT_EMAIL_KEYWORD)")

account-import:
	@[ -f "$(ACCOUNT_IMPORT_FILE)" ] || (echo "❌ 未找到文件 $(ACCOUNT_IMPORT_FILE)"; exit 1)
	@go run ./cmd/migratectl/main.go import --dsn "$(DB_URL)" --file "$(ACCOUNT_IMPORT_FILE)" \
	        $(if $(ACCOUNT_IMPORT_MERGE),--merge) \
	        $(if $(ACCOUNT_IMPORT_MERGE_STRATEGY),--merge-strategy "$(ACCOUNT_IMPORT_MERGE_STRATEGY)") \
	        $(if $(ACCOUNT_IMPORT_DRY_RUN),--dry-run) \
	        $(foreach UUID,$(ACCOUNT_IMPORT_MERGE_ALLOWLIST),--merge-allowlist $(UUID)) \
	        $(ACCOUNT_IMPORT_EXTRA_FLAGS)

account-sync-push:
	@[ -f "$(ACCOUNT_SYNC_CONFIG)" ] || (echo "❌ 未找到配置文件 $(ACCOUNT_SYNC_CONFIG)"; exit 1)
	@go run ./cmd/syncctl/main.go push --config "$(ACCOUNT_SYNC_CONFIG)"

account-sync-pull:
	@[ -f "$(ACCOUNT_SYNC_CONFIG)" ] || (echo "❌ 未找到配置文件 $(ACCOUNT_SYNC_CONFIG)"; exit 1)
	@go run ./cmd/syncctl/main.go pull --config "$(ACCOUNT_SYNC_CONFIG)"

account-sync-mirror:
	@[ -f "$(ACCOUNT_SYNC_CONFIG)" ] || (echo "❌ 未找到配置文件 $(ACCOUNT_SYNC_CONFIG)"; exit 1)
	@go run ./cmd/syncctl/main.go mirror --config "$(ACCOUNT_SYNC_CONFIG)"

create-super-admin:
	@[ -n "$(SUPERADMIN_USERNAME)" ] && [ -n "$(SUPERADMIN_PASSWORD)" ] || (echo "❌ 请指定用户名与密码"; exit 1)
	@go run ./cmd/createadmin/main.go \
		--driver postgres \
		--dsn "$(DB_URL)" \
		--username "$(SUPERADMIN_USERNAME)" \
		--password "$(SUPERADMIN_PASSWORD)" \
		--email "$(SUPERADMIN_EMAIL)"

# =========================================
# ⚙️ 编译与运行
# =========================================

build:
	@go build -o $(APP_NAME) $(MAIN_FILE)

upgrade: build
	systemctl stop xcontrol-account
	cp xcontrol-account /usr/bin/xcontrol-account
	systemctl start xcontrol-account

start: build
	@./$(APP_NAME) --config config/account.yaml

stop:
	@pkill -f "$(APP_NAME)" || echo "⚠️ 未找到运行进程"

restart: stop start

test:
	go test ./...

clean:
	rm -f $(APP_NAME) *.pid *.log
