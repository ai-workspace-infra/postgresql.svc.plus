# =======================================================
# Stage 1 — Builder
# =======================================================
ARG GO_RUNTIME_IMAGE=ghcr.io/cloud-neutral-toolkit/go-runtime:latest

FROM ${GO_RUNTIME_IMAGE} AS builder

# 在 builder 中启用 Go SDK
ARG INSTALL_GO

WORKDIR /src

# 只安装 build 必需的工具（runtime 不会包含这些包）
RUN apt-get update \
    && apt-get install -y --no-install-recommends make git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 拷贝整个 monorepo（推荐：未来可以只 COPY rag-server）
COPY . .

# 编译 Go 服务（你的 Makefile 必须生成 /out/rag-server）
RUN make build && mkdir -p /out && cp rag-server /out/rag-server

# =======================================================
# Stage 2 — Runtime
# =======================================================
FROM ubuntu:24.04  AS runtime

WORKDIR /app

# runtime 只需要 TLS certs（这些在 go-runtime 里已安装）
# 如需额外依赖，可放到这里
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 拷贝构建产物
COPY --from=builder /out/rag-server /usr/local/bin/rag-server
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/etc/xcontrol/"]
EXPOSE 8090

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
