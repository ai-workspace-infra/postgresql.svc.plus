# ------------------------------
# Stage 1 — Build
# ------------------------------
FROM golang:1.24 AS builder

WORKDIR /src

# 先复制 go.mod / go.sum，使 Docker 构建缓存可复用
COPY go.mod go.sum ./
RUN go mod download

# 复制剩余源码
COPY . .

# 编译 rag-server
RUN CGO_ENABLED=0 go build -o rag-server ./cmd/xcontrol-server/main.go

# ------------------------------
# Stage 2 — Runtime
# ------------------------------
FROM ubuntu:24.04

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/rag-server /usr/local/bin/rag-server
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
