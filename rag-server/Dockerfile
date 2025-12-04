# =======================================================
# Stage 1 — Builder
# =======================================================
ARG GO_RUNTIME_IMAGE=ghcr.io/cloud-neutral-toolkit/go-runtime:latest

FROM ${GO_RUNTIME_IMAGE} AS builder
ARG GO_VERSION="1.24.5"

RUN apt-get update \
    && apt-get install -y --no-install-recommends make git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# =======================================================
# 安装 Go SDK（默认开启）
# =======================================================
RUN set -eux; \
    arch="$(uname -m)"; \
    case "$arch" in \
        x86_64|amd64) goarch="amd64" ;; \
        aarch64|arm64) goarch="arm64" ;; \
        *) echo "Unsupported arch: $arch"; exit 1 ;; \
    esac; \
    tarball="go${GO_VERSION}.linux-${goarch}.tar.gz"; \
    url="https://go.dev/dl/${tarball}"; \
    echo "=== Installing Go ${GO_VERSION} (${goarch}) ==="; \
    wget -q "$url" -O "/tmp/go.tgz"; \
    rm -rf /usr/local/go; \
    tar -C /usr/local -xzf "/tmp/go.tgz"; \
    rm /tmp/go.tgz; \
    echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh;

WORKDIR /src

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
