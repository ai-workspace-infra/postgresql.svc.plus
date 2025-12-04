# =======================================================
# XControl Go Runtime Base Image
# - 用于所有静态编译的 Go 服务
# - 可选安装 Go SDK（用于 build 阶段）
# - 多架构安全（amd64/arm64 自动识别）
# =======================================================

FROM ubuntu:24.04

LABEL maintainer="XControl" \
      org.opencontainers.image.title="go-runtime" \
      org.opencontainers.image.description="Slim Ubuntu runtime base for Go services with TLS certificates + optional Go SDK" \
      org.opencontainers.image.licenses="Apache-2.0"

# ---- Runtime 基础环境 ----
ENV CGO_ENABLED=0 \
    TZ=Etc/UTC

ARG INSTALL_GO="false"
ARG GO_VERSION="1.24.5"

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        tzdata \
        wget \
        tar; \
    rm -rf /var/lib/apt/lists/*

# =======================================================
# 可选：安装 Go SDK（用于 make build 的情况）
# =======================================================
RUN if [ "$INSTALL_GO" = "true" ]; then \
      set -eux; \
      arch="$(uname -m)"; \
      case "$arch" in \
          x86_64|amd64) goarch="amd64" ;; \
          aarch64|arm64) goarch="arm64" ;; \
          *) echo "Unsupported arch: $arch"; exit 1 ;; \
      esac; \
      tarball="go${GO_VERSION}.linux-${goarch}.tar.gz"; \
      url="https://go.dev/dl/${tarball}"; \
      echo "Installing Go ${GO_VERSION} for ${goarch}"; \
      wget -q "$url" -O "/tmp/go.tgz"; \
      rm -rf /usr/local/go; \
      tar -C /usr/local -xzf "/tmp/go.tgz"; \
      rm /tmp/go.tgz; \
      echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh; \
    fi

ENV PATH="${PATH}:/usr/local/go/bin"

# ---- 应用目录 ----
WORKDIR /app

# ---- 默认 shell 入口（最终服务会覆盖 CMD） ----
CMD ["/bin/sh"]
