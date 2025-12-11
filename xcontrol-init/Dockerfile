# ============================================================
# Stage 1: Build createadmin (Go tool)
# ============================================================
FROM golang:1.25 AS builder

WORKDIR /workspace

# ------------------------------------------------------------
# 下载依赖（仅 account 模块的依赖即可满足 createadmin）
# ------------------------------------------------------------
COPY account/go.mod account/go.sum ./account/
RUN cd account && go mod download

# ------------------------------------------------------------
# 复制 account 模块源码（只复制一次更高效）
# ------------------------------------------------------------
COPY account ./account

# ------------------------------------------------------------
# 构建 createadmin 可执行文件
# ------------------------------------------------------------
RUN cd account && \
    CGO_ENABLED=0 GOOS=linux go build -o /createadmin ./cmd/createadmin/main.go



# ============================================================
# Stage 2: Runtime Image
# 用于作为 Kubernetes Init Container 使用
# ============================================================
FROM debian:12-slim

# ------------------------------------------------------------
# 安装 PostgreSQL 客户端、证书等最小运行依赖
# ------------------------------------------------------------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        postgresql-client \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ------------------------------------------------------------
# 拷贝 schema 文件到统一位置
# ------------------------------------------------------------
COPY account/sql /app/schemas/account
COPY rag-server/sql /app/schemas/rag

# ------------------------------------------------------------
# 拷贝 createadmin 工具
# ------------------------------------------------------------
COPY --from=builder /createadmin /usr/local/bin/createadmin

# ------------------------------------------------------------
# 拷贝初始化脚本（init-db.sh）
# ------------------------------------------------------------
COPY xcontrol-init/scripts/init-db.sh /usr/local/bin/init-db.sh
RUN chmod +x /usr/local/bin/init-db.sh

# ------------------------------------------------------------
# 设置入口点
# ------------------------------------------------------------
ENTRYPOINT ["/usr/local/bin/init-db.sh"]
