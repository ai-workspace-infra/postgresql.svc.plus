# ------------------------------
# Stage 1 — Build
# ------------------------------
ARG GO_RUNTIME_IMAGE=ghcr.io/cloud-neutral-toolkit/go-runtime:latest
FROM ${GO_RUNTIME_IMAGE} AS builder

FROM golang:1.22 AS builder

WORKDIR /workspace/account
COPY account/ .   # <-- 关键：只拷贝 rag-server 目录

RUN make build \
 && mkdir -p /out \
 && cp xcontrol-account /out/account

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
