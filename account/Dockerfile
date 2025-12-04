# ------------------------------
# Stage 1 — Build
# ------------------------------
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

COPY . .
RUN make build && make -pv /out/ && cp account /out/

# ------------------------------
# Stage 2 — Runtime
# ------------------------------
FROM ubuntu:24.04  AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /out/account /usr/local/bin/account
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN mkdir -p /etc/xcontrol/ && chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/etc/xcontrol/"]

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/account-entrypoint.sh"]
CMD []
